import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

import jwt
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from mysql.connector import IntegrityError
from pwdlib import PasswordHash
from pydantic import BaseModel, EmailStr, Field

from typing import Optional

import threading
from contextlib import asynccontextmanager

from system.backend.Services.image_worker import automatic_image_worker

# The news pipeline files import each other by name
# (e.g. "from news_service import ..."), so the Services
# folder is added to Python's search path.
SERVICES_DIR = Path(__file__).resolve().parent / "Services"

if str(SERVICES_DIR) not in sys.path:
    sys.path.insert(0, str(SERVICES_DIR))

from system.backend.database.database import (
    get_database_connection,
    get_map_articles,
)
from system.backend.Services.analytics_service import (
    get_summary_statistics,
    get_category_distribution,
    get_geotagging_distribution,
    get_publication_timeline,
)
from system.backend.database.database import (
    get_headline_articles,
    get_news_status,
)
from system.backend.Services.summary_service import summarize_article
from system.backend.Services.popularity_service import (
    get_source_comparison,
    get_popular_news,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    worker = threading.Thread(
        target=automatic_image_worker,
        name="newscape-image-worker",
        daemon=True,
    )
    worker.start()

    yield


app = FastAPI(lifespan=lifespan)
password_hasher = PasswordHash.recommended()
report_bearer = HTTPBearer(auto_error=False)

# Allow the React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ReportRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


# HIDDEN ARTICLES
# Articles that an admin hid through a report are left out of the
# map and the news list (Aqsa's admin moderation).

def get_hidden_article_ids():
    with get_database_connection() as db:
        with db.cursor() as cursor:
            cursor.execute(
                """
                SELECT DISTINCT news_ID
                FROM ArticleReport
                WHERE status = 'article_hidden'
                """
            )
            return {row[0] for row in cursor.fetchall()}


from system.backend.Services.image_service import get_cached_image


def add_news_image(article):
    return {
        **article,
        "image_url": get_cached_image(article.get("url"))
    }

@app.get("/headlines")
def headlines():
    hidden_ids = get_hidden_article_ids()

    return [
        add_news_image(article)
        for article in get_headline_articles()
        if article["id"] not in hidden_ids
    ]

# NEWS STATUS API
# Tells the website how many articles are saved, so the Refresh
# button can show when new articles are waiting.

@app.get("/news-status")
def news_status():
    return get_news_status()


@app.get("/")
def home():
    return {"message": "NewScape backend is running"}


# MAP ARTICLES API
# Retrieves existing geotagged news without modifying database records.

@app.get("/articles")
def articles():
    map_articles = get_map_articles()
    hidden_ids = get_hidden_article_ids()

    return [
        add_news_image(article)
        for article in map_articles
        if article["id"] not in hidden_ids
    ]


# ANALYTICS SUMMARY API
# Returns total, map-available, and non-geotaggable article counts.

@app.get("/analytics/summary")
def analytics_summary():
    return get_summary_statistics()


# CATEGORY LEADERBOARD API
# Returns categories ranked by their stored article counts.

@app.get("/analytics/leaderboard")
def analytics_leaderboard():
    results = get_category_distribution()

    return [
        {
            "category": category,
            "count": count,
        }
        for category, count in results
    ]


# GEOTAGGING DISTRIBUTION API
# Returns counts for explicit, inferred, and other location types.

@app.get("/analytics/geotagging")
def analytics_geotagging():
    results = get_geotagging_distribution()

    return [
        {
            "location_type": location_type or "unknown",
            "count": count,
        }
        for location_type, count in results
    ]


# PUBLICATION TIMELINE API
# Calculates cumulative growth from daily publication counts.
# No database changes are made.

@app.get("/analytics/timeline")
def analytics_timeline():
    results = get_publication_timeline()

    cumulative_count = 0
    timeline = []

    for publication_date, daily_count in results:
        cumulative_count += daily_count

        timeline.append({
            "date": (
                publication_date.isoformat()
                if publication_date is not None
                else None
            ),
            "daily_count": daily_count,
            "cumulative_count": cumulative_count,
        })

    return timeline


# SOURCE COMPARISON API
# Counts how many stored articles come from each news source.

@app.get("/analytics/sources")
def source_comparison():
    return get_source_comparison()


# POPULAR NEWS API
# Groups similar headlines and ranks stories by how many
# different sources reported them.

@app.get("/analytics/popular")
def popular_news():
    return get_popular_news()


# ARTICLE SUMMARY API
# Returns a short AI summary of one article for the map popup.
# Uses the AdditionalAPIKEY Groq key. No database changes are made.

class SummaryRequest(BaseModel):
    title: str
    content: str = ""
    url: str = ""


@app.post("/summary")
def article_summary(request: SummaryRequest):
    return summarize_article(request.title, request.content, request.url)


# ======================================
# USER ACCOUNTS, ARTICLE REPORTS AND ADMIN MODERATION (Aqsa)
# ======================================
# Registration stores a hashed password. Login returns a signed
# token (JWT_SECRET in .env) that the website sends with reports
# and admin requests. Only accounts with role = 'admin' can review
# reports, dismiss them, or hide the reported article.

@app.post("/auth/register", status_code=201)
def register_account(request: RegisterRequest):
    name = request.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Please enter your name.")

    email = str(request.email).lower()
    password_hash = password_hasher.hash(request.password)

    with get_database_connection() as db:
        with db.cursor() as cursor:
            try:
                cursor.execute(
                    """
                    INSERT INTO RegisteredUser (username, email, password_hash)
                    VALUES (%s, %s, %s)
                    """,
                    (name, email, password_hash),
                )
                user_id = cursor.lastrowid
                db.commit()
            except IntegrityError as error:
                db.rollback()
                if error.errno == 1062:
                    raise HTTPException(
                        status_code=409,
                        detail="An account with that email already exists.",
                    ) from error
                raise

    return {"id": user_id, "name": name, "email": email}


@app.post("/auth/login")
def login_account(request: LoginRequest):
    email = str(request.email).lower()

    with get_database_connection() as db:
        with db.cursor(dictionary=True) as cursor:
            cursor.execute(
                """
                SELECT user_ID AS id, username AS name, email, password_hash
                FROM RegisteredUser
                WHERE email = %s
                """,
                (email,),
            )
            user = cursor.fetchone()

    if (
        not user
        or not user["password_hash"]
        or not password_hasher.verify(request.password, user["password_hash"])
    ):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    access_token = jwt.encode(
        {
            "sub": str(user["id"]),
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        },
        os.environ["JWT_SECRET"],
        algorithm="HS256",
    )

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "access_token": access_token,
        "token_type": "bearer",
    }


def get_reporting_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(report_bearer),
) -> int:
    unauthorized = HTTPException(
        status_code=401,
        detail="Log in to submit a report.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        claims = jwt.decode(
            credentials.credentials,
            os.environ["JWT_SECRET"],
            algorithms=["HS256"],
            options={"require": ["sub", "exp"]},
        )
        return int(claims["sub"])
    except (jwt.InvalidTokenError, ValueError) as error:
        raise unauthorized from error


@app.post("/articles/{news_id}/reports", status_code=201)
def submit_article_report(
    news_id: int,
    request: ReportRequest,
    user_id: int = Depends(get_reporting_user_id),
):
    reason = request.reason.strip()
    if not reason:
        raise HTTPException(status_code=422, detail="Please enter a reason.")

    with get_database_connection() as db:
        with db.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO ArticleReport (news_ID, user_ID, reason)
                SELECT news_ID, %s, %s
                FROM NewsItem
                WHERE news_ID = %s
                """,
                (user_id, reason, news_id),
            )
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Article not found.")

            report_id = cursor.lastrowid
            db.commit()

    return {"report_id": report_id, "status": "pending"}


def require_report_admin(user_id: int = Depends(get_reporting_user_id)) -> int:
    with get_database_connection() as db:
        with db.cursor() as cursor:
            cursor.execute(
                "SELECT role FROM RegisteredUser WHERE user_ID = %s",
                (user_id,),
            )
            account = cursor.fetchone()

    if account is None or account[0] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    return user_id


@app.get("/admin/reports", dependencies=[Depends(require_report_admin)])
def list_article_reports():
    with get_database_connection() as db:
        with db.cursor(dictionary=True) as cursor:
            cursor.execute(
                """
                SELECT r.report_ID AS report_id,
                       r.news_ID AS article_id,
                       n.title,
                       r.reason,
                       r.status,
                       r.created_at
                FROM ArticleReport r
                JOIN NewsItem n ON n.news_ID = r.news_ID
                ORDER BY r.created_at DESC, r.report_ID DESC
                """
            )
            return cursor.fetchall()


def resolve_article_report(report_id: int, status: str):
    with get_database_connection() as db:
        with db.cursor() as cursor:
            cursor.execute(
                """
                UPDATE ArticleReport
                SET status = %s
                WHERE report_ID = %s AND status = 'pending'
                """,
                (status, report_id),
            )

            if cursor.rowcount == 0:
                cursor.execute(
                    "SELECT status FROM ArticleReport WHERE report_ID = %s",
                    (report_id,),
                )
                report = cursor.fetchone()
                if report is None:
                    raise HTTPException(status_code=404, detail="Report not found.")
                if report[0] != status:
                    raise HTTPException(
                        status_code=409,
                        detail="This report has already been resolved.",
                    )

            db.commit()

    return {"report_id": report_id, "status": status}


@app.post(
    "/admin/reports/{report_id}/dismiss",
    dependencies=[Depends(require_report_admin)],
)
def dismiss_article_report(report_id: int):
    return resolve_article_report(report_id, "dismissed")


@app.post(
    "/admin/reports/{report_id}/hide",
    dependencies=[Depends(require_report_admin)],
)
def hide_reported_article(report_id: int):
    return resolve_article_report(report_id, "article_hidden")
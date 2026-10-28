from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from system.backend.database.database import get_map_articles
from system.backend.Services.analytics_service import (
    get_summary_statistics,
    get_category_distribution,
)

app = FastAPI()

# Allow the React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "NewScape backend is running"}


@app.get("/articles")
def articles():
    return get_map_articles()


# ANALYTICS API
# Returns existing summary statistics without modifying database records.

@app.get("/analytics/summary")
def analytics_summary():
    return get_summary_statistics()


# CATEGORY LEADERBOARD API
# Returns article counts by category without modifying database records.

@app.get("/analytics/leaderboard")
def analytics_leaderboard():
    return get_category_distribution()
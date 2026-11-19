"""
Database connection module for the NewScape Senior Project.

This module connects the Python backend to the shared TiDB Cloud
(MySQL-compatible) database used by the whole team.
Database credentials are loaded from the project's .env file so that
private information is not stored directly in the source code.
"""

import os
from pathlib import Path
from datetime import datetime

import certifi
import mysql.connector
from dotenv import load_dotenv


# Locate the .env file stored in the root folder of the project.
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_PATH = PROJECT_ROOT / ".env"

# Load database credentials from .env.
load_dotenv(ENV_PATH)


# DATABASE CONNECTION

# Connects to the shared TiDB Cloud database.
# TiDB Cloud only accepts encrypted (TLS) connections, so the
# certificate file is always passed. DB_SSL_CA can be set in .env;
# otherwise the certificate bundle from certifi is used, which works
# on both Mac and Windows.

def get_database_connection():
    # Create and return a connection to the NewScape database.

    ssl_ca = os.getenv("DB_SSL_CA") or certifi.where()

    # Certificate checking is on by default. If a Mac shows
    # "certificate verify failed", add DB_SSL_VERIFY=false to .env.
    ssl_verify = os.getenv("DB_SSL_VERIFY", "true").lower() != "false"

    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "4000")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        ssl_ca=ssl_ca,
        ssl_verify_cert=ssl_verify,
        ssl_verify_identity=ssl_verify
    )

    return connection


def test_database_connection():
    """
    Test whether the backend can successfully connect to the database.
    """

    connection = None

    try:
        connection = get_database_connection()

        if connection.is_connected():
            print("Successfully connected to NewsStoreSenior.")

    except mysql.connector.Error as error:
        print(f"Database connection failed: {error}")

    finally:
        if connection is not None and connection.is_connected():
            connection.close()
            print("Database connection closed safely.")


def show_database_tables():
    """
    Display the tables currently available in the NewScape database.
    This is used to verify that the backend can access the database schema.
    """

    connection = None

    try:
        connection = get_database_connection()
        cursor = connection.cursor()

        cursor.execute("SHOW TABLES;")

        print("\nTables in NewsStoreSenior:")

        for table in cursor.fetchall():
            print(f"- {table[0]}")

        cursor.close()

    except mysql.connector.Error as error:
        print(f"Could not retrieve database tables: {error}")

    finally:
        if connection is not None and connection.is_connected():
            connection.close()



# SOURCE DATABASE OPERATIONS

def get_or_create_source(source_name):
    """
    Return the ID of an existing news publisher or create the
    publisher if it has not previously been stored.
    """

    connection = get_database_connection()
    cursor = connection.cursor()

    try:
        # Check whether this publisher already exists.
        cursor.execute(
            "SELECT source_ID FROM Source WHERE source_Name = %s LIMIT 1;",
            (source_name,)
        )

        result = cursor.fetchone()

        if result:
            return result[0]

        # Add the publisher only if it does not already exist.
        cursor.execute(
            """
            INSERT INTO Source (source_Name, source_Type)
            VALUES (%s, %s);
            """,
            (source_name, "News Publisher")
        )

        connection.commit()

        return cursor.lastrowid

    finally:
        cursor.close()
        connection.close()




def article_exists(article_url):
    """
    Check whether an article URL is already stored in the database.

    This check is performed before AI processing so that previously
    stored articles do not use unnecessary AI or geocoding API calls.
    """
    if not article_url:
        return False

    connection = get_database_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT news_ID
            FROM NewsItem
            WHERE article_URL = %s
            LIMIT 1;
            """,
            (article_url,)
        )

        return cursor.fetchone() is not None

    finally:
        cursor.close()
        connection.close()



def article_title_exists(title):
    """
    Check whether an article with the same headline is already stored.

    The same story can be published by different sources with
    different URLs, so the headline is also checked before AI
    processing. Capitals and extra spaces are ignored.
    """
    if not title:
        return False

    connection = get_database_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT news_ID
            FROM NewsItem
            WHERE LOWER(TRIM(title)) = LOWER(TRIM(%s))
            LIMIT 1;
            """,
            (title,)
        )

        return cursor.fetchone() is not None

    finally:
        cursor.close()
        connection.close()



# NEWS ARTICLE DATABASE OPERATIONS

def insert_news_article(article):
    """
    Store one processed NewScape article in the database.

    Outside-UAE articles are ignored and are not stored.
    Duplicate article URLs are also ignored.
    """

    location_result = article.get("location", {})
    category_result = article.get("category", {})

    coordinates = location_result.get("coordinates")

    # Outside-UAE articles should not be stored in NewScape.
    if coordinates == [-2.0, -2.0] or coordinates == [-2, -2]:
        print("Skipped outside-UAE article:", article.get("title"))
        return False

    # Excluded content (mockery of the UAE, sexual content, etc.)
    # is marked -3 by the AI and is never stored.
    if coordinates == [-3.0, -3.0] or coordinates == [-3, -3]:
        print("Skipped excluded article:", article.get("title"))
        return False

    article_url = article.get("url")

    connection = get_database_connection()
    cursor = connection.cursor()

    try:
        # Check whether the article URL is already stored.
        cursor.execute(
            "SELECT news_ID FROM NewsItem WHERE article_URL = %s LIMIT 1;",
            (article_url,)
        )

        if cursor.fetchone():
            print("Skipped duplicate article:", article.get("title"))
            return False

        # Get the actual news publisher from the NewsAPI article.
        source = article.get("source") or {}
        source_name = source.get("name") or "Unknown"

        cursor.close()
        connection.close()

        source_id = get_or_create_source(source_name)

        # Open the connection again after resolving the source.
        connection = get_database_connection()
        cursor = connection.cursor()

        # Look the category up by NAME in the Category table.
        # The fixed IDs in category_mapping (e.g. Health = 10) do not
        # always match the IDs TiDB gave the categories, which stored
        # Health and Weather news under a missing or wrong category.
        category_id = get_category_id(
            category_result.get("category") or "Other"
        )

        location_type = location_result.get("location_type", "")
        location_type = location_type.lower()

        latitude = None
        longitude = None

        if coordinates and len(coordinates) == 2:
            latitude = coordinates[0]
            longitude = coordinates[1]

        # Convert the NewsAPI publication date into a datetime
        # format that can be stored in the MySQL DATETIME column.
        published_at = article.get("publishedAt")

        if published_at:
            published_at = datetime.fromisoformat(
                published_at.replace("Z", "+00:00")
            ).replace(tzinfo=None)

        cursor.execute(
            """
            INSERT INTO NewsItem (
                source_ID,
                category_ID,
                external_article_ID,
                title,
                content_Text,
                article_URL,
                published_datetime,
                latitude,
                longitude,
                location_Text,
                location_Type
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """,
            (
                source_id,
                category_id,
                article_url,
                article.get("title"),
                article.get("description") or article.get("content"),
                article_url,
                published_at,
                latitude,
                longitude,
                location_result.get("location"),
                location_type
            )
        )

        connection.commit()

        print("Stored article:", article.get("title"))

        return True

    except mysql.connector.Error as error:
        # The rollback itself fails when the connection to TiDB was
        # lost, which used to stop the whole run. Ignore that here so
        # the remaining articles can still be stored.
        try:
            connection.rollback()
        except mysql.connector.Error:
            pass

        print("Article database insert failed:", error)

        # Let store_processed_articles try this article again.
        if isinstance(error, (mysql.connector.errors.OperationalError,
                              mysql.connector.errors.InterfaceError)):
            raise

        return False

    finally:
        try:
            if cursor is not None:
                cursor.close()

            if connection is not None and connection.is_connected():
                connection.close()
        except mysql.connector.Error:
            pass



# DATABASE TEST OUTPUT

def print_stored_articles():
    """
    Display stored articles for testing and report evidence.
    """

    connection = get_database_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT
                n.news_ID,
                n.title,
                s.source_Name,
                c.category_Name,
                n.location_Text,
                n.location_Type,
                n.latitude,
                n.longitude
            FROM NewsItem n
            JOIN Source s ON n.source_ID = s.source_ID
            JOIN Category c ON n.category_ID = c.category_ID
            ORDER BY n.published_datetime DESC, n.news_ID DESC;
            """
        )

        articles = cursor.fetchall()

        print("\n")
        print("=" * 60)
        print("DATABASE RESULTS")
        print("=" * 60)
        print("Total stored articles:", len(articles))

        for article in articles:
            print("\n" + "-" * 60)
            print("News ID:", article[0])
            print("Title:", article[1])
            print("Source:", article[2])
            print("Category:", article[3])
            print("Location:", article[4])
            print("Location Type:", article[5])
            print("Coordinates:", [article[6], article[7]])

        print("\n" + "=" * 60)

    finally:
        cursor.close()
        connection.close()


# MAP ARTICLE RETRIEVAL
# INTEGRATION NOTE:
# This function comes from Hind's map backend.
# It reads existing articles from NewsStoreSenior for the React map.
# It does not insert, update, or delete database records.

def get_map_articles():
    """
    Retrieve articles already saved in MySQL.

    Only articles with approximate UAE coordinates are returned.

    This function DOES NOT fetch new news from the News API.
    """

    connection = get_database_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                n.news_ID AS id,
                n.title,
                """ + CATEGORY_NAME_SQL + """ AS category,
                n.location_Text AS location,
                n.latitude,
                n.longitude,
                n.article_URL AS url,
                n.content_Text AS content,
                n.location_Type AS location_type,
                n.published_datetime

            FROM NewsItem n

            LEFT JOIN Category c
                ON n.category_ID = c.category_ID

            WHERE n.latitude BETWEEN 22 AND 27
              AND n.longitude BETWEEN 51 AND 57

            ORDER BY n.published_datetime DESC, n.news_ID DESC;
            """
        )

        articles = cursor.fetchall()

        return articles

    finally:
        cursor.close()
        connection.close()


# CATEGORY NAME FOR DISPLAY
# Some older articles were saved with a fixed category number
# (for example Health = 10) that does not exist in the Category
# table, so they had no category name and never appeared under
# Health or Weather. For those articles, the name is taken from
# the numbers the pipeline used when saving them. Articles whose
# category number exists in the table keep the table's name.

CATEGORY_NAME_SQL = """
    COALESCE(
        c.category_Name,
        CASE n.category_ID
            WHEN 1 THEN 'Sports'
            WHEN 2 THEN 'Finance'
            WHEN 3 THEN 'Business'
            WHEN 4 THEN 'Technology'
            WHEN 5 THEN 'Entertainment'
            WHEN 6 THEN 'Education'
            WHEN 7 THEN 'Weather'
            WHEN 8 THEN 'Traffic & Transport'
            WHEN 10 THEN 'Health'
            ELSE 'Other'
        END
    )
"""


def get_category_id(category_name):
    """
    Return the category_ID for a category name.
    The category is added to the Category table if it is missing.
    """
    connection = get_database_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            "SELECT category_ID FROM Category WHERE category_Name = %s;",
            (category_name,)
        )
        row = cursor.fetchone()

        if row:
            return row[0]

        cursor.execute(
            "INSERT INTO Category (category_Name) VALUES (%s);",
            (category_name,)
        )
        connection.commit()

        return cursor.lastrowid

    finally:
        cursor.close()
        connection.close()


def get_news_status():
    """
    Count the stored articles that are visible on the website
    (hidden articles are not counted). Used by the Refresh button
    to know when new articles have been saved.
    """
    connection = get_database_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM NewsItem
            WHERE news_ID NOT IN (
                SELECT news_ID
                FROM ArticleReport
                WHERE status = 'article_hidden'
            );
            """
        )

        return {"total_articles": cursor.fetchone()[0]}

    finally:
        cursor.close()
        connection.close()


def get_headline_articles():
    """
    Retrieve stored news for the Latest News panel.
    Includes articles without usable coordinates.
    Does not modify database records.
    """
    connection = get_database_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                n.news_ID AS id,
                n.title,
                """ + CATEGORY_NAME_SQL + """ AS category,
                n.location_Text AS location,
                n.location_Type AS location_type,
                n.latitude,
                n.longitude,
                n.article_URL AS url,
                n.content_Text AS content,
                n.published_datetime
            FROM NewsItem n
            LEFT JOIN Category c
                ON n.category_ID = c.category_ID
            ORDER BY n.published_datetime DESC, n.news_ID DESC;
            """
        )

        return cursor.fetchall()

    finally:
        cursor.close()
        connection.close()


# Run the connection test only when this file is executed directly.
if __name__ == "__main__":
    test_database_connection()
    show_database_tables()
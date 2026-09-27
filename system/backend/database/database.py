"""
Database connection module for the NewScape Senior Project.

This module connects the Python backend to the local MySQL database.
Database credentials are loaded from the project's .env file so that
private information is not stored directly in the source code.
"""

import os
from pathlib import Path
from datetime import datetime

import mysql.connector
from dotenv import load_dotenv


# Locate the .env file stored in the root folder of the project.
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_PATH = PROJECT_ROOT / ".env"

# Load database credentials from .env.
load_dotenv(ENV_PATH)


def get_database_connection():
    # Create and return a connection to the NewScape MySQL database.

    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
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

        category_id = category_result.get("category_id")

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
        connection.rollback()
        print("Article database insert failed:", error)
        return False

    finally:
        if cursor is not None:
            cursor.close()

        if connection is not None and connection.is_connected():
            connection.close()



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
            ORDER BY n.news_ID DESC;
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


# Run the connection test only when this file is executed directly.
if __name__ == "__main__":
    test_database_connection()
    show_database_tables()
"""
Article processing service for the NewScape Senior Project.

This module connects the news retrieval component with the AI processing
component. Retrieved articles are passed through location inference,
geocoding, and category classification before database storage.
"""

import time

import sys
from pathlib import Path

# Add the backend folder to Python's module search path so that
# this service can access the database module.
BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from news_service import retrieve_initial_news
from ai_service import detect_event_location_groq, classify_article_groq, category_mapping
from database.database import insert_news_article, print_stored_articles



# ARTICLE PROCESSING

def process_articles(articles, max_articles=None):
    """
    Process retrieved news articles using the NewScape AI components.

    Each article is passed through:
    1. Location inference and geocoding.
    2. Category classification.

    max_articles can be used during testing to limit the number of
    articles sent to the APIs.
    """

    processed_articles = []

    # Limit the number of articles during testing if requested.
    if max_articles is not None:
        articles = articles[:max_articles]

    for article in articles:

        title = article.get("title", "")
        article_text = article.get("description") or article.get("content") or ""

        print("Processing:", title)



        # LOCATION INFERENCE

        try:
            location_result = detect_event_location_groq(title, article_text)

        except Exception as error:
            print("Location inference failed:", error)
            print("Retrying in 5 seconds...")

            time.sleep(5)

            try:
                location_result = detect_event_location_groq(title, article_text)

            except Exception as error:
                print("Location inference failed again:", error)
                print("Skipping article.")
                continue

        # Wait between Groq API calls to reduce the chance of
        # hitting the API rate limit.
        time.sleep(5)



        # CATEGORY CLASSIFICATION

        try:
            category_result = classify_article_groq(title, article_text)

        except Exception as error:
            print("Category classification failed:", error)
            print("Retrying in 5 seconds...")

            time.sleep(5)

            try:
                category_result = classify_article_groq(title, article_text)

            except Exception as error:
                print("Category classification failed again:", error)
                print("Skipping article.")
                continue

        # Convert the category selected by the AI into the
        # corresponding category ID used by the database.
        category_result["category_id"] = category_mapping.get(
            category_result.get("category"), 9
        )

        # Wait before processing the next article to reduce the
        # chance of hitting the API rate limit.
        time.sleep(15)



        # COMBINE ARTICLE RESULTS

        processed_article = {
            "source": article.get("source"),
            "title": title,
            "description": article.get("description"),
            "content": article.get("content"),
            "url": article.get("url"),
            "urlToImage": article.get("urlToImage"),
            "publishedAt": article.get("publishedAt"),
            "location": location_result,
            "category": category_result
        }

        processed_articles.append(processed_article)

        print("Location result:", location_result)
        print("Category result:", category_result)

    return processed_articles



# DISPLAY PROCESSED ARTICLES

def print_processed_articles(processed_articles):
    """
    Display processed article results in a clear format for
    testing, verification, and project documentation.
    """

    print("\n")
    print("=" * 60)
    print("AI PROCESSING RESULTS")
    print("=" * 60)

    print(f"\nArticles processed: {len(processed_articles)}")

    for index, article in enumerate(processed_articles, start=1):

        print("\n" + "-" * 60)
        print(f"Article {index}")
        print("-" * 60)

        # Display the original news information retrieved from NewsAPI.
        print("Title:", article.get("title"))
        print("Text:", article.get("description") or article.get("content"))
        print("Published Date:", article.get("publishedAt"))

        # Display the location inference and geocoding result.
        print("\nLocation / Geocoding Result:")
        print(article.get("location"))

        # Display the category selected by the AI.
        print("\nCategory Classification Result:")
        print(article.get("category"))

    print("\n" + "=" * 60)



# DATABASE STORAGE

def store_processed_articles(processed_articles):
    """
    Store successfully processed articles in the NewScape database.

    Outside-UAE articles and duplicate articles are skipped by
    the database insertion function.
    """

    stored_count = 0

    print("\n")
    print("=" * 60)
    print("DATABASE STORAGE")
    print("=" * 60)

    for article in processed_articles:

        if insert_news_article(article):
            stored_count += 1

    print("\nArticles successfully stored:", stored_count)
    print("=" * 60)

    return stored_count



# LOCAL INTEGRATION TEST

if __name__ == "__main__":

    print("\nStarting NewScape article processing test...")

    # Retrieve real UAE-related articles from NewsAPI.
    articles = retrieve_initial_news()

    print("\nArticles available from NewsAPI:", len(articles))

    # Process only two articles during this test to avoid
    # unnecessary API usage and rate-limit issues.
    processed_articles = process_articles(
        articles,
        max_articles=2
    )

    # Display the final AI processing results.
    print_processed_articles(processed_articles)

    # Store the processed articles in the MySQL database.
    store_processed_articles(processed_articles)

    # Display the articles that were successfully stored.
    print_stored_articles()
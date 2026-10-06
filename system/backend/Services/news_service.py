import requests
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta



# NEWS API SETUP

# Locate the .env file stored in the root folder of the project.
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_PATH = PROJECT_ROOT / ".env"

# Load the NewsAPI key from .env instead of Google Colab userdata.
load_dotenv(ENV_PATH)

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

if NEWS_API_KEY:
    print("NewsAPI key loaded successfully")
else:
    print("API key not found")



# NEWS REFRESH

# INITIAL / OLDER NEWS RETRIEVAL

# This is used when initially collecting older available articles.
# Multiple pages are retrieved so the initial database is not limited
# to only the 10 most recent articles.

def retrieve_initial_news():

    url = "https://newsapi.org/v2/everything"

    all_articles = []

    # Retrieve multiple pages so that older articles are also included.
    for page in range(1, 6):

        params = {
            "q": 'UAE OR "United Arab Emirates" OR Dubai OR "Abu Dhabi" OR Sharjah OR Ajman OR Fujairah OR "Ras Al Khaimah" OR "Umm Al Quwain"',
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 10,
            "page": page
        }

        headers = {
            "X-Api-Key": NEWS_API_KEY
        }

        response = requests.get(url, params=params, headers=headers)

        refresh_data = response.json()

        print("HTTP Status:", response.status_code)
        print("Status:", refresh_data.get("status"))
        print("Page:", page)

        new_articles = refresh_data.get("articles", [])

        all_articles.extend(new_articles)


    seen_urls = set()
    unique_articles = []

    for article in all_articles:
        article_url = article.get("url")

        if article_url and article_url not in seen_urls:
            seen_urls.add(article_url)
            unique_articles.append(article)

    print("Articles received:", len(all_articles))
    print("New unique articles:", len(unique_articles))
    print("Duplicates skipped:", len(all_articles) - len(unique_articles))

    return unique_articles



# NEWS REFRESH

# Retrieves recent UAE-related news for repeated system updates.
# Unlike retrieve_initial_news(), this function only requests articles
# published within the last two days so that refreshes focus on recent news.

def retrieve_news():

    url = "https://newsapi.org/v2/everything"

    # Retrieve articles published within the last two days.
    from_date = (
        datetime.now(timezone.utc) - timedelta(days=2)
    ).strftime("%Y-%m-%dT%H:%M:%SZ")

    params = {
        "q": 'UAE OR "United Arab Emirates" OR Dubai OR "Abu Dhabi" OR Sharjah OR Ajman OR Fujairah OR "Ras Al Khaimah" OR "Umm Al Quwain"',
        "from": from_date,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 10
    }

    headers = {
        "X-Api-Key": NEWS_API_KEY
    }

    response = requests.get(url, params=params, headers=headers)

    refresh_data = response.json()

    print("HTTP Status:", response.status_code)
    print("Status:", refresh_data.get("status"))
    print("Total Results:", refresh_data.get("totalResults"))

    new_articles = refresh_data.get("articles", [])

    # Remove duplicate articles returned within the same NewsAPI response.
    seen_urls = set()
    unique_articles = []

    for article in new_articles:
        article_url = article.get("url")

        if article_url and article_url not in seen_urls:
            seen_urls.add(article_url)
            unique_articles.append(article)

    print("Articles received:", len(new_articles))
    print("New unique articles:", len(unique_articles))
    print("Duplicates skipped:", len(new_articles) - len(unique_articles))

    return unique_articles



# LOCAL SETUP TEST

if __name__ == "__main__":

    print("Libraries loaded successfully")

    if NEWS_API_KEY:
        print("NewsAPI key loaded successfully")
    else:
        print("API key not found")
        print("\nTesting recent news retrieval...")

    recent_articles = retrieve_news()

    print("\nRecent articles retrieved:", len(recent_articles))

    for article in recent_articles:
        print("-", article.get("title"))
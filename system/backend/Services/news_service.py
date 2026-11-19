import requests
import json
import os
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse
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


# Additional news sources.
# The Abu Dhabi Media Office RSS feeds do not require a key.
GNEWS_API_KEY = os.getenv("GNEWS_API_KEY")
WORLD_NEWS_API_KEY = os.getenv("WORLD_NEWS_API_KEY")

if GNEWS_API_KEY:
    print("GNews key loaded successfully")
else:
    print("GNews key not found")

if WORLD_NEWS_API_KEY:
    print("World News API key loaded successfully")
else:
    print("World News API key not found")



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



# GNEWS RETRIEVAL

# Retrieves UAE top headlines from GNews.
# Articles are converted to the same format returned by NewsAPI
# so they can be processed by the existing pipeline.

def retrieve_gnews_news(language="en"):

    url = "https://gnews.io/api/v4/top-headlines"

    params = {
        "country": "ae",
        "lang": language,
        "max": 10,
        "apikey": GNEWS_API_KEY
    }

    response = requests.get(url, params=params)

    refresh_data = response.json()

    print("HTTP Status:", response.status_code)
    print("Total Results:", refresh_data.get("totalArticles"))

    if response.status_code != 200:
        print("Error:", refresh_data.get("errors"))
        return []

    new_articles = []

    for item in refresh_data.get("articles", []):

        new_articles.append({
            "source": {"id": None, "name": item.get("source", {}).get("name")},
            "title": item.get("title"),
            "description": item.get("description"),
            "content": item.get("content"),
            "url": item.get("url"),
            "urlToImage": item.get("image"),
            "publishedAt": item.get("publishedAt")
        })

    # Remove duplicate articles returned within the same GNews response.
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



# ABU DHABI MEDIA OFFICE RSS RETRIEVAL

# Retrieves official Abu Dhabi government news from RSS feeds.
# No API key is required. The feeds publish a few items per day
# and only give the date (midnight), so a 7-day window is used.

def retrieve_abu_dhabi_news():

    feed_urls = [
        "https://www.mediaoffice.abudhabi/en/transport/rss/",
        "https://www.mediaoffice.abudhabi/en/health/rss/",
        "https://www.mediaoffice.abudhabi/en/security/rss/",
        "https://www.mediaoffice.abudhabi/en/environment/rss/",
        "https://www.mediaoffice.abudhabi/en/education/rss/",
        "https://www.mediaoffice.abudhabi/en/sport/rss/",
        "https://www.mediaoffice.abudhabi/en/economy/rss/",
        "https://www.mediaoffice.abudhabi/en/technology/rss/"
    ]

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    oldest_date = datetime.now(timezone.utc) - timedelta(days=2)

    new_articles = []

    for feed_url in feed_urls:

        response = requests.get(feed_url, headers=headers)

        print("HTTP Status:", response.status_code)
        print("Feed:", feed_url)

        if response.status_code != 200:
            continue

        feed = ET.fromstring(response.content)

        for item in feed.findall("./channel/item"):

            # RSS dates look like "Fri, 13 Nov 2026 00:00:00 +0400".
            published_text = item.findtext("pubDate")

            if not published_text:
                continue

            published_date = parsedate_to_datetime(published_text)

            if published_date < oldest_date:
                continue

            # The article image is stored in the RSS enclosure tag.
            enclosure = item.find("enclosure")
            image_url = enclosure.get("url") if enclosure is not None else None

            new_articles.append({
                "source": {"id": None, "name": "Abu Dhabi Media Office"},
                "title": item.findtext("title"),
                "description": (item.findtext("description") or "").strip(),
                "content": (item.findtext("description") or "").strip(),
                "url": item.findtext("link"),
                "urlToImage": image_url,
                # The feed only gives the UAE date (midnight), so the date is
                # kept as published. Converting it to UTC would move it to
                # the previous day in the date filters.
                "publishedAt": published_date.strftime("%Y-%m-%dT%H:%M:%SZ")
            })

    # The same story can appear in more than one feed.
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



# WORLD NEWS API RETRIEVAL

# Retrieves recent news published by UAE-based outlets.
# The free plan has 50 points per day, so only 10 articles are requested.

def retrieve_world_news():

    url = "https://api.worldnewsapi.com/search-news"

    # Retrieve articles published within the last two days.
    from_date = (
        datetime.now(timezone.utc) - timedelta(days=2)
    ).strftime("%Y-%m-%d %H:%M:%S")

    params = {
        "source-country": "ae",
        "language": "en",
        "earliest-publish-date": from_date,
        "sort": "publish-time",
        "sort-direction": "DESC",
        "number": 10
    }

    headers = {
        "x-api-key": WORLD_NEWS_API_KEY
    }

    response = requests.get(url, params=params, headers=headers)

    refresh_data = response.json()

    print("HTTP Status:", response.status_code)
    print("Total Results:", refresh_data.get("available"))

    if response.status_code != 200:
        print("Error:", refresh_data.get("message"))
        return []

    new_articles = []

    for item in refresh_data.get("news", []):

        # World News API does not return the publisher name,
        # so the website name is used as the source.
        source_name = urlparse(item.get("url") or "").netloc.replace("www.", "")

        # Dates look like "2026-11-15 10:00:00" and are converted
        # to the NewsAPI format.
        published_at = item.get("publish_date")

        if published_at:
            published_at = published_at.replace(" ", "T") + "Z"

        new_articles.append({
            "source": {"id": None, "name": source_name},
            "title": item.get("title"),
            "description": item.get("summary"),
            "content": item.get("text"),
            "url": item.get("url"),
            "urlToImage": item.get("image"),
            "publishedAt": published_at
        })

    # Remove duplicate articles returned within the same response.
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



# ALL SOURCES RETRIEVAL

# Retrieves news from every source and removes stories repeated
# across sources, using both the URL and the headline, so the same
# news does not appear twice in Latest News.
# A failing source is skipped so the other sources still work.

def retrieve_all_news():

    all_articles = []

    sources = [
        ("Abu Dhabi Media Office", retrieve_abu_dhabi_news),
        ("World News API", retrieve_world_news),
        ("GNews", retrieve_gnews_news),
        ("NewsAPI", retrieve_news)
    ]

    for source_name, retrieve_function in sources:

        print("\nRetrieving from", source_name)

        try:
            source_articles = retrieve_function()

        except Exception as error:
            print(source_name, "retrieval failed:", error)
            continue

        print(source_name, "articles:", len(source_articles))

        all_articles.extend(source_articles)

    seen_urls = set()
    seen_titles = set()
    unique_articles = []

    for article in all_articles:
        article_url = article.get("url")
        article_title = (article.get("title") or "").lower().strip()

        if not article_url or not article_title:
            continue

        if article_url in seen_urls or article_title in seen_titles:
            continue

        seen_urls.add(article_url)
        seen_titles.add(article_title)
        unique_articles.append(article)

    print("\nArticles received from all sources:", len(all_articles))
    print("New unique articles:", len(unique_articles))
    print("Duplicates skipped:", len(all_articles) - len(unique_articles))

    return unique_articles



# LOCAL SETUP TEST

if __name__ == "__main__":

    print("Libraries loaded successfully")

    print("\nTesting retrieval from all news sources...")

    all_articles = retrieve_all_news()

    print("\nArticles retrieved from all sources:", len(all_articles))

    for article in all_articles:
        print("-", article.get("title"), "|", article["source"]["name"])
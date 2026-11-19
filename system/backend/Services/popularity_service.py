from difflib import SequenceMatcher
import re


def clean_title(title):
    """Normalize a headline before comparing it."""
    title = title.lower()
    title = re.sub(r"[^\w\s]", "", title)
    return " ".join(title.split())


def calculate_similarity(title1, title2):
    """Compare headlines even when words appear in different orders."""
    title1 = clean_title(title1)
    title2 = clean_title(title2)

    words1 = set(title1.split())
    words2 = set(title2.split())

    if not words1 or not words2:
        return 0.0

    return len(words1 & words2) / min(len(words1), len(words2))


def detect_duplicate_news(articles, threshold=0.70):
    """Group articles with similar news headlines."""
    groups = []

    for article in articles:
        title = article["title"]
        matched = False

        for group in groups:
            similarity = calculate_similarity(
                title, group[0]["title"]
            )

            if similarity >= threshold:
                group.append(article)
                matched = True
                break

        if not matched:
            groups.append([article])

    return groups

def calculate_popularity(groups):
    """Calculate popularity based on unique news sources."""
    results = []

    for group in groups:
        sources = {
            article["source"]
            for article in group
        }

        results.append({
            "title": group[0]["title"],
            "article_count": len(group),
            "source_count": len(sources),
            "popularity_score": len(sources)
        })

    return sorted(
        results,
        key=lambda item: item["popularity_score"],
        reverse=True
    )

from collections import Counter

def compare_news_sources(articles):
    """Count how many articles come from each news source."""
    source_counts = Counter(
        article["source"] for article in articles
    )

    return dict(source_counts)

def get_source_comparison():
    """Count articles published by each source in NewsStore."""
    from system.backend.database.database import get_database_connection

    connection = get_database_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                s.source_Name AS source,
                COUNT(n.news_ID) AS article_count
            FROM Source s
            LEFT JOIN NewsItem n
                ON s.source_ID = n.source_ID
            GROUP BY s.source_ID, s.source_Name
            ORDER BY article_count DESC
        """)

        return cursor.fetchall()

    finally:
        cursor.close()
        connection.close()

def get_articles_for_popularity():
    """Retrieve stored articles with their news source names."""
    from system.backend.database.database import get_database_connection

    connection = get_database_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                n.news_ID AS id,
                n.title,
                n.article_URL AS url,
                s.source_Name AS source
            FROM NewsItem n
            JOIN Source s
                ON n.source_ID = s.source_ID
            ORDER BY n.news_ID DESC
        """)

        return cursor.fetchall()

    finally:
        cursor.close()
        connection.close()

def get_popular_news():
    """Calculate popularity rankings using stored database articles."""
    articles = get_articles_for_popularity()

    if not articles:
        return []

    groups = detect_duplicate_news(articles)
    return calculate_popularity(groups)

if __name__ == "__main__":
    sample_articles = [
        {"title": "New metro project announced in Dubai", "source": "Gulf News"},
        {"title": "Dubai announces new metro project", "source": "Khaleej Times"},
        {"title": "Heavy rainfall expected in Sharjah", "source": "Gulf News"},
        {"title": "Sharjah prepares for heavy rainfall", "source": "The National"},
    ]

    groups = detect_duplicate_news(sample_articles)

    # Display duplicate news groups
    for number, group in enumerate(groups, start=1):
        print(f"\nStory {number}:")
        for article in group:
            print(f"  - {article['title']} ({article['source']})")

    # Display popularity ranking
    print("\nNEWS POPULARITY RANKING")

    popularity_results = calculate_popularity(groups)

    for rank, story in enumerate(popularity_results, start=1):
        print(
            f"{rank}. {story['title']} | "
            f"Articles: {story['article_count']} | "
            f"Sources: {story['source_count']} | "
            f"Popularity Score: {story['popularity_score']}"
        )

    # Display source comparison
    print("\nSOURCE COMPARISON")

    source_results = compare_news_sources(sample_articles)

    for source, count in source_results.items():
        print(f"{source}: {count} articles")
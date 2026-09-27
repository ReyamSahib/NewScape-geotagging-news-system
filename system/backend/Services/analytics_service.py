"""
Analytics service for the NewScape Senior Project.

This module retrieves stored news data from the MySQL database
and produces summary statistics that can later be displayed
on the NewScape analytics dashboard.
"""

import sys
from pathlib import Path

# Add the backend folder to Python's module search path so that
# services can import modules from the database folder.
BACKEND_DIR = Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from database.database import get_database_connection

# CATEGORY ANALYTICS

def get_category_distribution():
    """
    Count how many stored news articles belong to each category.

    The Category table is joined with NewsItem so that the result
    uses the category names instead of only their database IDs.
    """

    # Connect to the NewScape MySQL database.
    connection = get_database_connection()
    cursor = connection.cursor()

    # Count the number of articles assigned to each category.
    # LEFT JOIN keeps categories visible even when they currently
    # contain zero stored articles.
    cursor.execute(
        """
        SELECT c.category_Name, COUNT(n.news_ID)
        FROM Category c
        LEFT JOIN NewsItem n ON c.category_ID = n.category_ID
        GROUP BY c.category_ID, c.category_Name
        ORDER BY COUNT(n.news_ID) DESC;
        """
    )

    results = cursor.fetchall()

    # Close the database connection safely after retrieving the data.
    cursor.close()
    connection.close()

    return results



# GEOTAGGING ANALYTICS

def get_geotagging_distribution():
    """
    Count stored articles according to their geotagging result.

    This shows how many articles were classified as explicit,
    inferred, or not geotaggable.
    """

    # Connect to the NewScape MySQL database.
    connection = get_database_connection()
    cursor = connection.cursor()

    # Group stored articles according to their location type.
    cursor.execute(
        """
        SELECT location_Type, COUNT(news_ID)
        FROM NewsItem
        GROUP BY location_Type
        ORDER BY COUNT(news_ID) DESC;
        """
    )

    results = cursor.fetchall()

    # Close the database connection safely.
    cursor.close()
    connection.close()

    return results



# PUBLICATION TIMELINE ANALYTICS

def get_publication_timeline():
    """
    Count stored news articles according to their publication date.

    These results can later be used to display how news activity
    changes over time on the analytics dashboard.
    """

    # Connect to the NewScape MySQL database.
    connection = get_database_connection()
    cursor = connection.cursor()

    # Extract only the date from published_datetime and count
    # how many articles were published on each date.
    cursor.execute(
        """
        SELECT DATE(published_datetime), COUNT(news_ID)
        FROM NewsItem
        GROUP BY DATE(published_datetime)
        ORDER BY DATE(published_datetime);
        """
    )

    results = cursor.fetchall()

    # Close the database connection safely.
    cursor.close()
    connection.close()

    return results



# SUMMARY ANALYTICS

def get_summary_statistics():
    """
    Calculate general statistics about the news currently stored
    in the NewScape database.

    These values provide a quick overview of the number of stored
    articles and how many can be displayed on the UAE map.
    """

    # Connect to the NewScape MySQL database.
    connection = get_database_connection()
    cursor = connection.cursor()

    # Count all articles currently stored in the database.
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM NewsItem;
        """
    )

    total_articles = cursor.fetchone()[0]

    # Count articles with explicit or inferred UAE locations.
    # These are the articles that can be displayed on the map.
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM NewsItem
        WHERE location_Type IN ('explicit', 'inferred');
        """
    )

    map_articles = cursor.fetchone()[0]

    # Count articles where no usable location could be identified.
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM NewsItem
        WHERE location_Type = 'not_geotaggable';
        """
    )

    non_geotaggable_articles = cursor.fetchone()[0]

    # Close the database connection safely.
    cursor.close()
    connection.close()

    return {
        "total_articles": total_articles,
        "map_articles": map_articles,
        "non_geotaggable_articles": non_geotaggable_articles
    }
    
    
    

# DISPLAY ANALYTICS RESULTS

def print_analytics_results():
    """
    Display the current analytics results in the terminal.

    This function is useful for testing the analytics component
    before the results are connected to the frontend dashboard.
    It also provides clear output for project documentation.
    """

    print("\n")
    print("=" * 60)
    print("ANALYTICS RESULTS")
    print("=" * 60)



    # DISPLAY SUMMARY STATISTICS

    summary = get_summary_statistics()

    print("\nSUMMARY STATISTICS")
    print("Total stored articles:", summary["total_articles"])
    print("Articles available for UAE map:", summary["map_articles"])
    print("Non-geotaggable articles:", summary["non_geotaggable_articles"])
    
    # DISPLAY CATEGORY DISTRIBUTION

    category_results = get_category_distribution()

    print("\nCATEGORY DISTRIBUTION")

    for category, count in category_results:
        print(f"{category}: {count}")



    # DISPLAY GEOTAGGING DISTRIBUTION

    geotagging_results = get_geotagging_distribution()

    print("\nGEOTAGGING DISTRIBUTION")

    for location_type, count in geotagging_results:
        print(f"{location_type}: {count}")



    # DISPLAY PUBLICATION TIMELINE

    timeline_results = get_publication_timeline()

    print("\nPUBLICATION TIMELINE")

    for publication_date, count in timeline_results:
        print(f"{publication_date}: {count}")

    print("\n" + "=" * 60)



# LOCAL ANALYTICS TEST

# Run the analytics output only when this file is executed directly.
# Importing analytics_service.py from another backend file will not
# automatically execute this test.
if __name__ == "__main__":
    print_analytics_results()
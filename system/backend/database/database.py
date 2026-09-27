"""
Database connection module for the NewScape Senior Project.

This module connects the Python backend to the local MySQL database.
Database credentials are loaded from the project's .env file so that
private information is not stored directly in the source code.
"""

import os
from pathlib import Path

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
            
# Run the connection test only when this file is executed directly.
if __name__ == "__main__":
    test_database_connection()
    show_database_tables()
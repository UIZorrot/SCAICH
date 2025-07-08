import sqlite3
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO, filename="count_users.log", format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Database file
INVITES_DB = "SCAIENGINE/backend/invites.db"

def get_invites_db():
    """Connect to invites.db"""
    try:
        conn = sqlite3.connect(INVITES_DB)
        conn.row_factory = sqlite3.Row
        logger.info("Connected to invites.db")
        return conn
    except sqlite3.Error as e:
        logger.error(f"Failed to connect to invites.db: {str(e)}")
        raise

def count_registered_users():
    """Count the number of registered users (used = True)"""
    if not os.path.exists(INVITES_DB):
        logger.error("invites.db does not exist")
        print("Error: invites.db not found")
        return

    conn = get_invites_db()
    try:
        cursor = conn.execute("SELECT COUNT(*) FROM invites WHERE used = ?", (True,))
        count = cursor.fetchone()[0]
        logger.info(f"Found {count} registered users")
        print(f"Number of registered users: {count}")
    except sqlite3.Error as e:
        logger.error(f"Database query failed: {str(e)}")
        print(f"Error querying database: {str(e)}")
    finally:
        conn.close()
        logger.info("Database connection closed")

if __name__ == "__main__":
    count_registered_users()
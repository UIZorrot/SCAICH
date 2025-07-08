import asyncio
from twscrape import API, gather
from twscrape.logger import set_log_level
import sqlite3
from datetime import datetime, timedelta
import json

# SQLite database setup
def init_db():
    conn = sqlite3.connect("twitter_cache.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS twitter_posts (
            username TEXT PRIMARY KEY,
            posts TEXT,
            img TEXT,
            expiry TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

# twscrape initialization (from X.py)
async def init_x():
    try:
        api = API("twitter.db")  # Use SQLite database
        cookies = f"auth_token=dde71886a6ff6533ea14084bc79dd33e9e1f5c7a; ct0=34f63c3348ba2eed3788e4c1b4475ef49b1babacdfeb4dfac2a8d356f4046b9502043df944bf820d621952e00ea7a260bde687225db218fa2a876f2088edc30937eda083f3a8fc4b112b085050fef3da"
        await api.pool.add_account(
            "@sci829760211074",
            "123QWEASD",
            "sci829760211074@moemail.app",
            "123QWEASD",
            cookies=cookies,
        )
        await api.pool.login_all()
        return api
    except Exception as e:
        print(f"init_x error: {e}")
        return None

# Twitter Scraper (from X.py)
async def TwitterScraper(api, username: str, limit: int = 10) -> list:
    cache_key = username.lower()
    # Check cache
    conn = sqlite3.connect("twitter_cache.db")
    cursor = conn.cursor()
    cursor.execute("SELECT posts, expiry FROM twitter_posts WHERE username = ?", (cache_key,))
    result = cursor.fetchone()

    if result:
        posts, expiry = result
        if datetime.fromisoformat(expiry) > datetime.utcnow():
            conn.close()
            return json.loads(posts)

    try:
        temp_user = await api.user_by_login(username)
        if not temp_user:
            conn.close()
            return []

        user_img = temp_user.profileImageUrl
        tweets = await gather(api.user_tweets(temp_user.id, limit))

        res = []

        for tweet in tweets:
            if tweet.user.username.lower() == username.lower() and (
                not tweet.rawContent.__contains__("RT")
             ):
                res.append(tweet.rawContent)

        # Cache results
        expiry = (datetime.now() + timedelta(hours=24)).isoformat()
        cursor.execute(
            "INSERT OR REPLACE INTO twitter_posts (username, posts, expiry, img) VALUES (?, ?, ?, ?)",
            (cache_key, json.dumps(res), expiry, user_img),
        )
        conn.commit()
        conn.close()
        return res
    except Exception as e:
        print(f"TwitterScraper error: {e}")
        conn.close()
        return []
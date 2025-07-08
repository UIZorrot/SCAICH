import sqlite3
import secrets
import os
from datetime import datetime

def get_db():
    conn = sqlite3.connect("invites.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS invites (
                invite_code TEXT PRIMARY KEY,
                user_id TEXT,
                created_at TEXT,
                used BOOLEAN NOT NULL
            )
        """)
        conn.commit()

def generate_invites(count=100):
    init_db()
    invites = []
    
    with get_db() as conn:
        for _ in range(count):
            # 生成 12 字符邀请码
            invite_code = secrets.token_urlsafe(9)[:12]
            # 确保不重复
            while conn.execute("SELECT 1 FROM invites WHERE invite_code = ?", (invite_code,)).fetchone():
                invite_code = secrets.token_urlsafe(9)[:12]
            
            conn.execute(
                "INSERT INTO invites (invite_code, user_id, created_at, used) VALUES (?, ?, ?, ?)",
                (invite_code, None, datetime.now().isoformat(), False)
            )
            invites.append(invite_code)
        conn.commit()

    # 保存到 TXT
    with open("invites.txt", "w") as f:
        for invite_code in invites:
            f.write(f"Invite Code: {invite_code}\n")

    print(f"Generated {count} invite codes in invites.txt and invites.db")

if __name__ == "__main__":
    generate_invites(100)
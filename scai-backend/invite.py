from flask import Flask, request, jsonify
import sqlite3
import uuid
from datetime import datetime

app = Flask(__name__)

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

init_db()

@app.route("/invite", methods=["GET"])
def verify_invite():
    invite_code = request.args.get("code")
    if not invite_code:
        return jsonify({"success": False, "message": "Invite code required"}), 400

    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM invites WHERE invite_code = ?", (invite_code,))
        invite = cursor.fetchone()

        if not invite:
            return jsonify({"success": False, "message": "Invalid invite code"}), 400

        if invite["used"]:
            return jsonify({"success": False, "message": "Invite code already used"}), 400

        user_id = str(uuid.uuid4())
        conn.execute(
            "UPDATE invites SET user_id = ?, created_at = ?, used = ? WHERE invite_code = ?",
            (user_id, datetime.now().isoformat(), True, invite_code)
        )
        conn.commit()

        return jsonify({"success": True, "user_id": user_id})

@app.route("/verifyuser", methods=["GET"])
def verify_user():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "User ID required"}), 400

    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM invites WHERE user_id = ? AND used = ?", (user_id, True))
        user = cursor.fetchone()

        if not user:
            return jsonify({"success": False, "message": "Invalid user ID"}), 404

        return jsonify({"success": True, "user_id": user_id})

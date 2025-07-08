from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import uuid
import hashlib
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 数据库文件
INVITES_DB = "invites.db"
KOL_DB = "kol_database.db"


def get_invites_db():
    """连接到 invites.db"""
    conn = sqlite3.connect(INVITES_DB)
    conn.row_factory = sqlite3.Row
    return conn


def get_kol_db():
    """连接到 kol_database.db"""
    conn = sqlite3.connect(KOL_DB)
    conn.row_factory = sqlite3.Row
    return conn


def init_invites_db():
    """初始化 invites.db"""
    with get_invites_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS invites (
                invite_code TEXT PRIMARY KEY,
                user_id TEXT,
                created_at TEXT,
                used BOOLEAN NOT NULL
            )
        """
        )
        conn.commit()


def init_kol_db():
    """初始化 kol_database.db"""
    with get_kol_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS kols (
                code TEXT PRIMARY KEY,
                remaining_count INTEGER NOT NULL,
                total_count INTEGER NOT NULL
            )
        """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS redeemed_users (
                code TEXT,
                user_id TEXT,
                invite_code TEXT,
                FOREIGN KEY (code) REFERENCES kols(code)
            )
        """
        )
        conn.commit()


def generate_user_id():
    """生成唯一的 user_id"""
    return str(uuid.uuid4())


def generate_invite_code(user_id):
    """生成 invite_code（基于 user_id 的哈希）"""
    return hashlib.sha256(user_id.encode()).hexdigest()[:16]


@app.route("/kolspec", methods=["POST"])
def redeem_kol_code():
    """处理 KOL 兑换请求"""
    data = request.get_json()
    if not data or "code" not in data:
        return jsonify({"success": False, "message": "KOL code is required"}), 400

    code = data["code"]

    # 连接到 kol_database.db
    kol_conn = get_kol_db()
    kol_cursor = kol_conn.cursor()

    # 检查 KOL 码是否有效
    kol_cursor.execute("SELECT remaining_count FROM kols WHERE code = ?", (code,))
    kol_result = kol_cursor.fetchone()

    if not kol_result:
        kol_conn.close()
        return jsonify({"success": False, "message": "Invalid KOL code"}), 404

    remaining_count = kol_result["remaining_count"]

    if remaining_count <= 0:
        kol_conn.close()
        return (
            jsonify(
                {"success": False, "message": "No remaining user IDs for this KOL code"}
            ),
            400,
        )

    # 生成 user_id 和 invite_code
    user_id = generate_user_id()
    invite_code = generate_invite_code(user_id)

    # 写入 invites.db 和 kol_database.db
    try:
        # 写入 invites.db（未使用状态）
        invites_conn = get_invites_db()
        invites_conn.execute(
            "INSERT INTO invites (invite_code, user_id, created_at, used) VALUES (?, ?, ?, ?)",
            (invite_code, user_id, datetime.now().isoformat(), False),
        )
        invites_conn.commit()
        invites_conn.close()

        # 更新 kol_database.db
        kol_cursor.execute(
            "UPDATE kols SET remaining_count = remaining_count - 1 WHERE code = ?",
            (code,),
        )
        kol_cursor.execute(
            "INSERT INTO redeemed_users (code, user_id, invite_code) VALUES (?, ?, ?)",
            (code, user_id, invite_code),
        )
        kol_conn.commit()
        kol_conn.close()

        return jsonify({"success": True, "user_id": user_id})
    except Exception as e:
        kol_conn.rollback()
        invites_conn = get_invites_db()
        invites_conn.rollback()
        invites_conn.close()
        kol_conn.close()
        return (
            jsonify({"success": False, "message": f"Error redeeming code: {str(e)}"}),
            500,
        )


if __name__ == "__main__":
    if not os.path.exists(INVITES_DB):
        init_invites_db()
    if not os.path.exists(KOL_DB):
        init_kol_db()
    app.run(host="0.0.0.0", port=5500, debug=True)

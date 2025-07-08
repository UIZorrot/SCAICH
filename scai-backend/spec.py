import sqlite3
import argparse
import os

# 数据库文件
DB_FILE = "kol_database.db"

def init_db():
    """初始化 SQLite 数据库"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS kols (
            code TEXT PRIMARY KEY,
            remaining_count INTEGER NOT NULL,
            total_count INTEGER NOT NULL
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS redeemed_users (
            code TEXT,
            user_id TEXT,
            invite_code TEXT,
            FOREIGN KEY (code) REFERENCES kols(code)
        )
    """)
    
    conn.commit()
    conn.close()
    print("Database initialized successfully.")

def init_kol(code, count):
    """初始化一个 KOL"""
    if count < 0:
        print("Error: Count must be non-negative.")
        return
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        cursor.execute("INSERT INTO kols (code, remaining_count, total_count) VALUES (?, ?, ?)", 
                      (code, count, count))
        conn.commit()
        print(f"KOL {code} initialized with {count} user IDs.")
    except sqlite3.IntegrityError:
        print(f"Error: KOL code {code} already exists.")
    except Exception as e:
        conn.rollback()
        print(f"Error initializing KOL: {str(e)}")
    finally:
        conn.close()

def view_kol(code):
    """查看 KOL 状态"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT remaining_count, total_count FROM kols WHERE code = ?", (code,))
    kol_info = cursor.fetchone()
    
    if not kol_info:
        print(f"Error: KOL code {code} not found.")
        conn.close()
        return
    
    cursor.execute("SELECT user_id, invite_code FROM redeemed_users WHERE code = ?", (code,))
    redeemed_users = cursor.fetchall()
    
    conn.close()
    
    print(f"KOL Code: {code}")
    print(f"Remaining Count: {kol_info[0]}")
    print(f"Total Count: {kol_info[1]}")
    print("Redeemed Users:")
    if redeemed_users:
        for user in redeemed_users:
            print(f"  User ID: {user[0]}, Invite Code: {user[1]}")
    else:
        print("  None")

def add_kol_count(code, count):
    """增加 KOL 的剩余数量"""
    if count <= 0:
        print("Error: Count must be positive.")
        return
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT remaining_count, total_count FROM kols WHERE code = ?", (code,))
    result = cursor.fetchone()
    
    if not result:
        print(f"Error: KOL code {code} not found.")
        conn.close()
        return
    
    try:
        cursor.execute("UPDATE kols SET remaining_count = remaining_count + ?, total_count = total_count + ? WHERE code = ?", 
                      (count, count, code))
        conn.commit()
        print(f"Added {count} user IDs to KOL {code}.")
    except Exception as e:
        conn.rollback()
        print(f"Error adding count: {str(e)}")
    finally:
        conn.close()

def modify_kol(code, remaining_count=None, total_count=None):
    """修改 KOL 数据"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT remaining_count, total_count FROM kols WHERE code = ?", (code,))
    result = cursor.fetchone()
    
    if not result:
        print(f"Error: KOL code {code} not found.")
        conn.close()
        return
    
    updates = {}
    if remaining_count is not None:
        if remaining_count < 0:
            print("Error: Remaining count must be non-negative.")
            conn.close()
            return
        updates["remaining_count"] = remaining_count
    if total_count is not None:
        if total_count < 0:
            print("Error: Total count must be non-negative.")
            conn.close()
            return
        updates["total_count"] = total_count
    
    if not updates:
        print("Error: No updates provided.")
        conn.close()
        return
    
    try:
        query = "UPDATE kols SET " + ", ".join(f"{key} = ?" for key in updates.keys()) + " WHERE code = ?"
        values = list(updates.values()) + [code]
        cursor.execute(query, values)
        conn.commit()
        print(f"KOL {code} updated successfully.")
    except Exception as e:
        conn.rollback()
        print(f"Error modifying KOL: {str(e)}")
    finally:
        conn.close()

def delete_kol(code):
    """删除 KOL（谨慎使用）"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT 1 FROM kols WHERE code = ?", (code,))
    if not cursor.fetchone():
        print(f"Error: KOL code {code} not found.")
        conn.close()
        return
    
    try:
        cursor.execute("DELETE FROM redeemed_users WHERE code = ?", (code,))
        cursor.execute("DELETE FROM kols WHERE code = ?", (code,))
        conn.commit()
        print(f"KOL {code} and its redeemed users deleted successfully.")
    except Exception as e:
        conn.rollback()
        print(f"Error deleting KOL: {str(e)}")
    finally:
        conn.close()

def main():
    parser = argparse.ArgumentParser(description="KOL Management Script")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # 初始化 KOL
    parser_init = subparsers.add_parser("init", help="Initialize a new KOL")
    parser_init.add_argument("--code", required=True, help="KOL code")
    parser_init.add_argument("--count", type=int, required=True, help="Number of user IDs")

    # 查看 KOL
    parser_view = subparsers.add_parser("view", help="View KOL status")
    parser_view.add_argument("--code", required=True, help="KOL code")

    # 增加 KOL 数量
    parser_add = subparsers.add_parser("add", help="Add user IDs to KOL")
    parser_add.add_argument("--code", required=True, help="KOL code")
    parser_add.add_argument("--count", type=int, required=True, help="Number of user IDs to add")

    # 修改 KOL
    parser_modify = subparsers.add_parser("modify", help="Modify KOL data")
    parser_modify.add_argument("--code", required=True, help="KOL code")
    parser_modify.add_argument("--remaining-count", type=int, help="Set remaining count")
    parser_modify.add_argument("--total-count", type=int, help="Set total count")

    # 删除 KOL
    parser_delete = subparsers.add_parser("delete", help="Delete a KOL")
    parser_delete.add_argument("--code", required=True, help="KOL code")

    args = parser.parse_args()

    if not os.path.exists(DB_FILE):
        init_db()

    if args.command == "init":
        init_kol(args.code, args.count)
    elif args.command == "view":
        view_kol(args.code)
    elif args.command == "add":
        add_kol_count(args.code, args.count)
    elif args.command == "modify":
        modify_kol(args.code, args.remaining_count, args.total_count)
    elif args.command == "delete":
        delete_kol(args.code)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
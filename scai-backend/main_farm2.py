import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_caching import Cache
from threading import Lock
import socketio
import uvicorn
# from uvicorn.middleware.wsgi import WSGIMiddleware # 移除这一行，不再使用 Uvicorn 的 WSGI 适配器
from asgiref.wsgi import WsgiToAsgi # <<< 新增：导入 asgiref 的 WSGI 适配器

from rag import chat_init
from X import TwitterScraper, init_x
import sqlite3 # 导入 sqlite3

app = Flask(__name__)
CORS(app)
app.config["CORS_HEADERS"] = "Content-Type"
app.config["CACHE_TYPE"] = "SimpleCache"
app.config["CACHE_DEFAULT_TIMEOUT"] = 3600
cache = Cache(app)

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")

# >>> 关键修改：使用 WsgiToAsgi 将 Flask 应用包装为 ASGI 应用 <<<
flask_asgi_app = WsgiToAsgi(app)

# 将 Socket.IO 服务器和 Flask 的 ASGI 包装器结合成一个 ASGI 应用
# sio_app 将同时处理 HTTP 和 WebSocket 请求
sio_app = socketio.ASGIApp(sio, flask_asgi_app) # <<< 传递转换后的 ASGI 应用

chat_farm2 = {}
chat_farm2_lock = Lock()
api = None

def init_api():
    global api
    if api is None:
        api = asyncio.run(init_x())

# 使用 sio.on 装饰器监听事件
@sio.on("connect")
async def handle_connect(sid, environ):
    # sid 是 session ID，environ 包含请求的环境信息
    print(f"WebSocket connect attempt: sid={sid}, headers={environ.get('HTTP_HOST')}")
    # 从 environ 中获取 'p' 参数，它通常在查询字符串中，需要解析
    query_string = environ.get('QUERY_STRING', '')
    p = None
    for param in query_string.split('&'):
        if param.startswith('p='):
            p = param.split('=', 1)[1]
            break

    if not p:
        await sio.emit("error", {"message": "Parameter 'p' is required"}, room=sid)
        return

    try:
        # 调用异步 TwitterScraper
        posts = await TwitterScraper(api, p, 50)
        if not posts:
            await sio.emit("error", {"message": "No posts found"}, room=sid)
            return

        response_text = f"""
        You are the Twitter user {p}, Here is your recent post.
        Post: {posts}
        You should beware your personality, knowledge, mother language and talk style based on the recent post.
        Later, someone will talk to you, you just respond as who you are, mostly aware fo your tone based on you posts..
        You are a person, do not talk like a typical AI, where AI talks too polite, talks too many, you won't always happy to answer any question, as it may be rude, or offend your privacy, etc.
        """
        chat_engine = chat_init(response_text)
        if chat_engine is None:
            await sio.emit("error", {"message": "Failed to initialize chat engine"}, room=sid)
            return

        with chat_farm2_lock:
            chat_farm2[sid] = chat_engine # 使用 sid 作为会话 ID
        await sio.emit("session_id", {"session_id": sid}, room=sid)

    except Exception as e:
        print(f"Connect error: {e}")
        await sio.emit("error", {"message": f"An unexpected error occurred while fetching posts: {str(e)}"}, room=sid)

@sio.on("disconnect")
async def handle_disconnect(sid):
    with chat_farm2_lock:
        if sid in chat_farm2:
            del chat_farm2[sid]
            print(f"Session {sid} ended and memory released")
        else:
            print(f"Session {sid} disconnected, but no chat_engine found")

@sio.on("chat")
async def handle_chat(sid, data):
    query = data.get("query")
    if not query:
        await sio.emit("error", {"message": "Query is required"}, room=sid)
        return

    if sid not in chat_farm2:
        await sio.emit("error", {"message": "Session not found"}, room=sid)
        return

    chat_engine = chat_farm2[sid]
    try:
        response = chat_engine.stream_chat(query)
        for chunk in response.response_gen:
            await sio.emit("response", {"chunk": chunk}, room=sid)
    except Exception as e:
        await sio.emit("error", {"message": f"Error during query: {str(e)}"}, room=sid)


# Flask HTTP 路由保持不变
@app.route('/check_alive', methods=['GET'])
def check_alive():
    return jsonify({"status": "Alive"}), 200

@app.route('/get_profile_image', methods=['GET'])
def get_profile_image():
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Missing username parameter"}), 400

    cache_key = username.lower()
    try:
        # 确保这里连接的是 twitter_cache.db
        with sqlite3.connect("twitter_cache.db") as conn:
            cursor = conn.cursor()
            # 检查 img 字段是否存在于 twitter_posts 表中，X.py 中的表结构已经包含了 img
            cursor.execute("SELECT img FROM twitter_posts WHERE username = ?", (cache_key,))
            result = cursor.fetchone()
            if result:
                img_url = result[0]
                if img_url:
                    return jsonify({"username": username, "profile_image": img_url}), 200
                else:
                    return jsonify({"error": f"No profile image found for username {username}"}), 404
            else:
                return jsonify({"error": f"No data found for username {username}"}), 404
    except sqlite3.Error as e:
        print(f"Database error for username {username}: {e}")
        return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    init_api()
    uvicorn.run(sio_app, host="0.0.0.0", port=7789)
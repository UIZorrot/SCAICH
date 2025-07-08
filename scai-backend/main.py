import os
from bs4 import BeautifulSoup
import concurrent
from flask import Flask, request, jsonify
from flask_caching import Cache
from flask_cors import CORS, cross_origin
from flask_socketio import SocketIO, emit
from pymilvus import MilvusClient
import requests
import time
import requests_cache
import socketio
from fetch_arxiv_pdf import get_arxiv
from fetch_scihub import get_scihub
from rag import chat_rag_init, query_rag, chat_init
from utils import fetch_openalex_papers, get_paper_info, fetch_openalex_papers_first
from fetch_arxiv import PaperSearcher
from scihub_search import (
    keyword_ollama,
    paragraph_to_json_dp,
    paragraph_to_json_ollama,
    search_scihub,
    trans_ollama,
)
from typing import List, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import sqlite3
import concurrent.futures
from bs4 import BeautifulSoup
from utils import search_top_50
import hashlib
import math
import uuid
from datetime import datetime

def extract_text_from_html(html_content):
    """
    从 HTML 内容中提取纯文本，去除所有 HTML 标签。

    :param html_content: 输入的 HTML 字符串
    :return: 提取后的纯文本
    """
    # 使用 BeautifulSoup 解析 HTML 内容
    soup = BeautifulSoup(html_content, "html.parser")

    # 获取去除标签后的纯文本
    return soup.get_text()


def sort_papers_by_relevance(papers: List[Dict], query: str) -> List[Dict]:
    # 使用集合去重标题
    seen_titles = set()
    unique_papers = []

    for paper in papers:
        # 过滤没有 doi 或 location 不符合要求的论文
        # or paper.get("location") == "Not Available"
        # print(paper)
        if paper == "error" or paper.get("doi") is None or paper.get("title") is None:
            continue

        title = extract_text_from_html(paper["title"]).lower().replace(" ", "")
        if title not in seen_titles:
            unique_papers.append(paper)
            seen_titles.add(title)

    # print("hrer2")

    # 将 query 和所有 unique_paper 的标题组合在一起
    documents = [query] + [f"{paper['title']}" for paper in unique_papers]

    # 计算 TF-IDF 特征
    vectorizer = TfidfVectorizer(
        stop_words="english", ngram_range=(1, 2)
    )  # 增加 ngram_range
    tfidf_matrix = vectorizer.fit_transform(documents)

    # 计算 query 与每个 paper 的余弦相似度
    cosine_similarities = cosine_similarity(
        tfidf_matrix[0:1], tfidf_matrix[1:]
    ).flatten()

    # 查找完全匹配的项目
    fully_matched_papers = []
    non_fully_matched_papers = []

    # 为相似度分配数值
    similarity_map = {"highly related": 3, "related": 2, "barely related": 1}

    for i, paper in enumerate(unique_papers):
        if paper["title"].lower() == query.lower():  # 判断是否完全匹配（忽略大小写）
            paper_with_similarity = paper.copy()
            paper_with_similarity["similarity"] = "fully matched"  # 完全匹配标记
            fully_matched_papers.append(paper_with_similarity)
        else:
            # 将相似度值加入到 paper 字典中，并保留两位小数
            paper_with_similarity = paper.copy()
            similarity_value = round(cosine_similarities[i], 2)
            if similarity_value > 0.25:
                sim_tag = "highly related"
            elif similarity_value > 0.15:
                sim_tag = "related"
            else:
                sim_tag = "barely related"
            paper_with_similarity["similarity"] = sim_tag
            non_fully_matched_papers.append(paper_with_similarity)

    # 将完全匹配的论文放在最前面
    # 将相似度标签映射为数值进行排序
    sorted_non_fully_matched_papers = sorted(
        non_fully_matched_papers,
        key=lambda x: similarity_map[x["similarity"]],
        reverse=True,
    )

    # 将完全匹配的论文和非完全匹配的论文合并
    sorted_papers = fully_matched_papers + sorted_non_fully_matched_papers

    return sorted_papers


app = Flask(__name__)
CORS(app)  # 启用 CORS，允许所有来源访问
app.config["CORS_HEADERS"] = "Content-Type"
# 配置缓存，使用内存缓存
app.config["CACHE_TYPE"] = "SimpleCache"  # 可以改为 'redis' 或 'memcached' 等
app.config["CACHE_DEFAULT_TIMEOUT"] = 3600  # 默认缓存超时 5 分钟
cache = Cache(app)

# client = MilvusClient("http://localhost:19530")
# collection_name = "scihub_rag"

@app.route("/search", methods=["GET"])
@cross_origin(origin="*", headers=["Content-Type", "Authorization"])
@cache.cached(timeout=60, query_string=True)  # 使用缓存，按查询字符串作为缓存的唯一标识
def search():
    try:
        # print(f"start: {time.time()}")
        # 从 URL 参数获取 query 值
        query = request.args.get("query")
        limit = request.args.get("limit")
        oa = request.args.get("oa")
        ai = request.args.get("ai")
        
        if not ai:
            ai = True
        else:
            if ai.lower() == "false":
                ai = False
            else:
                ai = True


        print(ai)

        if not query:
            return jsonify({"error": "Query parameter is required"}), 400

        limit = 20

        results = []

        # print("no new problem")

        query_org_lang = query
        doi_flag = False
        try:
            search_doi = get_paper_info(query_org_lang)
            if search_doi["source"]:
                results.append(search_doi)
                query_org_lang = f"Find the paper with {query_org_lang}"
                doi_flag = True
        except:
            print("no doi")

        # print(f"finish 1: {time.time()}")

        if doi_flag == False:
            query_org = trans_ollama(query)
            if query_org == "" or query_org.lower() == "none":
                query_org = query_org_lang
            print(query_org)
            query = keyword_ollama(query_org)
            if query == "" or query.lower() == "none":
                query = query_org_lang
            print(query)

            # print(f"finish 2: {time.time()}")
            # 🔹 3️⃣ 继续查询 Milvus
            # data = search_scihub(client, collection_name, query, limit)
            # print(f"finish 3: {time.time()}")

            # 并发请求 OpenAlex
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                # 并发执行 fetch_openalex_papers
                # futures_process = [executor.submit(process_item, item) for item in data]

                if query == query_org:
                    future_arxiv_res = executor.submit(
                        fetch_openalex_papers, query.replace(",", " "), limit * 2, oa
                    )
                    arxiv_res = future_arxiv_res.result()
                    future_arxiv_res_org = []
                    results.extend(arxiv_res)
                else:
                    future_arxiv_res = executor.submit(
                        fetch_openalex_papers, query.replace(",", " "), limit * 2, oa
                    )
                    future_arxiv_res_org = executor.submit(
                        fetch_openalex_papers, query_org, limit * 2, oa
                    )
                    arxiv_res = future_arxiv_res.result()
                    arxiv_res_org = future_arxiv_res_org.result()
                    results.extend(arxiv_res)
                    results.extend(arxiv_res_org)

                # for future in concurrent.futures.as_completed(futures_process):
                #     results.append(future.result())

            # # 🔹 0️⃣ 先异步执行 Arxiv 查找
            # with ThreadPoolExecutor() as executor:
            #     # 使用 ThreadPoolExecutor 并发处理 Milvus 数据和 CrossRef 的第二次查找
            #     futures = []
            #     for item in data:
            #         futures.append(executor.submit(process_item, item, crossref_set))

            #     # 等待所有任务完成并收集结果
            #     for future in as_completed(futures):
            #         result = future.result()
            #         if result:  # 只有在有有效数据时才追加
            #             results.append(result)

            # print(results)

            print(f"finish 4: {time.time()}")

            res_bm25 = search_top_50(query)

            results.extend(res_bm25)

            # print(results)
            
            # 🔹 5️⃣ 对结果进行排序
            print(f"finish 5: {time.time()}")

            # print(results)
            # print(query_org)
            results = sort_papers_by_relevance(results, query_org)

        # 如果 DOI 已在 SciHub，则直接返回
        print(f"finish 6: {time.time()}")    
        if ai:
            sum = paragraph_to_json_dp(query_org_lang, str(results[:6]), limit)
        else:
            sum = {
                "cot": "",
                "sum": "User require no AI respone",
            }

        response = {
            "summary": sum,
            "results": results,
        }

        # print(f"finish 7: {time.time()}")

        return jsonify(response)

    except Exception as e:
        print(e)
        response = {
            "summary": {
                "cot": "",
                "sum": "Sorry, something wrong is happened, please try again",
            },
            "results": [],
        }
        return jsonify(response)

@app.route("/scihub", methods=["GET"])
@cross_origin(origin="*", headers=["Content-Type", "Authorization"])
@cache.cached(timeout=60, query_string=True)  # 使用缓存，按查询字符串作为缓存的唯一标识
def scihub():
    try:
        # print(f"start: {time.time()}")
        # 从 URL 参数获取 query 值
        query = request.args.get("query")
        limit = request.args.get("limit")
        oa = True

        if not query:
            return jsonify({"error": "Query parameter is required"}), 400
        results = []

        # print("no new problem")

        query_org_lang = query
        doi_flag = False
        try:
            search_doi = get_paper_info(query_org_lang)
            if search_doi["source"]:
                results.append(search_doi)
                query_org_lang = f"Find the paper with {query_org_lang}"
                doi_flag = True
        except:
            print("no doi")

        # print(f"finish 1: {time.time()}")

        if doi_flag == False:
            # print(query_org)
            query = keyword_ollama(query)
            if query == "" or query.lower() == "none":
                query = query_org_lang
            # print(query)

            # print(f"finish 2: {time.time()}")
            # 🔹 3️⃣ 继续查询 Milvus
            # data = search_scihub(client, collection_name, query, limit)
            # print(f"finish 3: {time.time()}")

            # 并发请求 OpenAlex
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                # 并发执行 fetch_openalex_papers
                # futures_process = [executor.submit(process_item, item) for item in data]

                if query == query_org_lang:
                    future_arxiv_res = executor.submit(
                        fetch_openalex_papers, query.replace(",", " "), limit * 2, oa
                    )
                    arxiv_res = future_arxiv_res.result()
                    future_arxiv_res_org = []
                    results.extend(arxiv_res)
                else:
                    future_arxiv_res = executor.submit(
                        fetch_openalex_papers, query.replace(",", " "), limit * 2, oa
                    )
                    future_arxiv_res_org = executor.submit(
                        fetch_openalex_papers, query_org_lang, limit * 2, oa
                    )
                    arxiv_res = future_arxiv_res.result()
                    arxiv_res_org = future_arxiv_res_org.result()
                    results.extend(arxiv_res)
                    results.extend(arxiv_res_org)

                # for future in concurrent.futures.as_completed(futures_process):
                #     results.append(future.result())

            # # 🔹 0️⃣ 先异步执行 Arxiv 查找
            # with ThreadPoolExecutor() as executor:
            #     # 使用 ThreadPoolExecutor 并发处理 Milvus 数据和 CrossRef 的第二次查找
            #     futures = []
            #     for item in data:
            #         futures.append(executor.submit(process_item, item, crossref_set))

            #     # 等待所有任务完成并收集结果
            #     for future in as_completed(futures):
            #         result = future.result()
            #         if result:  # 只有在有有效数据时才追加
            #             results.append(result)

            # print(f"finish 4: {time.time()}")

            res_bm25 = search_top_50(query)

            results.extend(res_bm25)
            # 🔹 5️⃣ 对结果进行排序
            # print(f"finish 5: {time.time()}")

            print(results)
            # print(query_org)
            results = sort_papers_by_relevance(results, query_org_lang)

        # 如果 DOI 已在 SciHub，则直接返回
        # print(f"finish 6: {time.time()}")    

        sum = {
            "cot": "",
            "sum": "User require no AI respone",
        }

        response = {
            "summary": sum,
            "results": results,
        }

        # print(f"finish 7: {time.time()}")

        return jsonify(response)

    except Exception as e:
        # print(e)
        response = {
            "summary": {
                "cot": "",
                "sum": "Sorry, something wrong is happened, please try again",
            },
            "results": [],
        }
        return jsonify(response)


@app.route("/searchscihub", methods=["GET"])
@cross_origin(origin="*", headers=["Content-Type", "Authorization"])
@cache.cached(timeout=60, query_string=True)  # 使用缓存，按查询字符串作为缓存的唯一标识
def searchscihub():
    try:
        # print(f"start: {time.time()}")
        # 从 URL 参数获取 query 值
        query = request.args.get("query")
        token = request.args.get("token")
        if token != "ao1ni1@*Njri1j*fi1iPPP11$5512xf1":
            return jsonify({"error": "Token is invalid"}), 400
        limit = 50
        oa = False
        if not query:
            return jsonify({"error": "Query parameter is required"}), 400

        query_org_lang = query

        # print(f"finish 1: {time.time()}")

        results = []

        try:
            search_doi = get_paper_info(query_org_lang)
            if search_doi["source"] and search_doi["source"] == "s":
                results.append(search_doi)
        except:
            print("no doi")

        # print(f"finish 2: {time.time()}")
        # 🔹 3️⃣ 继续查询 Milvus
        # data = search_scihub(client, collection_name, query, limit)
        # print(f"finish 3: {time.time()}")

        # 并发请求 OpenAlex
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            # 并发执行 fetch_openalex_papers
            # futures_process = [executor.submit(process_item, item) for item in data]

            future_arxiv_res = executor.submit(
                fetch_openalex_papers, query.replace(",", " "), limit * 2, oa
            )
            arxiv_res = future_arxiv_res.result()
            results.extend(arxiv_res)

            # for future in concurrent.futures.as_completed(futures_process):
            #     results.append(future.result())

        # # 🔹 0️⃣ 先异步执行 Arxiv 查找
        # with ThreadPoolExecutor() as executor:
        #     # 使用 ThreadPoolExecutor 并发处理 Milvus 数据和 CrossRef 的第二次查找
        #     futures = []
        #     for item in data:
        #         futures.append(executor.submit(process_item, item, crossref_set))

        #     # 等待所有任务完成并收集结果
        #     for future in as_completed(futures):
        #         result = future.result()
        #         if result:  # 只有在有有效数据时才追加
        #             results.append(result)

        # print(f"finish 4: {time.time()}")

        res_bm25 = search_top_50(query)

        results.extend(res_bm25)

        # 🔹 5️⃣ 对结果进行排序
        results = sort_papers_by_relevance(results, query)

        res = []
        # 如果 DOI 已在 SciHub，则直接返回
        for paper in results:
            if paper["source"] == "s":
                res.append(paper)

        # sum = paragraph_to_json_dp(query_org_lang, str(results[:3]), limit)

        response = {
            # "summary": sum,
            "results": res,
        }

        # print(f"finish 5: {time.time()}")

        return jsonify(response)

    except Exception as e:
        # print(e)
        response = {
            "summary": {
                "cot": "",
                "sum": "Sorry, something wrong is happened, please try again",
            },
            "results": [],
        }
        return jsonify(response)

# 处理单个 item 的函数
def process_item(item):
    if "title" not in item or "doi" not in item:
        return None

    doi = item["doi"]

    # **查询 CrossRef 获取详细信息**
    paper_info = get_paper_info(doi)

    return paper_info

# ---------------

chat_engines = {}
socketio = SocketIO(app, cors_allowed_origins="*")  # 允许跨域，便于前端测试

p = """
You are an advanced RAG Agent with access to a knowledge base containing various academic papers. Your task is to analyze and summarize the content of all papers in your knowledge base in a highly detailed, structured, and readable way using Markdown format. Please follow these instructions:

1. Retrieve and analyze all papers in your knowledge base.
2. For each paper, provide the following:
   - Title
   - A detailed analysis of the paper’s content, broken down into:
     - **Objective**: What problem or question the paper aims to address (1-2 sentences).
     - **Methodology**: How the research was conducted (e.g., techniques, datasets, experiments) (2-3 sentences).
     - **Key Findings**: The most important results or contributions (2-3 sentences).
     - **Implications**: The significance or potential impact of the findings (1-2 sentences).
3. Present the analysis in Markdown format with the following structure:
   - Use `##` for each paper’s title
   - Use a bullet list (`-`) for the detailed analysis sections (Objective, Methodology, Key Findings, Implications), with each section labeled in bold (e.g., **Objective:**)
4. Sort the papers alphabetically by title.
5. If any information is missing, note it as "Not available" in the respective field.

Output the result as a complete Markdown document. Ensure the analysis is concise, logically structured, and highlights the core content of each paper.
"""

@socketio.on("connect")
def handle_connect():
    session_id = request.sid
    paper_id = request.args.get("id")  # 前端传递的 doi
    source = request.args.get("source")  # 前端传递的 source（arxiv 或 scihub）
    dir_doc = ""

    if not paper_id or not source:
        emit("error", {"message": "Paper ID and source are required"})
        return

    if source == "scihub":
        dir_doc = get_scihub(paper_id)
    elif source == "arxiv":
        dir_doc = get_arxiv(paper_id)
    else:
        emit("error", {"message": "Invalid source"})
        return

    # print(dir_doc)
    chat_engine = chat_rag_init(p, dir_doc)
    if chat_engine is None:
        emit("error", {"message": "Failed to initialize chat engine"})
        return

    # 保存 chat_engine 到全局字典
    chat_engines[session_id] = chat_engine
    # print(
    #     f"Session {session_id} connected, chat_engine initialized for paper {paper_id} from {source}"
    # )
    emit("session_id", {"session_id": session_id})


# WebSocket 事件：客户端断开时
@socketio.on("disconnect")
def handle_disconnect():
    session_id = request.sid
    if session_id in chat_engines:
        del chat_engines[session_id]
        print(f"Session {session_id} ended and memory released")
    else:
        print(f"Session {session_id} disconnected, but no chat_engine found")


# WebSocket 事件：处理聊天请求
@socketio.on("chat")
def handle_chat(data):
    session_id = request.sid
    query = data.get("query")
    if not query:
        emit("error", {"message": "Query is required"})
        return

    if session_id not in chat_engines:
        emit("error", {"message": "Session not found"})
        return

    chat_engine = chat_engines[session_id]
    try:
        response = chat_engine.stream_chat(query)
        for chunk in response.response_gen:
            emit("response", {"chunk": chunk})
            # print(f"Sent chunk to {session_id}: {chunk}")
    except Exception as e:
        emit("error", {"message": f"Error during query: {str(e)}"})
        # print(f"Error in session {session_id}: {str(e)}")


# Flask 路由：单次查询（保留 HTTP 接口）
@app.route("/query", methods=["POST"])
@cross_origin(origin="*", headers=["Content-Type", "Authorization"])
def query():
    data = request.get_json()
    query_str = data.get("query")
    doc_dir = data.get("doc_dir", "default_doc_dir")
    index_dir = data.get("index_dir", "default_index_dir")
    temp_or_persist = data.get("temp_or_persist", "TEMP")

    if not query_str:
        return {"error": "Query is required"}, 400

    # 假设的 query_rag 函数
    result = query_rag(query_str, doc_dir, index_dir, temp_or_persist)
    return {"response": result}

# ------------------------------  

def get_db():
    conn = sqlite3.connect("SCAIENGINE/backend/invites.db")
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

# init_db()

@app.route("/invite", methods=["GET"])
@cross_origin(origin="*", headers=["Content-Type", "Authorization"])
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

@app.route("/verify-user", methods=["GET"])
@cross_origin(origin="*", headers=["Content-Type", "Authorization"])
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
    
# -----------------------------

INVITES_DB = "SCAIENGINE/backend/invites.db"
KOL_DB = "SCAIENGINE/backend/kol_database.db"

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


def generate_user_id():
    """生成唯一的 user_id"""
    return str(uuid.uuid4())


def generate_invite_code(user_id):
    """生成 invite_code（基于 user_id 的哈希）"""
    return hashlib.sha256(user_id.encode()).hexdigest()[:16]


@app.route("/kolspec", methods=["POST"])
def redeem_kol_code():
    # 获取客户端 IP
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    # 如果 X-Forwarded-For 包含多个 IP（代理链），取第一个
    if ',' in client_ip:
        client_ip = client_ip.split(',')[0].strip()

    data = request.get_json()
    if not data or "code" not in data:
        return jsonify({"success": False, "message": "KOL code is required"}), 400

    code = data["code"]

    # 连接到 kol_database.db
    kol_conn = get_kol_db()
    kol_cursor = kol_conn.cursor()

    # print(client_ip)
    # 检查该IP是否已经兑换过
    kol_cursor.execute("SELECT user_id FROM redeemed_users WHERE ip_address = ?", (client_ip,))
    if kol_cursor.fetchone():
        kol_conn.close()
        return jsonify({"success": False, "message": "This IP has already redeemed a code"}), 403

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
            (invite_code, user_id, datetime.now().isoformat(), True),
        )
        invites_conn.commit()
        invites_conn.close()

        # 更新 kol_database.db
        kol_cursor.execute(
        "UPDATE kols SET remaining_count = remaining_count - 1 WHERE code = ?",
            (code,),
        )
        kol_cursor.execute(
            "INSERT INTO redeemed_users (code, user_id, invite_code, ip_address) VALUES (?, ?, ?, ?)",
            (code, user_id, invite_code, client_ip),
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
    
# ----------------------

from flask import g

SCIHUB_DB = "scihub_dois.db"
ITEMS_PER_PAGE = 100

def get_db_connection():
    """获取数据库连接，复用已存在的连接"""
    if 'db' not in g:
        g.db = sqlite3.connect(SCIHUB_DB)
        g.db.row_factory = sqlite3.Row
    return g.db

# @app.teardown_appcontext
# def close_db_connection(exception):
#     """在请求结束后关闭数据库连接"""
#     db = g.pop('db', None)
#     if db is not None:
#         db.close()

def get_total_count():
    """获取 DOI 总记录数并缓存"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM dois")
    total_count = cursor.fetchone()[0]
    return total_count

@app.route('/dois', methods=['GET'])
def get_dois():
    """分页获取 DOI 数据"""
    try:
        page = request.args.get('page', default=1, type=int)
        if page < 1:
            return jsonify({"error": "Page number must be greater than 0"}), 400

        offset = (page - 1) * ITEMS_PER_PAGE

        conn = get_db_connection()
        cursor = conn.cursor()

        # 查询当前页数据
        cursor.execute(
            "SELECT doi FROM dois LIMIT ? OFFSET ?",
            (ITEMS_PER_PAGE, offset)
        )
        dois = [row['doi'] for row in cursor.fetchall()]

        response = {
            "page": page,
            "per_page": ITEMS_PER_PAGE,
            "dois": dois
        }

        return jsonify(response), 200

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500
        
# ---------------

if __name__ == "__main__":
    # app.run(host="0.0.0.0", port=7788)
    socketio.run(app, host="0.0.0.0", port=7788)

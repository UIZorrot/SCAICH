from bs4 import BeautifulSoup
import concurrent
from flask import Flask, request, jsonify
from flask_caching import Cache
from flask_cors import CORS, cross_origin
from pymilvus import MilvusClient
import requests
import time
import requests_cache
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
        if paper.get("doi") is None or paper.get("location") == "Not Available":
            continue

        title = extract_text_from_html(paper["title"]).lower().replace(" ", "")
        if title not in seen_titles:
            unique_papers.append(paper)
            seen_titles.add(title)

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

client = MilvusClient("http://localhost:19530")
collection_name = "scihub_rag"

@app.route("/searchfulltext", methods=["GET"])
@cross_origin(origin="*", headers=["Content-Type", "Authorization"])
@cache.cached(timeout=60, query_string=True)  # 使用缓存，按查询字符串作为缓存的唯一标识
def searchfulltext():
    print()

@app.route("/search", methods=["GET"])
@cross_origin(origin="*", headers=["Content-Type", "Authorization"])
@cache.cached(timeout=60, query_string=True)  # 使用缓存，按查询字符串作为缓存的唯一标识
def search():
    try:
        print(f"start: {time.time()}")
        # 从 URL 参数获取 query 值
        query = request.args.get("query")
        limit = request.args.get("limit")
        oa = request.args.get("oa")
        if not query:
            return jsonify({"error": "Query parameter is required"}), 400

        if not limit or int(limit) <= 5:
            limit = 10
        else:
            limit = 20

        results = []

        query_org_lang = query
        try:
            search_doi = get_paper_info(query_org_lang)
            if search_doi["source"] and search_doi["source"] == "s":
                results.append(search_doi)
        except:
            print("no doi")

        print(f"finish 1: {time.time()}")

        query_org = trans_ollama(query)
        if query_org == "" or query_org.lower() == "none":
            query_org = query_org_lang
        print(query_org)
        query = keyword_ollama(query_org)
        if query == "" or query.lower() == "none":
            query = query_org_lang
        print(query)

        print(f"finish 2: {time.time()}")
        # 🔹 3️⃣ 继续查询 Milvus
        data = search_scihub(client, collection_name, query, limit)
        results.append(data)
        print(f"finish 3: {time.time()}")

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

        print(f"finish 4: {time.time()}")

        res_bm25 = search_top_50(query)

        results.extend(res_bm25)
        # 🔹 5️⃣ 对结果进行排序
        results = sort_papers_by_relevance(results, query_org)

        # 如果 DOI 已在 SciHub，则直接返回

        sum = paragraph_to_json_dp(query_org_lang, str(results[:3]), limit)

        response = {
            "summary": sum,
            "results": results[: (limit * 2)],
        }

        print(f"finish 5: {time.time()}")

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


@app.route("/searchscihub", methods=["GET"])
@cross_origin(origin="*", headers=["Content-Type", "Authorization"])
@cache.cached(timeout=60, query_string=True)  # 使用缓存，按查询字符串作为缓存的唯一标识
def searchscihub():
    try:
        print(f"start: {time.time()}")
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

        print(f"finish 1: {time.time()}")

        results = []

        try:
            search_doi = get_paper_info(query_org_lang)
            if search_doi["source"] and search_doi["source"] == "s":
                results.append(search_doi)
        except:
            print("no doi")

        print(f"finish 2: {time.time()}")
        # 🔹 3️⃣ 继续查询 Milvus
        data = search_scihub(client, collection_name, query, limit)
        results.append(data)
        print(f"finish 3: {time.time()}")

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

        print(f"finish 4: {time.time()}")

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

        print(f"finish 5: {time.time()}")

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


# 处理单个 item 的函数
def process_item(item):
    if "title" not in item or "doi" not in item:
        return None

    doi = item["doi"]

    # **查询 CrossRef 获取详细信息**
    paper_info = get_paper_info(doi)

    return paper_info


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7788)

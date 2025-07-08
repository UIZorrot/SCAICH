import re
from bs4 import BeautifulSoup
from openai import OpenAI
import requests
import sqlite3
from threading import Thread
import urllib.parse
import json

db_path = "scihub_dois.db"
# 定义数据库路径
DB1_PATH = "/mnt/volume_nyc3_01/scihub_fts_missing_abstract_dois.db"
DB2_PATH = "/mnt/volume_nyc3_01/scihub_fts_existing_dois.db"
DB3_PATH = "/mnt/volume_nyc3_01/fixed_arxiv_meta_full.db"

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def check_irys_article(doi: str) -> bool:
    """
    检查 Irys 上是否存在指定 DOI 的论文。

    Args:
        doi (str): 要检查的 DOI，例如 "10.1007/s12083-023-01582-x"

    Returns:
        bool: 如果论文存在返回 True，否则返回 False
    """
    # 清洗 DOI，移除可能的 "https://doi.org/" 或 "http://doi.org/" 前缀
    clean_doi = doi.replace("https://doi.org/", "").replace("http://doi.org/", "")

    # 构造 GraphQL 查询
    query = """
        query {
            transactions(
                tags: [
                    { name: "App-Name", values: ["scivault"] },
                    { name: "Content-Type", values: ["application/pdf"] },
                    { name: "Version", values: ["2.0.0"] },
                    { name: "doi", values: ["%s"] }
                ]
            ) {
                edges {
                    node {
                        id
                        tags { name value }
                    }
                }
            }
        }
    """ % clean_doi

    # 设置请求头
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        # 发送 POST 请求到 GraphQL 端点
        response = requests.post(
            "https://uploader.irys.xyz/graphql",
            headers=headers,
            json={"query": query},
            timeout=10
        )

        # 检查响应状态码
        if response.status_code == 200:
            # 解析 JSON 响应
            result = response.json()
            # 检查是否存在 transactions.edges 且不为空
            edges = result.get("data", {}).get("transactions", {}).get("edges", [])
            return len(edges) > 0
        return False
    except (requests.exceptions.RequestException, json.JSONDecodeError):
        return False
    
def check_sci_net_article(doi):
    """
    检查 Sci-Net 上是否存在指定 DOI 的文章。

    Args:
        doi (str): 要检查的 DOI，例如 "10.1007/s12083-023-01582-x"

    Returns:
        bool: 如果文章存在返回 True，否则返回 False
    """
    # 清洗 DOI，移除可能的 "https://doi.org/" 或 "http://doi.org/" 前缀
    clean_doi = doi.replace("https://doi.org/", "").replace("http://doi.org/", "")
    
    # 构造 Sci-Net URL
    sci_net_url = f"https://sci-net.xyz/{urllib.parse.quote(clean_doi)}"
    
    # 设置请求头，模拟浏览器
    headers = {
        "Accept": "text/html",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        # 发送 GET 请求，允许重定向以捕获最终 URL
        response = requests.get(sci_net_url, headers=headers, timeout=10, allow_redirects=True)
        
        # 获取最终 URL（处理重定向）
        final_url = response.url
        
        # 检查响应是否为有效论文页面
        if response.status_code == 200:
            content_type = response.headers.get("Content-Type", "")
            is_valid_page = (
                content_type.startswith("text/html") and  # 确保是 HTML 页面
                final_url == sci_net_url and  # 未重定向
                not final_url.endswith("sci-net.xyz/") and  # 不是主页
                not final_url.endswith("sci-net.xyz")
            )
            return is_valid_page
        return False
    except requests.exceptions.RequestException:
        return False
    
def extract_arxiv_id(url):
    """
    检查URL是否包含arXiv ID，如果包含则提取出来
    参数：url (str) - 需要检查的URL
    返回：str 或 None - 如果找到arXiv ID则返回ID，否则返回None
    """
    # arXiv ID的正则表达式模式
    # 匹配格式如：arxiv.2102.05095 或 arXiv:2102.05095
    if not url:
        return None

    pattern = r'(?:arxiv\.|arXiv:)([0-9]{4}\.[0-9]{4,5}|[0-9]{2}[0-9]{2}\.[0-9]{5})'
    
    # 在URL中搜索匹配
    match = re.search(pattern, url)
    
    if match:
        # 返回捕获的arXiv ID部分
        return f"https://arxiv.org/pdf/{match.group(1)}"
    return None

def convert_to_download_url(url):
    # 提取 DOI 号码
    if "doi.org/" in url:
        doi = url.split("doi.org/")[1]
    elif url.startswith("10."):
        doi = url
    else:
        return None
    
    # 移除 DOI 中的所有斜杠
    doi_cleaned = doi.replace("/", "")
    
    # 构造新的 URL 格式
    new_url = f"https://gnfd-testnet-sp1.bnbchain.org/download/scai/bnbgf-exp/{doi_cleaned}.pdf"
    return new_url

def is_in_bnb(doi):
    doi_list = [
        "https://doi.org/10.1109/comsnets59351.2024.10426894",
        "https://doi.org/10.1145/3597926.3598111",
        "https://doi.org/10.1109/bigcomp60711.2024.00030"
    ]
    if not doi:
        return False
    for _doi in doi_list:
        if str(_doi) == str(doi):
            print(doi)
            return True
    return False

def reorder_by_query(result, query_org_lang):
    """
    根据query_org_lang重新排序result列表，将完全匹配的第一项或最相似项放到首位
    
    Args:
        result: 包含多个paper_info字典的列表
        query_org_lang: 要搜索的查询字符串
    
    Returns:
        重新排序后的result列表
    """
    if not result or not query_org_lang:
        return result
    
    # 转换为小写以进行不区分大小写的比较
    query_lower = query_org_lang.lower()
    
    # 检查完全匹配并找到第一个匹配项
    matched_idx = -1
    for i, item in enumerate(result):
        fields_to_check = [
            str(item.get("title", "")).lower(),
            str(item.get("abstract", "")).lower(),
            str(item.get("author", "")).lower(),
            str(item.get("location", "")).lower()
        ]
        
        # 检查是否完全包含
        for field in fields_to_check:
            if query_lower in field:
                matched_idx = i
                break
        if matched_idx != -1:
            break
    
    # 如果找到完全匹配，将该项放到首位
    if matched_idx != -1:
        reordered = [result[matched_idx]] + result[:matched_idx] + result[matched_idx + 1:]
        return reordered
    
    # 如果没有完全匹配，计算TF-IDF和余弦相似度
    # 合并所有字段为一个文档
    documents = []
    for item in result:
        text = " ".join([
            str(item.get("title", "")),
            str(item.get("abstract", "")),
            str(item.get("author", "")),
            str(item.get("location", ""))
        ]).lower()
        documents.append(text)
    
    # 创建TF-IDF向量
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(documents + [query_lower])
    
    # 计算余弦相似度
    similarities = cosine_similarity(tfidf_matrix[-1:], tfidf_matrix[:-1])[0]
    
    # 找到最相似项的索引
    best_match_idx = np.argmax(similarities)
    
    # 将最相似项放到首位
    reordered = [result[best_match_idx]] + result[:best_match_idx] + result[best_match_idx + 1:]
    return reordered

def calculate_relevance(paper, query):
    """自定义相关性评分函数，加入 aid 的匹配"""
    score = 0.0
    query_words = set(query.lower().split())

    if paper["title"].lower():
        title_words = set(paper["title"].lower().split())
        title_matches = len(query_words & title_words)
        score += 2.0 * title_matches

    if paper["abstract"] != "Not Available" and paper["abstract"].lower():
        abstract_words = set(paper["abstract"].lower().split())
        abstract_matches = len(query_words & abstract_words)
        score += 1.0 * abstract_matches

    if paper["author"].lower():
        author_words = set(paper["author"].lower().split(", "))
        author_matches = len(query_words & author_words)
        score += 0.5 * author_matches

    # 新增：如果有 aid，计算其相关性
    if paper["aid"] != "Not Applicable" and paper["aid"].lower():
        aid_words = set(paper["aid"].lower().split())
        aid_matches = len(query_words & aid_words)
        score += 0.5 * aid_matches  # aid 匹配权重可以调整，这里设为 0.5

    score += -paper["rank"]
    return score

def search_top_50(
    query, limit=25, db1_path=DB1_PATH, db2_path=DB2_PATH, db3_path=DB3_PATH
):
    def get_top_50_from_db(db_path, query, source_name, limit):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()

            # Check if the table is an FTS table and get its columns
            cursor.execute("PRAGMA table_info(literature);")
            columns = [row[1] for row in cursor.fetchall()]
            print(f"{source_name} table columns: {columns}")

            # Validate required columns
            required_columns = ["doi", "title", "author", "rank"]
            if source_name == "arxiv":
                required_columns.append("abstract")
            
            missing_columns = [col for col in required_columns if col not in columns]
            if missing_columns:
                print(f"Error: Missing columns {missing_columns} in {source_name} database")
                return []

            if source_name == "arxiv":
                # Query for arxiv, matching title, abstract, or doi
                query_str = """
                    SELECT doi, title, author, abstract
                    FROM literature 
                    WHERE title MATCH ? OR abstract MATCH ? OR doi MATCH ?
                    LIMIT ?;
                """
                cursor.execute(query_str, (query, query, query, limit))
            else:
                # Query for scihub, matching title or doi
                query_str = """
                    SELECT doi, title, author
                    FROM literature 
                    WHERE title MATCH ? OR doi MATCH ?
                    LIMIT ?;
                """
                cursor.execute(query_str, (query, query, limit))
            
            results = cursor.fetchall()
            conn.close()
            print(f"{source_name} returned {len(results)} records")

            formatted_results = []
            for row in results:
                doi = row[0]
                authors = row[2].split(", ") if row[2] else []
                aid = doi if source_name == "arxiv" else "Not Applicable"
                abstract = row[3] if source_name == "arxiv" and len(row) > 4 else "Not Available"

                paper_info = {
                    "source": source_name,
                    "title": row[1] if row[1] else "Unknown",
                    "doi": doi,
                    "abstract": abstract,
                    "referencecount": 0,
                    "author": ", ".join(authors) if authors else "Unknown",
                    "year": "Unknown",
                    "url": f"https://www.doi.org/{doi}",
                    "location": "Not Available",
                    "scihub_url": f"https://www.doi.org/{doi}",
                    "aid": aid,
                    "rank": row[-1],
                    "is_oa": True,
                    "scinet": False
                }

                if is_in_bnb(paper_info["doi"]):
                    paper_info["url"] = convert_to_download_url(paper_info["doi"])

                formatted_results.append(paper_info)

            return formatted_results

        except sqlite3.OperationalError as e:
            print(f"Database {source_name} query failed: {e}")
            return []
        finally:
            if 'conn' in locals():
                conn.close()

    def merge_and_get_final_top_50(top50_db1, top50_db2, top50_db3):
        combined_results = top50_db1 + top50_db2 + top50_db3
        for paper in combined_results:
            paper["relevance_score"] = calculate_relevance(paper, query)
        sorted_results = sorted(
            combined_results, key=lambda x: x["relevance_score"], reverse=True
        )
        return sorted_results[:limit]

    top50_db1, top50_db2, top50_db3 = [None], [None], [None]

    def fetch_db1():
        top50_db1[0] = get_top_50_from_db(db1_path, query, "scihub", limit)

    def fetch_db2():
        top50_db2[0] = get_top_50_from_db(db2_path, query, "scihub", limit)

    def fetch_db3():
        top50_db3[0] = get_top_50_from_db(db3_path, query, "arxiv", limit)

    t1 = Thread(target=fetch_db1)
    t2 = Thread(target=fetch_db2)
    t3 = Thread(target=fetch_db3)
    t1.start()
    t2.start()
    t3.start()
    t1.join()
    t2.join()
    t3.join()

    print(f"DB1 results: {len(top50_db1[0]) if top50_db1[0] else 0}")
    print(f"DB2 results: {len(top50_db2[0]) if top50_db2[0] else 0}")
    print(f"DB3 results: {len(top50_db3[0]) if top50_db3[0] else 0}")

    final_top50 = merge_and_get_final_top_50(
        top50_db1[0] or [], top50_db2[0] or [], top50_db3[0] or []
    )
    return final_top50


def get_doi(doi):
    doi_s = str(doi).replace(" ", "").replace("https://doi.org/", "").lower()
    return doi_s


def is_doi_in_db(db_path, doi):
    doi_s = str(doi).replace(" ", "").replace("https://doi.org/", "").lower()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM dois WHERE doi = ?", (doi_s,))
    result = cursor.fetchone()
    conn.close()
    return result is not None


def restore_abstract(abstract_inverted_index):
    if not abstract_inverted_index:
        return "Abstract Not Available"

    # 找到所有的索引位置并按顺序排列
    inverted_index = abstract_inverted_index
    restored_abstract = []

    # 遍历所有倒排索引中的单词
    for word, positions in inverted_index.items():
        # 如果位置是整数类型，才加入排序列表
        if isinstance(positions, list):
            for position in positions:
                # 确保只有整数类型的位置才添加
                if isinstance(position, int):
                    restored_abstract.append((position, word))

    # 按照位置对所有单词进行排序
    restored_abstract.sort(key=lambda x: x[0])

    # 拼接排序后的单词，生成完整的 abstract
    final_abstract = " ".join(
        [str(word) for _, word in restored_abstract]
    )  # 将每个单词转换为字符串
    return final_abstract


# 调用函数还原 abstract
# print(restore_abstract(abstract_inverted_index['abstract_inverted_index']))


def extract_source_names(locations):
    data = []
    if isinstance(locations, str):
        return locations
    if locations is None:
        return "Not Available"
    # 提取所有的 source.display_name
    for location in locations:
        try:
            data.append(location.get("source").get("display_name"))
        except:
            data.append("Not Available")

    if data == []:
        data.append("Not Available")

    # 将所有的 source.display_name 连接成一个字符串
    return ", ".join(data[:1])


def fetch_openalex_papers(search_term, per_page, oa, page=1):
    
    if oa == True:
        url = f"https://api.openalex.org/works?search={search_term}&filter=open_access.is_oa:true&per-page={per_page}&page={page}&sort=relevance_score:desc"
    else:
        url = f"https://api.openalex.org/works?search={search_term}&per-page={per_page}&page={page}&sort=relevance_score:desc"
    response = requests.get(url)

    if response.status_code != 200:
        return {"error": "Failed to fetch data from OpenAlex"}

    data = response.json()
    papers = []

    for paper in data.get("results", []):
        # 获取摘要
        abstract = restore_abstract(paper.get("abstract_inverted_index", {}))

        # 处理作者信息
        authors = [
            author["author"].get("display_name", "Unknown")
            for author in paper.get("authorships", [])
        ]

        # 整理成指定格式
        paper_info = {
            "source": "other",  # 你可以根据实际情况修改这个值
            "title": paper.get("title", "Unknown"),
            "doi": paper.get("doi", "Unknown"),
            "abstract": abstract,
            "referencecount": paper.get("cited_by_count", 0),
            "author": (", ".join(authors) if authors else "Unknown"),
            "year": paper.get("publication_year", "Unknown"),
            "url": paper.get("doi", "Unknown"),
            "location": extract_source_names(paper.get("locations", "Not Available")),
            "scihub_url": paper.get("doi", "Unknown"),
            "is_oa": paper.get("open_access").get("is_oa"),
            "scinet": False
        }

        # print(paper_info["title"])
        # print(str(paper_info["doi"]).replace(" ","").replace("https://doi.org/","").lower())
        # print(is_doi_in_db(db_path, paper_info["doi"]))

        if not paper_info["doi"]:
            continue
        
        paper_info = paper_info_mod(paper_info)
 
        papers.append(paper_info)

    return papers


def get_paper_info(doi):
    url = f"https://api.openalex.org/works/doi:{doi}"
    response = requests.get(url)

    if response.status_code != 200:
        return {"error": "Failed to fetch data from OpenAlex"}

    paper = response.json()

    # 获取摘要
    abstract = restore_abstract(paper.get("abstract_inverted_index", {}))

    # 处理作者信息
    authors = [
        author["author"].get("display_name", "Unknown")
        for author in paper.get("authorships", [])
    ]

    # 整理成指定格式
    paper_info = {
        "source": "other",  # 你可以根据实际情况修改这个值
        "title": paper.get("title", "Unknown"),
        "doi": doi,
        "abstract": abstract,
        "referencecount": paper.get("cited_by_count", 0),
        "author": (", ".join(authors) if authors else "Unknown"),
        "year": paper.get("publication_year", "Unknown"),
        "url": "https://www.doi.org/" + str(doi),
        "location": extract_source_names(paper.get("locations", "Not Available")),
        "scihub_url": "https://www.doi.org/" + str(doi),
        "is_oa": paper.get("open_access").get("is_oa"),
        "scinet": False
    }

    paper_info = paper_info_mod(paper_info)

    return paper_info


def fetch_openalex_papers_first(search_term, per_page=10, page=1):
    url = f"https://api.openalex.org/works?search={search_term}&per-page={per_page}&page={page}&sort=relevance_score:desc"
    response = requests.get(url)

    if response.status_code != 200:
        return {"error": "Failed to fetch data from OpenAlex"}

    data = response.json()
    papers = []

    for paper in data.get("results", []):
        # 获取摘要
        abstract = restore_abstract(paper.get("abstract_inverted_index", {}))

        # 处理作者信息
        authors = [
            author["author"].get("display_name", "Unknown")
            for author in paper.get("authorships", [])
        ]

        # 整理成指定格式
        paper_info = {
            "source": "other",  # 你可以根据实际情况修改这个值
            "title": paper.get("title", "Unknown"),
            "doi": paper.get("doi", "Unknown"),
            "abstract": abstract,
            "referencecount": paper.get("cited_by_count", 0),
            "author": (", ".join(authors) if authors else "Unknown"),
            "year": paper.get("publication_year", "Unknown"),
            "url": paper.get("doi", "Unknown"),
            "location": extract_source_names(paper.get("locations", "Not Available")),
            "scihub_url": paper.get("doi", "Unknown"),
            "is_oa": paper.get("open_access").get("is_oa"),
            "scinet": False
        }

        paper_info = paper_info_mod(paper_info)

        papers.append(paper_info)

    return papers

def paper_info_mod(paper_info):
        if is_doi_in_db(db_path, paper_info["doi"]):
            paper_info["source"] = "scihub"
            paper_info["url"] = "https://sci-hub.se/" + get_doi(paper_info["doi"])
            paper_info["scihub_url"] = "https://sci-hub.se/" + get_doi(
                paper_info["doi"]
            )
            return paper_info
        else:
            if check_sci_net_article(paper_info["doi"]):
                paper_info["source"] = "scinet"
                paper_info["scinet"] = True
                return paper_info

        if str(paper_info["location"]).lower().__contains__("arxiv"):
            paper_info["source"] = "arxiv"

        if extract_arxiv_id(paper_info["url"]):
            res_url = extract_arxiv_id(paper_info["url"])
            paper_info["url"] = res_url
            return paper_info

        if is_in_bnb(paper_info["doi"]):
            paper_info["url"] = convert_to_download_url(paper_info["doi"])
            paper_info["source"] = "gf"
            return paper_info

        if check_irys_article(paper_info["doi"]):
            paper_info["url"] = convert_to_download_url(paper_info["doi"])
            paper_info["source"] = "irys"
            return paper_info

        return paper_info
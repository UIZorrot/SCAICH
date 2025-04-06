import os
from dotenv import load_dotenv
import re
from bs4 import BeautifulSoup
from openai import OpenAI
import requests
import sqlite3
from threading import Thread

# 加载 .env 文件
load_dotenv()

# 从环境变量中获取数据库路径
db_path = os.getenv("DB_PATH")
DB1_PATH = os.getenv("DB1_PATH")
DB2_PATH = os.getenv("DB2_PATH")
DB3_PATH = os.getenv("DB3_PATH")

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

    if paper["aid"] != "Not Applicable" and paper["aid"].lower():
        aid_words = set(paper["aid"].lower().split())
        aid_matches = len(query_words & aid_words)
        score += 0.5 * aid_matches

    score += -paper["rank"]
    return score

def search_top_50(
    query, limit=50, db1_path=DB1_PATH, db2_path=DB2_PATH, db3_path=DB3_PATH
):
    def get_top_50_from_db(db_path, query, source_name, limit):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        try:
            if source_name == "arxiv":
                cursor.execute(
                    """
                    SELECT doi, title, author, abstract, rank
                    FROM literature 
                    WHERE literature MATCH ? OR doi MATCH ?
                    ORDER BY rank
                    LIMIT ?;
                    """,
                    (query, query, limit),
                )
                results = cursor.fetchall()
            else:
                cursor.execute(
                    """
                    SELECT doi, title, author, rank
                    FROM literature 
                    WHERE literature MATCH ?
                    ORDER BY rank
                    LIMIT ?;
                    """,
                    (query, limit),
                )
                results = cursor.fetchall()
        except sqlite3.OperationalError as e:
            print(f"数据库 {source_name} 查询失败: {e}")
            results = []

        conn.close()
        print(f"{source_name} 返回 {len(results)} 条记录")

        formatted_results = []
        for row in results:
            doi = row[0]
            authors = row[2].split(", ") if row[2] else []
            aid = doi if source_name == "arxiv" else "Not Applicable"
            abstract = (
                row[3] if source_name == "arxiv" and len(row) > 4 else "Not Available"
            )

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
            }
            formatted_results.append(paper_info)

        return formatted_results

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
        top50_db3[0] = get_top_50_from_db(db3_path, query, "arXiv", limit)

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

    restored_abstract = []
    for word, positions in abstract_inverted_index.items():
        if isinstance(positions, list):
            for position in positions:
                if isinstance(position, int):
                    restored_abstract.append((position, word))

    restored_abstract.sort(key=lambda x: x[0])
    final_abstract = " ".join([str(word) for _, word in restored_abstract])
    return final_abstract

def extract_source_names(locations):
    data = []
    if isinstance(locations, str):
        return locations
    if locations is None:
        return "Not Available"
    for location in locations:
        try:
            data.append(location.get("source").get("display_name"))
        except:
            data.append("Not Available")

    if data == []:
        data.append("Not Available")
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
        abstract = restore_abstract(paper.get("abstract_inverted_index", {}))
        authors = [
            author["author"].get("display_name", "Unknown")
            for author in paper.get("authorships", [])
        ]

        paper_info = {
            "source": "a",
            "title": paper.get("title", "Unknown"),
            "doi": paper.get("doi", "Unknown"),
            "abstract": abstract,
            "referencecount": paper.get("cited_by_count", 0),
            "author": (", ".join(authors) if authors else "Unknown"),
            "year": paper.get("publication_year", "Unknown"),
            "url": paper.get("doi", "Unknown"),
            "location": extract_source_names(paper.get("locations", "Not Available")),
            "scihub_url": paper.get("doi", "Unknown"),
        }

        if is_doi_in_db(db_path, paper_info["doi"]):
            paper_info["source"] = "s"
            paper_info["url"] = "https://sci-hub.se/" + get_doi(paper_info["doi"])
            paper_info["scihub_url"] = "https://sci-hub.se/" + get_doi(
                paper_info["doi"]
            )

        papers.append(paper_info)

    return papers

def get_paper_info(doi):
    url = f"https://api.openalex.org/works/doi:{doi}"
    response = requests.get(url)

    if response.status_code != 200:
        return {"error": "Failed to fetch data from OpenAlex"}

    paper = response.json()
    abstract = restore_abstract(paper.get("abstract_inverted_index", {}))
    authors = [
        author["author"].get("display_name", "Unknown")
        for author in paper.get("authorships", [])
    ]

    paper_info = {
        "source": "a",
        "title": paper.get("title", "Unknown"),
        "doi": doi,
        "abstract": abstract,
        "referencecount": paper.get("cited_by_count", 0),
        "author": (", ".join(authors) if authors else "Unknown"),
        "year": paper.get("publication_year", "Unknown"),
        "url": "https://www.doi.org/" + str(doi),
        "location": extract_source_names(paper.get("locations", "Not Available")),
        "scihub_url": "https://www.doi.org/" + str(doi),
    }

    if is_doi_in_db(db_path, doi):
        paper_info["source"] = "s"
        paper_info["url"] = "https://sci-hub.se/" + str(doi)
        paper_info["scihub_url"] = "https://sci-hub.se/" + str(doi)

    return paper_info

def fetch_openalex_papers_first(search_term, per_page=10, page=1):
    url = f"https://api.openalex.org/works?search={search_term}&per-page={per_page}&page={page}&sort=relevance_score:desc"
    response = requests.get(url)

    if response.status_code != 200:
        return {"error": "Failed to fetch data from OpenAlex"}

    data = response.json()
    papers = []

    for paper in data.get("results", []):
        abstract = restore_abstract(paper.get("abstract_inverted_index", {}))
        authors = [
            author["author"].get("display_name", "Unknown")
            for author in paper.get("authorships", [])
        ]

        paper_info = {
            "source": "a",
            "title": paper.get("title", "Unknown"),
            "doi": paper.get("doi", "Unknown"),
            "abstract": abstract,
            "referencecount": paper.get("cited_by_count", 0),
            "author": (", ".join(authors) if authors else "Unknown"),
            "year": paper.get("publication_year", "Unknown"),
            "url": paper.get("doi", "Unknown"),
            "location": extract_source_names(paper.get("locations", "Not Available")),
            "scihub_url": paper.get("doi", "Unknown"),
        }

        if is_doi_in_db(db_path, paper_info["doi"]):
            paper_info["source"] = "s"
            paper_info["url"] = "https://sci-hub.se/" + get_doi(paper_info["doi"])
            paper_info["scihub_url"] = "https://sci-hub.se/" + get_doi(
                paper_info["doi"]
            )

        papers.append(paper_info)

    return papers
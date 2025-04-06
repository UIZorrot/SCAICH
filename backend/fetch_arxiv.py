import arxiv
import re
from typing import List, Dict


class PaperSearcher:
    def __init__(self):
        pass

    def _get_paper_hash(self, title, authors):
        # 这里是哈希获取函数的实现
        return hash(title + "".join(authors))

    def extract_arxiv_info(self, paper: dict) -> dict:
        """从paper中提取 DOI 和 AID"""
        # 使用正则表达式从url中提取文章ID
        arxiv_id = re.search(r"abs/([0-9]+\.[0-9]+[a-zA-Z0-9]+)", paper["url"])
        if arxiv_id:
            arxiv_id = arxiv_id.group(1)  # 提取ID部分，如2501.04004v1
        else:
            arxiv_id = None

        # 创建所需的字典结构
        paper_info = {
            "title": paper["title"],
            "doi": None,  # DOI无法从提供的数据中提取，保留为None
            "aid": arxiv_id,
        }
        return paper_info

    def _search_arxiv(self, query: str, max_results: int = 10) -> List[Dict]:
        """从 arXiv 搜索论文"""
        papers = []
        try:
            # , sort_order= arxiv.SortOrder.Ascending
            # sort_by=arxiv.SortCriterion.LastUpdatedDate
            search = arxiv.Search(
                query=f'ti:"{query}"',
                max_results=max_results,
                sort_by=arxiv.SortCriterion.SubmittedDate,
                sort_order=arxiv.SortOrder.Ascending,
            )

            search1 = arxiv.Search(
                query=query,
                max_results=max_results,
                sort_by=arxiv.SortCriterion.Relevance,
            )

            for result in search1.results():
                paper_data = {
                    "source": "a",
                    "doi": result.entry_id,
                    "title": result.title,
                    "author": [(author.name + ", ") for author in result.authors],
                    "abstract": result.summary,
                    "year": result.published,
                    "scihub_url": result.entry_id,
                    "url": result.entry_id,
                    "referencecount": "Not Available",
                }
                papers.append(paper_data)

            for result in search.results():
                paper_data = {
                    "source": "a",
                    "doi": result.entry_id,
                    "title": result.title,
                    "author": [(author.name + ", ") for author in result.authors],
                    "abstract": result.summary,
                    "year": result.published,
                    "scihub_url": result.entry_id,
                    "url": result.entry_id,
                    "referencecount": "Not Available",
                }
                papers.append(paper_data)
        except Exception as e:
            print(f"arXiv search error: {e}")

        return papers


# # 使用示例
# searcher = PaperSearcher()

# # 搜索论文（例如搜索“machine learning”）
# results = searcher._search_arxiv("machine learning", max_results=5)

# # 打印提取后的论文信息
# for paper in results:
#     print(paper)

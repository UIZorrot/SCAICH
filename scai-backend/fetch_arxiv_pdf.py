import os
import time

from pypdf import PdfReader

import requests
import re


def extract_arxiv_id(doi_url):
    """
    从 DOI URL 中提取 arXiv ID。

    参数:
        doi_url (str): DOI URL，例如 "https://doi.org/10.48550/arxiv.1706.03762"

    返回:
        str: arXiv ID，例如 "1706.03762"，如果未找到则返回 None
    """
    # 定义正则表达式，匹配 arxiv. 后面的 ID
    pattern = r"arxiv\.(\d+\.\d+)"

    # 在 URL 中搜索匹配的模式
    match = re.search(pattern, doi_url)

    if match:
        return match.group(1)  # 返回捕获组中的 arXiv ID
    else:
        return None


def extract_arxiv_id_from_arxiv_url(url):
    """
    从arXiv URL中提取arXiv ID
    参数：url (str) - arXiv的URL
    返回：str 或 None - 如果找到arXiv ID则返回ID，否则返回None
    """
    # arXiv URL中ID的正则表达式模式
    # 匹配 /pdf/ 或 /abs/ 后的ID部分，可选版本号
    pattern = r"(?:arxiv\.org)/(?:pdf|abs)/([0-9]{4}\.[0-9]{4,5}|[0-9]{2}[0-9]{2}\.[0-9]{5})(?:v\d+)?"

    # 在URL中搜索匹配
    match = re.search(pattern, url)

    if match:
        # 返回捕获的arXiv ID部分（不包含版本号）
        return match.group(1)
    return None


pdf_dir = "./rag_temp_pdf"
doc_dir = "./rag_temp_doc"

# 创建保存PDF和文档的文件夹（如果不存在）
os.makedirs(pdf_dir, exist_ok=True)
os.makedirs(doc_dir, exist_ok=True)


def download_pdf(arxiv_id, pdf_dir):
    # 构建arxiv PDF下载URL

    pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"

    # 设置本地文件路径
    pdf_path = os.path.join(pdf_dir, f"{arxiv_id}.pdf")

    # 下载PDF文件
    response = requests.get(pdf_url)
    if response.status_code == 200:
        with open(pdf_path, "wb") as file:
            file.write(response.content)
        print(f"PDF 下载成功: {pdf_path}")
    else:
        print(f"无法下载PDF: {pdf_url}")
        return None
    return pdf_path


def convert_pdf_to_text(pdf_path):
    # 使用PyPDF2读取PDF文件并提取文本
    reader = PdfReader(pdf_path)
    text = ""

    for page in reader.pages:
        text += page.extract_text()

    return text


def save_text_to_file(text, arxiv_id, doc_dir):
    # 将文本保存到指定目录
    text_path = os.path.join(doc_dir, f"{arxiv_id}.txt")
    with open(text_path, "w", encoding="utf-8") as file:
        file.write(text)
    print(f"文本文件保存成功: {text_path}")


def rag_proces(arxiv_id, pdf_dir, doc_dir):
    # 构造PDF和TXT文件的路径
    pdf_path = os.path.join(pdf_dir, f"{arxiv_id}.pdf")
    txt_path = os.path.join(doc_dir, f"{arxiv_id}.txt")

    # 检查PDF文件是否存在，如果不存在则下载
    if not os.path.exists(pdf_path):
        pdf_path = download_pdf(arxiv_id, pdf_dir)
        if not pdf_path:
            print(f"Failed to download PDF for {arxiv_id}. Skipping...")
    else:
        print(f"PDF for {arxiv_id} already exists, skipping download.")

    # 如果PDF下载成功且TXT文件不存在，进行转换
    if pdf_path and not os.path.exists(txt_path):
        text = convert_pdf_to_text(pdf_path)

        # 保存文本到文件
        save_text_to_file(text, arxiv_id, doc_dir)
        print(f"Text file for {arxiv_id} saved.")
    elif os.path.exists(txt_path):
        print(f"Text file for {arxiv_id} already exists, skipping conversion.")


def get_arxiv(aid_url):
    # 示例arxiv_id
    # 使用示例
    aid = extract_arxiv_id(aid_url)
    rag_proces(aid, pdf_dir, doc_dir)
    return f"{doc_dir}/{aid}.txt"

import asyncio
import logging
import os
import re
from pathlib import Path
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.request import urlretrieve

from pypdf import PdfReader
import requests

pdf_dir = "./rag_temp_pdf"
doc_dir = "./rag_temp_doc"

# www.sci-hub.st www.sci-hub.se www.sci-hub.ru
SCI_HUB_BASE_URL = [
    "https://sci-hub.st/",
    "https://sci-hub.se/",
    "https://sci-hub.ru/",
    "https://www.tesble.com/",
]

# Logging configuration
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


def download_pdf(url: str, file_path: str) -> bool:
    """Downloads a PDF from a given URL to a specified file path.

    Returns:
        bool: True if the download was successful, False otherwise.
    """
    try:
        logging.info(f"开始下载: {url} -> {file_path}")
        urlretrieve(url, file_path)
        logging.info(f"成功下载: {url}")
        return True
    except (URLError, HTTPError) as e:
        logging.error(f"下载时出错: {url}. 错误: {e}")
        return False
    except Exception as e:
        logging.error(f"发生意外错误下载：{url}. 错误：{e}")
        return False

def convert_pdf_to_text(pdf_path):
    # 使用PyPDF2读取PDF文件并提取文本
    reader = PdfReader(pdf_path)
    text = ""

    for page in reader.pages:
        text += page.extract_text()

    return text

def save_text_to_file(text, doi, doc_dir):
    # 将文本保存到指定目录
    text_path = os.path.join(doc_dir, f"{doi}.txt")
    with open(text_path, "w", encoding="utf-8") as file:
        file.write(text)
    print(f"文本文件保存成功: {text_path}")


def scihub_scraper(scihub_url: str, url: str, file_path: str) -> Optional[bool]:
    """Downloads a PDF from Sci-Hub.

    Returns:
        Optional[bool]: True if the download was successful, False if not found, None in case of error
    """
    logging.info(f"开始下载 scihub: {url}")
    try:
        response = requests.get(url)
        response.raise_for_status()
        html_content = response.text

        pattern = re.compile(
            r'<embed[^>]*type="application\/pdf"[^>]*src="([^"]+)"[^>]*>',
            re.IGNORECASE,
        )
        match = pattern.search(html_content)

        if match:
            pdf_url = match.group(1)
            # 检测开头是否有 //
            if pdf_url.startswith("//"):
                pdf_url = "https://" + pdf_url.split("//")[1]
            else:
                pdf_url = scihub_url + pdf_url

            logging.info(f"PDF URL: {pdf_url}")
            return download_pdf(pdf_url, file_path)
        else:
            logging.warning("未找到匹配的 <embed> 标签")
            return None
    except requests.exceptions.RequestException as e:
        logging.error(f"请求网页时出错：{e}")
        return None
    except Exception as e:
        logging.error(f"发生意外错误： {e}")
        return None


def get_scihub_url():
    url = f"https://www.sci-hub.pub"
    try:
        response = requests.get(url)
        response.raise_for_status()
        html_content = response.text
        pattern = re.compile(r'<a[^>]*href="([^"]+)"[^>]*>', re.IGNORECASE)
        matches = pattern.findall(html_content)
        matches = [match for match in matches if "sci-hub" in match]
        matches.append("https://www.tesble.com/")
        return matches
    except Exception as e:
        logging.error(f"发生意外错误： {e}")
        return None


def get_scihub(doi: str):
    """Main function to run the PDF download process.

    Args:
        doi: The DOI of the paper to download.
        abstract: Whether to extract the abstract.
    """

    # 查询 https://www.sci-hub.pub 获得 sci-hub 网址
    Path(pdf_dir).mkdir(parents=True, exist_ok=True)
    doiPath = doi.replace("/", "%2F")
    file_path = os.path.abspath(f"{pdf_dir}/{doiPath}.pdf")
    if os.path.exists(file_path):  
        if not os.path.exists(f"{doc_dir}/{doiPath}.txt"): 
            text = convert_pdf_to_text(file_path)
            save_text_to_file(text, doiPath, doc_dir)
            logging.info("文件已存在")
        return f"{doc_dir}/{doiPath}.txt"

    url = get_scihub_url()
    if not url:
        logging.error("获取 sci-hub 网址失败")
        return
    else:
        SCI_HUB_BASE_URL = url

    # 获取的scihub网址
    logging.info(f"获取的scihub网址: {SCI_HUB_BASE_URL}")

    for scihub_url in SCI_HUB_BASE_URL:
        url = f"{scihub_url}{doi}"
        scihub_success = scihub_scraper(scihub_url, url, file_path)
        if scihub_success:
            text = convert_pdf_to_text(file_path)
            save_text_to_file(text, doiPath, doc_dir)
            break

    return f"{doc_dir}/{doiPath}.txt"
    # if not scihub_success:
    #     logging.error("下载失败")
    #     return
    # logging.info("下载成功")


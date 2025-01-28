import json
import re
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Document
from llama_index.vector_stores.milvus import MilvusVectorStore
from IPython.display import Markdown, display

from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.vector_stores.elasticsearch import ElasticsearchStore
from llama_index.core import StorageContext
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Settings
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.ollama import Ollama
from pymilvus import MilvusClient
from pymilvus import model
import ollama
from glob import glob
from tqdm import tqdm


def remove_think_tags(text):
    # 去掉 <think> 标签和它内部的内容
    cleaned_text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    # 去掉剩余部分的 \n\n
    cleaned_text = re.sub(r"\n{2,}", "\n", cleaned_text)
    return cleaned_text.strip()


def paragraph_to_json_ollama(query, paragraph):
    # 使用 ollama API 进行段落分解
    response = ollama.chat(
        model="deepseek-r1:8b",
        messages=[
            {
                "role": "system",
                "content": f"""
                    You are an AI Asssitant of scihub. Please answer the query of user with all the paper in the search list [s].
                    You should answer no more than 300 token.
                    don't use any format including [markdown] [md], just text.
                """,
            },
            {
                "role": "user",
                "content": f"The query is {query}, the search result [s] is: {paragraph}",
            },
        ],
    )

    # 从响应中提取模型返回的文本
    model_response = response["message"]["content"]

    # 返回结果为JSON格式
    return remove_think_tags(str(model_response))


def emb_text(text):
    response = ollama.embeddings(model="nomic-embed-text", prompt=text)
    return response["embedding"]


def parse_nested_data(data):
    result = ""
    for group in data:
        for item in group:
            entity_text: str = item.get("entity", {}).get("text", "")
            lines = entity_text.splitlines("\\n")  # 按行分割
            for line in lines:
                result = result + line.replace("\\n", "") + ","

    result = result.replace("\\n", "")
    res = json.loads(f"[{result[:-1]}]")
    return res


def parse_nested_str(data):
    result = ""
    for group in data:
        for item in group:
            entity_text: str = item.get("entity", {}).get("text", "")
            lines = entity_text
            result = lines

    return result


def search_scihub(str, max=3):
    client = MilvusClient("http://localhost:19530")
    collection_name = "scihub_rag"
    search_res1 = client.search(
        collection_name=collection_name,
        data=[
            emb_text(str)
        ],  # Use the `emb_text` function to convert the question to an embedding vector
        limit=max,  # Return top 3 results
        search_params={"metric_type": "COSINE", "params": {}},  # Inner product distance
        output_fields=["text"],  # Return the text field
    )

    res1 = parse_nested_str(search_res1)

    if client.has_collection(collection_name="temp"):
        client.drop_collection(collection_name="temp")
    client.create_collection(
        collection_name="temp",
        dimension=768,  # The vectors we will use in this demo has 768 dimensions
        metric_type="COSINE",  # Inner product distance
        consistency_level="Strong",  # Strong consistency level
    )

    i = 0
    text_lines = []
    text_lines += res1.splitlines()
    for line in text_lines:
        data = {
            "id": i,
            "vector": emb_text(line),
            "text": line,
        }
        client.insert(collection_name="temp", data=data)

        i = i + 1

    search_res2 = client.search(
        collection_name="temp",
        data=[
            emb_text(str)
        ],  # Use the `emb_text` function to convert the question to an embedding vector
        limit=max,  # Return top 3 results
        search_params={"metric_type": "COSINE", "params": {}},  # Inner product distance
        output_fields=["text"],  # Return the text field
    )

    res2 = parse_nested_data(search_res2)
    return res2

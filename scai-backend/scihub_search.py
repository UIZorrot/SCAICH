import json
import re
from typing import Dict, List, Tuple
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, Document
from llama_index.vector_stores.milvus import MilvusVectorStore
from IPython.display import Markdown, display
from rapidfuzz import process, fuzz

from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.vector_stores.elasticsearch import ElasticsearchStore
from llama_index.core import StorageContext
from llama_index.core import Settings
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.llms.ollama import Ollama
from pymilvus import MilvusClient
from pymilvus import model
import ollama
from openai import OpenAI


def remove_think_tags(text):
    try:
        # 去掉 <think> 标签和它内部的内容
        cleaned_text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
        # 去掉剩余部分的 \n\n
        cleaned_text = re.sub(r"\n{2,}", "\n", cleaned_text)
        return cleaned_text.strip()
    except:
        return "Not Available"


def get_think_tags(text):
    # 提取 <think></think> 标签中的内容，去掉标签
    think_content = re.findall(r"<think>(.*?)</think>", text, flags=re.DOTALL)
    if think_content:
        if think_content[0] != "":
            return think_content[0].strip()  # 返回第一个匹配的内容
        else:
            return "Not Available"
    else:
        return "Not Available"  # 如果没有找到 <think></think> 标签，返回空字符串


def remove_comma_and_before(text: str) -> str:
    # 使用正则表达式删除逗号及其前面的内容
    result = re.sub(r".*,", "", text)
    return result


def trans_ollama(query):

    client_openai = OpenAI(
        api_key="sk-ztne3oVE8Nc5Z7fH29PvnJ0MUMwpmaGAlLqadX1NbiUWwD1r",
        base_url="https://api.chatanywhere.tech/v1",
    )

    response = client_openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": f"""
                    You are an program, first translate the [query] into english, output [trans]:
                    - If the original sentence is non-english, translate [query] to english.
                    - If the original sentence is english, don't tranlate. 
                    - Rewrite the sentence into a declarative sentence and remove the redundant words.
                    - example: "Find some papers on the magnetic dipole model for defect detection" -> "magnetic dipole model for defect detection"
                    - You should output the [trans] with nothing else.
                    - output format [trans]: xxx
                """,
            },
            {
                "role": "user",
                "content": f"[query]: {query}",
            },
        ],
    )

    # 从响应中提取模型返回的文本
    model_response = response.choices[0].message.content

    # 返回结果为JSON格式
    return str(model_response).replace("[trans]: ", "").replace(",","")

def keyword_ollama(query):

    client_openai = OpenAI(
        api_key="sk-ztne3oVE8Nc5Z7fH29PvnJ0MUMwpmaGAlLqadX1NbiUWwD1r",
        base_url="https://api.chatanywhere.tech/v1",
    )

    response = client_openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": f"""

                You are a program designed to analyze a [query]. Your task is to identify and extract the keywords, then output them as [keywords]:  
                
                -Include only 1 additional keywords to specify the domain based on the query.
                -Rank the keywords based on their importance, prioritizing terms that are more specific or unique to the query domain or context.    
                -Ensure no duplicate words are included in the output.  
                -Extract No more than 4 keyword
                -Output only the final keywords in the format [keywords]: xxx, with no additional text or explanation.

                """,
            },
            {
                "role": "user",
                "content": f"[query]: {query}",
            },
        ],
    )

    # 从响应中提取模型返回的文本
    model_response = response.choices[0].message.content

    # 返回结果为JSON格式
    return str(model_response).replace("[keywords]: ", "").replace(",","")


# deepseek-r1:1.5b-qwen-distill-fp16
def paragraph_to_json_dp(query, p, limit):
    # client = OpenAI(
    #     api_key="sk-e0872588ba254506a35bf4ab76667f9f",
    #     base_url="https://api.deepseek.com",
    # )

    client = OpenAI(
        api_key="sk-ztne3oVE8Nc5Z7fH29PvnJ0MUMwpmaGAlLqadX1NbiUWwD1r",
        base_url="https://api.chatanywhere.tech/v1",
    )

    word = 300
    para = "2-3"

    response = client.chat.completions.create(
        # model="deepseek-chat",
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": f"""
                You are a search engine and answer bot, you have acquired [data] according to [query].
                    - The user provided you [query]: {query}
                    - Here are is [data] in JSON format: {p}
                    - Your answer should always be formal, simple, professional.
                    - You should answer in at most {para} paragraph, at most {word} words in Markdown format.
                    - Use information and url from [data] and includes inline [citations] formatted as numbered URL links (e.g., [1], [2]) and strictly increase by index. 
                    - listed the citation at the end.
                """,
            }
        ],
        stream=False,
    )
    # 从响应中提取模型返回的文本
    model_response = response.choices[0].message.content

    res = {
        "sum": str(model_response),
        "cot": "",
    }

    return res


def paragraph_to_json_ollama(query, paragraph):
    print("into")
    response = ollama.chat(
        model="deepseek-r1:8b",
        options={"num_ctx": 2048},
        messages=[
            {
                "role": "system",
                "content": f"""
                    You are an advanced AI assistant specialized in academic research, tutoring, and educational guidance. Your primary goal is to provide accurate, well-reasoned, and comprehensive assistance to students, educators, and researchers across various academic disciplines. 
                    - The user provided you a [query]: {query}, it can either be a word, a sentence, a question.
                    - If it is a work or sentence, try to explain the concept in detail
                    - If it is a question, try to help the user to solve it.
                    - If it is a chat or non-acadamic query, refuse to answer it in good manner.
                    - Your answer should always be formal, simple, professional.
                    - You should answer in at most 1 paragraph, at most 200 words.
                """,
            }
        ],
    )

    # 从响应中提取模型返回的文本
    model_response = response["message"]["content"]

    res = {
        "sum": remove_think_tags(str(model_response)).replace("<think>", ""),
        "cot": "",
    }
    # res = {
    #     "sum": remove_think_tags(str(model_response)).replace("<think>", ""),
    #     "cot": get_think_tags(str(model_response)),
    # }

    # 返回结果为JSON格式
    return res


def emb_text(text):
    response = ollama.embeddings(model="nomic-embed-text", prompt=text)
    return response["embedding"]


def emb_text_384(text):
    response = ollama.embeddings(model="snowflake-arctic-embed:33m", prompt=text)
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
            result = result + "\n" + lines

    return result


def extract_doi_and_title(
    matches: List[Tuple[str, float, int]]
) -> List[Dict[str, str]]:
    """
    从 rapidfuzz 返回的匹配结果中提取出 DOI 和 Title 字段，返回一个包含这些信息的字典列表。

    :param matches: List[Tuple[str, float, int]] - rapidfuzz 返回的匹配结果
    :return: List[Dict[str, str]] - 包含 DOI 和 Title 的字典列表
    """
    extracted_data = []
    for match in matches:
        # 解析 JSON 字符串
        match_json = json.loads(match[0])
        # 提取 DOI 和 title
        extracted_data.append({"doi": match_json["doi"], "title": match_json["title"]})

    return extracted_data


def search_scihub(client, collection_name, str, max):

    search_res1 = client.search(
        collection_name=collection_name,
        data=[
            emb_text(str)
        ],  # Use the `emb_text` function to convert the question to an embedding vector
        limit=max,  # Return top 10 results
        search_params={"metric_type": "COSINE", "params": {}},
        output_fields=["text"],  # Return the text field
    )

    res1 = parse_nested_str(search_res1)

    # if client.has_collection(collection_name="temp"):
    #     client.drop_collection(collection_name="temp")
    # client.create_collection(
    #     collection_name="temp",
    #     dimension=384,  # The vectors we will use in this demo has 768 dimensions
    #     metric_type="COSINE",  # Inner product distance
    # )

    i = 0
    text_lines = []
    text_lines += res1.splitlines()

    # for line in text_lines:
    #     if line != "":
    #         data = {
    #             "id": i,
    #             "vector": emb_text_384(line),
    #             "text": line,
    #         }
    #         client.insert(collection_name="temp", data=data)
    #         i = i + 1

    # search_res2 = client.search(
    #     collection_name="temp",
    #     data=[
    #         emb_text_384(str)
    #     ],  # Use the `emb_text` function to convert the question to an embedding vector
    #     limit=max,  # Return top 3 results
    #     search_params={"metric_type": "COSINE", "params": {}},  # Inner product distance
    #     output_fields=["text"],  # Return the text field
    # )

    # res2 = parse_nested_data(search_res2)

    res2 = extract_doi_and_title(
        process.extract(str, text_lines, limit=max, scorer=fuzz.partial_token_set_ratio)
    )

    return res2

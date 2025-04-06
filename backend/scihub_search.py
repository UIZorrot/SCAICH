import os
from dotenv import load_dotenv
import json
import re
from typing import Dict, List, Tuple
from rapidfuzz import process, fuzz
import ollama
from openai import OpenAI

# 加载 .env 文件
load_dotenv()


def remove_think_tags(text):
    try:
        cleaned_text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
        cleaned_text = re.sub(r"\n{2,}", "\n", cleaned_text)
        return cleaned_text.strip()
    except:
        return "Not Available"


def get_think_tags(text):
    think_content = re.findall(r"<think>(.*?)</think>", text, flags=re.DOTALL)
    if think_content:
        if think_content[0] != "":
            return think_content[0].strip()
        else:
            return "Not Available"
    else:
        return "Not Available"


def remove_comma_and_before(text: str) -> str:
    result = re.sub(r".*,", "", text)
    return result


def trans_ollama(query):
    client_openai = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL"),
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

    model_response = response.choices[0].message.content
    return str(model_response).replace("[trans]: ", "").replace(",", "")


def keyword_ollama(query):
    client_openai = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL"),
    )

    response = client_openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": f"""
                    You are an program, choose the most important keywords in [query], finally output [keywords]: 
                    - Rerank the keywords by its value, the more domain special a word is, the more value it have.
                    - Don't output duplicate word.
                    - You should output the finally keywords [keywords] with nothing else.
                    - output format [keywords]: xxx
                """,
            },
            {
                "role": "user",
                "content": f"[query]: {query}",
            },
        ],
    )

    model_response = response.choices[0].message.content
    return str(model_response).replace("[keywords]: ", "").replace(",", "")


def paragraph_to_json_dp(query, p, limit):
    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL"),
    )

    if limit > 15:
        word = 300
        para = "2-3"
    else:
        word = 200
        para = 1

    response = client.chat.completions.create(
        model="gpt-4o-mini",
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
                    - You should answer in at most {para} paragraph, at most {word} words.
                    - Try to give url of the paper, the url MUST exsit in the [data].
                    - Here are some background knowledge [data] from internet search result in JSON format, if you find it useful, summarize and use it:  {p}
                """,
            }
        ],
        stream=False,
    )

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
                    - Here are some background knowledge from internet search result in JSON format, if you find it useful, summarize them, and added into the content:  {paragraph}
                """,
            }
        ],
    )

    model_response = response["message"]["content"]
    res = {
        "sum": remove_think_tags(str(model_response)).replace("<think>", ""),
        "cot": "",
    }
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
            lines = entity_text.splitlines("\\n")
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
    matches: List[Tuple[str, float, int]],
) -> List[Dict[str, str]]:
    extracted_data = []
    for match in matches:
        match_json = json.loads(match[0])
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

    if client.has_collection(collection_name="temp"):
        client.drop_collection(collection_name="temp")
    client.create_collection(
        collection_name="temp",
        dimension=384,  # The vectors we will use in this demo has 768 dimensions
        metric_type="COSINE",  # Inner product distance
    )

    i = 0
    text_lines = []
    text_lines += res1.splitlines()

    for line in text_lines:
        if line != "":
            data = {
                "id": i,
                "vector": emb_text_384(line),
                "text": line,
            }
            client.insert(collection_name="temp", data=data)
            i = i + 1

    search_res2 = client.search(
        collection_name="temp",
        data=[
            emb_text_384(str)
        ],  # Use the `emb_text` function to convert the question to an embedding vector
        limit=max,  # Return top 3 results
        search_params={"metric_type": "COSINE", "params": {}},  # Inner product distance
        output_fields=["text"],  # Return the text field
    )

    res2 = parse_nested_data(search_res2)

    res2 = extract_doi_and_title(
        process.extract(str, text_lines, limit=max, scorer=fuzz.partial_token_set_ratio)
    )

    return res2

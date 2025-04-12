import os
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    Settings,
    StorageContext,
    load_index_from_storage,
    get_response_synthesizer,
    chat_engine,
)
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.readers.file import PDFReader
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core import PromptTemplate
from llama_index.llms.openai import OpenAI

from fetch_arxiv_pdf import get_arxiv
from fetch_scihub import get_scihub

llm = OpenAI(
    model="gpt-4o-mini",
    api_key="",
    api_base="",
)


# 使用创建的索引执行查询
def query_rag(
    query: str, prompt: str, doc_dir: str, index_dir: str, temp_or_presist: str
):
    # load pdf

    # TODO 需要考虑什么样的模型/Embedding模型更好
    # emb
    Settings.embed_model = OllamaEmbedding(model_name="nomic-embed-text")

    # llm
    Settings.llm = Ollama(model="gemma2:2b", request_timeout=360)

    # IN THE TEST, THE DATA SHALL NOT BE PERSIST
    if temp_or_presist == "TEMP":
        documents = SimpleDirectoryReader(doc_dir).load_data()
        index = VectorStoreIndex.from_documents(documents)
        index.storage_context.persist(persist_dir=index_dir)

    else:
        print("from default?")
        storage_context = StorageContext.from_defaults(persist_dir=index_dir)
        print("load index?")
        index = load_index_from_storage(storage_context)

    # retriever = VectorIndexRetriever(
    #     index=index,
    #     similarity_top_k=2,
    # )

    # # configure response synthesizer
    # response_synthesizer = get_response_synthesizer()

    # query_engine = RetrieverQueryEngine(
    #     retriever=retriever,
    #     response_synthesizer=response_synthesizer,
    # )
    query_engine = index.as_query_engine(response_mode="tree_summarize")
    new_summary_tmpl_str = (
        "Context information is below.\n"
        "---------------------\n"
        "{context_str}\n"
        "---------------------\n"
        f"{prompt}"
        "Query: {query_str}\n"
        "Answer: "
    )
    new_summary_tmpl = PromptTemplate(new_summary_tmpl_str)
    query_engine.update_prompts(
        {"response_synthesizer:summary_template": new_summary_tmpl}
    )

    try:
        response = query_engine.query(query)
        return str(response)  # 返回查询结果
    except Exception as e:
        return f"Error during query: {str(e)}"


def chat_rag_init(prompt: str, doc: str):
    documents = SimpleDirectoryReader(input_files=[doc]).load_data()
    # TODO 需要考虑什么样的模型/Embedding模型更好
    # # emb
    # Settings.embed_model = OllamaEmbedding(model_name="nomic-embed-text")

    # # llm
    # Settings.llm = Ollama(model="deepseek-r1:8b", request_timeout=360)

    Settings.llm = llm
    Settings.embed_model = OllamaEmbedding(model_name="bge-m3")

    # IN THE TEST, THE DATA SHALL NOT BE PERSIST
    index = VectorStoreIndex.from_documents(documents)

    # # configure retriever
    # retriever = VectorIndexRetriever(
    #     index=index,
    #     similarity_top_k=2,
    # )

    # # configure response synthesizer
    # response_synthesizer = get_response_synthesizer()

    memory = ChatMemoryBuffer.from_defaults(token_limit=40000)

    chat_engine = index.as_chat_engine(
        chat_mode="context",
        memory=memory,
        system_prompt=(prompt),
    )

    return chat_engine


def chat_rag(chat_engine: chat_engine.ContextChatEngine, query: str):
    try:
        response = chat_engine.chat(query)
        return str(response)  # 返回查询结果
    except Exception as e:
        return f"Error during query: {str(e)}"


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

# get_arxiv("scai_rag/test/test.json")
# get_scihub("10.1038/s41598-021-95939-y")

# paper = get_arxiv("2408.00243")

# print(
#     chat_rag(
#         chat_rag_init(p, paper),
#         f"Please tell me about the structure in the paper [A Survey on the Applications of Zero-Knowledge Proofs]",
#     )
# )

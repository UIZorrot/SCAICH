from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    Settings,
    StorageContext,
    load_index_from_storage,
    chat_engine,
)
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding
from llama_index.core import PromptTemplate
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding

llm = OpenAI(
    model="gpt-4o-mini",
    api_key="sk-ztne3oVE8Nc5Z7fH29PvnJ0MUMwpmaGAlLqadX1NbiUWwD1r",
    api_base="https://api.chatanywhere.tech/v1",
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

    # Settings.embed_model = OllamaEmbedding(model_name="nomic-embed-text")
    Settings.embed_model = OpenAIEmbedding(
        api_key="sk-ztne3oVE8Nc5Z7fH29PvnJ0MUMwpmaGAlLqadX1NbiUWwD1r",
        api_base="https://api.chatanywhere.tech/v1",
    )

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


def chat_init(prompt: str):
    documents = SimpleDirectoryReader(input_files=["nothing.txt"]).load_data()
    # TODO 需要考虑什么样的模型/Embedding模型更好
    # # emb
    # Settings.embed_model = OllamaEmbedding(model_name="nomic-embed-text")

    # # llm
    # Settings.llm = Ollama(model="deepseek-r1:8b", request_timeout=360)

    Settings.llm = llm
    # Settings.embed_model = OllamaEmbedding(model_name="nomic-embed-text")
    Settings.embed_model = OpenAIEmbedding(
        api_key="sk-ztne3oVE8Nc5Z7fH29PvnJ0MUMwpmaGAlLqadX1NbiUWwD1r",
        api_base="https://api.chatanywhere.tech/v1",
    )

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




# get_arxiv("scai_rag/test/test.json")
# get_scihub("10.1038/s41598-021-95939-y")

# paper = get_arxiv("2408.00243")

# print(
#     chat_rag(
#         chat_rag_init(p, paper),
#         f"Please tell me about the structure in the paper [A Survey on the Applications of Zero-Knowledge Proofs]",
#     )
# )

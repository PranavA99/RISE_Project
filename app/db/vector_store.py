from langchain_community.vectorstores import FAISS
from app.services.embedder import load_embeddings


def create_vector_store(text, source_url):

    from langchain.text_splitter import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=250,
        chunk_overlap=50
    )

    chunks = splitter.split_text(text)

    embeddings = load_embeddings()

    metadatas = [{"source": source_url} for _ in chunks]

    vector_store = FAISS.from_texts(
        texts=chunks,
        embedding=embeddings,
        metadatas=metadatas
    )

    vector_store.save_local("faiss_index")

    return vector_store


def load_vector_store():

    embeddings = load_embeddings()

    return FAISS.load_local(
        "faiss_index",
        embeddings,
        allow_dangerous_deserialization=True
    )
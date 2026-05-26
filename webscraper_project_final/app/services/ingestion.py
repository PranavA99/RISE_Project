import os
import re
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings

CHROMA_DIR = "chroma_db"
KNOWLEDGE_BASE = "KnowledgeBase.md"
COLLECTION_NAME = "knowledge"


def get_embeddings():
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


def get_vectorstore():
    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=get_embeddings(),
        persist_directory=CHROMA_DIR,
    )


def ingest_markdown(filepath: str = KNOWLEDGE_BASE) -> str:
    if not os.path.exists(filepath):
        return f"Error: {filepath} not found."

    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()

    if not text.strip():
        return "Error: KnowledgeBase.md is empty."

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
    )
    chunks = splitter.split_text(text)

    if not chunks:
        return "No content to ingest."

    embeddings = get_embeddings()
    vectorstore = Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR,
    )
    #vectorstore.add_texts(chunks)
    BATCH_SIZE = 500
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i : i + BATCH_SIZE]
        vectorstore.add_texts(batch)

    return f"Ingested {len(chunks)} chunks into vector store."


def summarize_knowledge_base() -> str:
    """Use Claude to summarize the scraped content."""
    if not os.path.exists(KNOWLEDGE_BASE):
        return "No knowledge base found."

    with open(KNOWLEDGE_BASE, "r", encoding="utf-8") as f:
        text = f.read()

    if not text.strip():
        return "Knowledge base is empty."

    # Trim to avoid token limits
    trimmed = text[:12000]

    llm = ChatGroq(model="llama-3.3-70b-versatile", max_tokens=1000)
    response = llm.invoke(
        f"Summarize the following scraped website content concisely in 3-5 bullet points:\n\n{trimmed}"
    )
    return response.content


async def generate_faqs() -> list[dict]:
    """Generate FAQ pairs from the knowledge base."""
    if not os.path.exists(KNOWLEDGE_BASE):
        return []

    with open(KNOWLEDGE_BASE, "r", encoding="utf-8") as f:
        text = f.read()

    trimmed = text[:10000]

    llm = ChatGroq(model="llama-3.3-70b-versatile", max_tokens=1500)
    prompt = (
        "Based on the following scraped website content, generate 6 frequently asked questions "
        "and their answers. Return ONLY valid JSON as a list of objects with 'question' and 'answer' keys.\n\n"
        f"{trimmed}"
    )
    response = llm.invoke(prompt)

    raw = response.content
    # Strip markdown fences if present
    raw = re.sub(r"```json|```", "", raw).strip()

    try:
        import json
        faqs = json.loads(raw)
        return faqs if isinstance(faqs, list) else []
    except Exception:
        return []


def export_summary_markdown() -> str:
    """Return summary as markdown string."""
    summary = summarize_knowledge_base()
    faqs = generate_faqs()

    md = f"# Knowledge Base Summary\n\n{summary}\n\n---\n\n## FAQs\n\n"
    for faq in faqs:
        md += f"**Q: {faq.get('question', '')}**\n\n{faq.get('answer', '')}\n\n"
    return md


def get_knowledge_base_text() -> str:
    if not os.path.exists(KNOWLEDGE_BASE):
        return ""
    with open(KNOWLEDGE_BASE, "r", encoding="utf-8") as f:
        return f.read()

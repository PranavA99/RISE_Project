import hashlib
from typing import List

from openai import AsyncOpenAI

from app.config import settings
from app.db.vector_store import add_chunks

_openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


# ---------------------------------------------------------------------------
# Text chunking
# ---------------------------------------------------------------------------

def chunk_text(text: str, chunk_size: int | None = None, overlap: int | None = None) -> List[str]:
    """
    Split `text` into overlapping chunks of roughly `chunk_size` characters.

    Simple character-based sliding window — good enough for most web content.
    For very large corpora consider using LangChain's RecursiveCharacterTextSplitter.
    """
    size    = chunk_size or settings.CHUNK_SIZE
    overlap = overlap    or settings.CHUNK_OVERLAP

    if len(text) <= size:
        return [text]

    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = start + size
        chunk = text[start:end]
        # Try to break at a sentence boundary instead of mid-word
        if end < len(text):
            last_period = chunk.rfind(". ")
            if last_period != -1 and last_period > size // 2:
                end = start + last_period + 1
                chunk = text[start:end]
        chunks.append(chunk.strip())
        start = end - overlap   # slide back by overlap for context continuity

    return [c for c in chunks if c]  # drop empty strings


# ---------------------------------------------------------------------------
# Embedding
# ---------------------------------------------------------------------------

async def get_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Call the OpenAI embeddings API and return a list of embedding vectors.
    Batches all texts in a single API call (OpenAI supports up to 2048 inputs).
    """
    response = await _openai_client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=texts,
    )
    # response.data is ordered the same as input texts
    return [item.embedding for item in response.data]


# ---------------------------------------------------------------------------
# Public function called by the scrape route
# ---------------------------------------------------------------------------

async def embed_and_store(url: str, title: str, text: str) -> int:
    """
    Chunk `text`, generate embeddings for each chunk, and upsert into ChromaDB.

    Args:
        url:   Source URL (stored as metadata for citation).
        title: Page title (stored as metadata).
        text:  Cleaned page text.

    Returns:
        Number of chunks stored.
    """
    if not text.strip():
        return 0

    chunks = chunk_text(text)
    if not chunks:
        return 0

    # Generate a stable, deterministic ID for each chunk so re-scraping the
    # same URL replaces old chunks (upsert) rather than duplicating them.
    ids = [
        hashlib.md5(f"{url}::{i}::{chunk[:50]}".encode()).hexdigest()
        for i, chunk in enumerate(chunks)
    ]

    metadatas = [
        {"url": url, "title": title, "chunk_index": i}
        for i in range(len(chunks))
    ]

    embeddings = await get_embeddings(chunks)

    add_chunks(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )

    return len(chunks)


async def embed_query(question: str) -> List[float]:
    """
    Embed a single query string for similarity search.
    Kept separate from embed_and_store to make the chatbot service cleaner.
    """
    vectors = await get_embeddings([question])
    return vectors[0]

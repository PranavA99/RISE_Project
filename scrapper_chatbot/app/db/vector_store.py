import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import Optional

from app.config import settings

# Module-level client and collection — initialised once on startup
_client: Optional[chromadb.PersistentClient] = None
_collection = None


def init_vector_store() -> None:
    """
    Called once at app startup (from main.py lifespan).
    Creates the ChromaDB persistent client and collection.
    """
    global _client, _collection

    _client = chromadb.PersistentClient(
        path=settings.CHROMA_PERSIST_DIR,
        settings=ChromaSettings(anonymized_telemetry=False),
    )

    # get_or_create so restarting the server doesn't wipe existing data
    _collection = _client.get_or_create_collection(
        name=settings.CHROMA_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},   # cosine similarity for semantic search
    )
    print(f"ChromaDB ready — collection '{settings.CHROMA_COLLECTION_NAME}' "
          f"has {_collection.count()} existing chunks.")


def get_collection():
    """Return the active ChromaDB collection. Raises if not initialised."""
    if _collection is None:
        raise RuntimeError("Vector store not initialised. Was init_vector_store() called?")
    return _collection


def get_vector_store_status() -> str:
    """Return 'connected' or 'unavailable' — used by the health route."""
    try:
        col = get_collection()
        col.count()   # lightweight ping
        return "connected"
    except Exception:
        return "unavailable"


def add_chunks(
    ids: list[str],
    embeddings: list[list[float]],
    documents: list[str],
    metadatas: list[dict],
) -> None:
    """
    Upsert chunks into the collection.
    Using upsert means re-scraping the same URL updates existing chunks
    instead of creating duplicates.
    """
    col = get_collection()
    col.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas,
    )


def query_chunks(
    query_embedding: list[float],
    top_k: int = 4,
    where: Optional[dict] = None,
) -> dict:
    """
    Semantic search — returns the top_k most similar chunks.

    Args:
        query_embedding: The embedding vector of the user's question.
        top_k:           Number of results to return.
        where:           Optional ChromaDB metadata filter e.g. {"url": "https://..."}

    Returns:
        ChromaDB query result dict with keys: ids, documents, metadatas, distances.
    """
    col = get_collection()
    kwargs = dict(
        query_embeddings=[query_embedding],
        n_results=min(top_k, col.count() or 1),
        include=["documents", "metadatas", "distances"],
    )
    if where:
        kwargs["where"] = where
    return col.query(**kwargs)


def delete_by_url(url: str) -> int:
    """
    Delete all chunks associated with a specific URL.
    Useful for the admin dashboard / live-update feature.
    Returns the number of deleted chunks.
    """
    col = get_collection()
    results = col.get(where={"url": url}, include=["documents"])
    ids = results.get("ids", [])
    if ids:
        col.delete(ids=ids)
    return len(ids)


def list_indexed_urls() -> list[str]:
    """Return a deduplicated list of all URLs currently indexed."""
    col = get_collection()
    results = col.get(include=["metadatas"])
    urls = {meta.get("url", "") for meta in results.get("metadatas", [])}
    return sorted(u for u in urls if u)

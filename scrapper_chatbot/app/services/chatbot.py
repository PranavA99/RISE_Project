from typing import TypedDict, List

from openai import AsyncOpenAI

from app.config import settings
from app.db.vector_store import query_chunks
from app.services.embedder import embed_query

_openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

class SourceChunkData(TypedDict):
    url: str
    snippet: str


class AnswerResult(TypedDict):
    answer: str
    sources: List[SourceChunkData]


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """You are a helpful assistant that answers questions based ONLY on the
provided context excerpts scraped from websites. 

Rules:
- If the answer is clearly present in the context, answer directly and concisely.
- If the context does not contain enough information, say:
  "I couldn't find a clear answer in the scraped content. Please try scraping more pages."
- Do NOT make up information or use knowledge outside the provided context.
- When useful, mention which source URL the answer came from.
- Keep answers focused and readable.
"""


def _build_user_prompt(question: str, context_chunks: List[str], source_urls: List[str]) -> str:
    context_sections = []
    for i, (chunk, url) in enumerate(zip(context_chunks, source_urls), start=1):
        context_sections.append(f"[{i}] Source: {url}\n{chunk}")

    context_text = "\n\n---\n\n".join(context_sections)

    return f"""Context excerpts:
{context_text}

---

Question: {question}

Answer:"""


# ---------------------------------------------------------------------------
# Main RAG function called by the chat route
# ---------------------------------------------------------------------------

async def get_answer(question: str, top_k: int = 4) -> AnswerResult:
    """
    Retrieval-Augmented Generation pipeline:
    1. Embed the question
    2. Retrieve the top_k most similar chunks from ChromaDB
    3. Build a prompt with those chunks as context
    4. Call the LLM and return the answer + source citations

    Args:
        question: The user's natural language question.
        top_k:    Number of context chunks to retrieve.

    Returns:
        AnswerResult with 'answer' string and 'sources' list.
    """
    # Step 1 — embed the question
    query_vector = await embed_query(question)

    # Step 2 — retrieve similar chunks from ChromaDB
    results = query_chunks(query_embedding=query_vector, top_k=top_k)

    documents: List[str] = results.get("documents", [[]])[0]
    metadatas: List[dict] = results.get("metadatas", [[]])[0]

    if not documents:
        return AnswerResult(
            answer="No relevant content found. Please scrape some URLs first.",
            sources=[],
        )

    # Step 3 — build context for the prompt
    source_urls = [meta.get("url", "unknown") for meta in metadatas]

    prompt = _build_user_prompt(
        question=question,
        context_chunks=documents,
        source_urls=source_urls,
    )

    # Step 4 — call the LLM
    response = await _openai_client.chat.completions.create(
        model=settings.OPENAI_CHAT_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.2,    # low temp = more factual, less creative
        max_tokens=1024,
    )

    answer_text = response.choices[0].message.content.strip()

    # Step 5 — build source citations (deduplicated, preserve order)
    seen_urls: set[str] = set()
    sources: List[SourceChunkData] = []
    for chunk, url in zip(documents, source_urls):
        if url not in seen_urls:
            seen_urls.add(url)
            sources.append(SourceChunkData(
                url=url,
                snippet=chunk[:200] + ("..." if len(chunk) > 200 else ""),
            ))

    return AnswerResult(answer=answer_text, sources=sources)

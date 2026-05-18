from fastapi import APIRouter, HTTPException

from app.models.request import ChatRequest
from app.models.response import ChatResponse, SourceChunk
from app.services.chatbot import get_answer

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    """
    Ask a question against the scraped knowledge base.

    - **question**: natural language question
    - **top_k**: number of document chunks retrieved as context (default 4)

    The chatbot uses RAG (Retrieval-Augmented Generation):
    it fetches the most relevant chunks from ChromaDB and passes
    them as context to the LLM to produce a grounded answer.
    """
    try:
        result = await get_answer(
            question=payload.question,
            top_k=payload.top_k,
        )
        # result = { "answer": "...", "sources": [{ "url": ..., "snippet": ... }] }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(exc)}")

    if not result.get("answer"):
        raise HTTPException(status_code=404, detail="No answer could be generated. Try scraping more pages first.")

    sources = [
        SourceChunk(url=s["url"], snippet=s["snippet"])
        for s in result.get("sources", [])
    ]

    return ChatResponse(
        question=payload.question,
        answer=result["answer"],
        sources=sources,
    )

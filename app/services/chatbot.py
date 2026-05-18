from groq import Groq
from app.config import settings
from app.db.vector_store import load_vector_store


# Initialize Groq client
client = Groq(api_key=settings.GROQ_API_KEY)


def ask_chatbot(question: str):

    if not question or not question.strip():
        return "Invalid question"

    # Load vector database
    vector_store = load_vector_store()

    if vector_store is None:
        raise ValueError("Vector store not found. Run ingestion first.")

    # Retrieve relevant chunks
    docs = vector_store.similarity_search(question, k=3)

    if not docs:
        return "I could not find relevant information."

    # Build context safely
    context = "\n\n".join(
        doc.page_content for doc in docs if getattr(doc, "page_content", None)
    )

    # Optional: include sources (GOOD FOR FINAL YEAR PROJECT)
    sources = list(
        set(getattr(doc.metadata, "source", "") for doc in docs if getattr(doc, "metadata", None))
    )

    prompt = f"""
You are a helpful AI assistant.

Answer ONLY using the provided context.

If the answer is not found in context, say:
"I could not find that information."

Context:
{context}

Question:
{question}

Answer:
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    answer = response.choices[0].message.content

    return {
        "answer": answer,
        "sources": sources
    }
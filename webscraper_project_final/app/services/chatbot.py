from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from app.services.ingestion import get_vectorstore

SYSTEM_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""You are a helpful assistant that answers questions based on the provided website content.
Use ONLY the context below to answer. If the answer is not found in the context, say "I don't have enough information about that from the scraped content."

Context:
{context}

Question: {question}

Answer:"""
)


def ask_chatbot(query: str, language: str = "en") -> dict:
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 4},
    )

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        max_tokens=1000,
    )

    chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": SYSTEM_PROMPT},
    )

    if language and language != "en":
        query = f"(Please respond in {language}.) {query}"

    result = chain.invoke({"query": query})

    sources = list({
        doc.metadata.get("source", "")
        for doc in result.get("source_documents", [])
        if doc.metadata.get("source")
    })

    return {
        "answer": result.get("result", "No answer found."),
        "sources": sources,
    }


def get_chat_history_context(history: list[dict], query: str) -> str:
    """Format recent chat history for context."""
    lines = []
    for msg in history[-6:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        lines.append(f"{role.capitalize()}: {content}")
    lines.append(f"User: {query}")
    return "\n".join(lines)

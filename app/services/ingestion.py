from app.db.vector_store import create_vector_store
from app.utils.file_loader import load_markdown_file


def ingest_markdown(file_path: str):

    print("Starting markdown ingestion...")

    text = load_markdown_file(file_path)

    if not text.strip():
        raise ValueError("Markdown file is empty")

    create_vector_store(
        text=text,
        source_url="scrapy_markdown"
    )

    return {
        "message": "Markdown ingested successfully"
    }
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # --- App ---
    APP_ENV: str = "development"          # "development" | "production"
    DEBUG: bool = True

    # --- CORS ---
    # Comma-separated in .env: ALLOWED_ORIGINS=http://localhost:8501,http://localhost:3000
    ALLOWED_ORIGINS: List[str] = ["*"]

    # --- OpenAI ---
    OPENAI_API_KEY: str = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_CHAT_MODEL: str = "gpt-3.5-turbo"

    # --- ChromaDB ---
    CHROMA_PERSIST_DIR: str = "./chroma_db"   # folder where ChromaDB saves data
    CHROMA_COLLECTION_NAME: str = "scraped_docs"

    # --- Scraping ---
    MAX_LINKS_PER_URL: int = 10           # max internal links to follow per seed URL
    REQUEST_TIMEOUT: int = 15             # seconds before giving up on a URL
    CHUNK_SIZE: int = 500                 # characters per text chunk for embeddings
    CHUNK_OVERLAP: int = 50              # overlap between chunks

    # --- Export ---
    EXPORT_DIR: str = "./exports"         # where PDF/Markdown files are saved

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Single shared instance — import this everywhere
settings = Settings()

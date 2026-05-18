from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ---------------------------------------------------------------------------
# /scrape
# ---------------------------------------------------------------------------

class PageResult(BaseModel):
    url: str
    title: str                        = Field(default="")
    chunks_stored: int                = Field(description="Number of text chunks embedded and stored.")
    links_followed: List[str]         = Field(default_factory=list)
    error: Optional[str]              = Field(default=None)


class ScrapeResponse(BaseModel):
    status: str                       = Field(examples=["success", "partial"])
    pages_scraped: int
    total_chunks_stored: int
    results: List[PageResult]
    scraped_at: datetime              = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# /chat
# ---------------------------------------------------------------------------

class SourceChunk(BaseModel):
    url: str
    snippet: str                      = Field(description="Short excerpt used as context.")


class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: List[SourceChunk]        = Field(
        default_factory=list,
        description="The document chunks that were used to form the answer.",
    )


# ---------------------------------------------------------------------------
# /export
# ---------------------------------------------------------------------------

class ExportResponse(BaseModel):
    format: str
    file_path: str                    = Field(description="Server-side path of the exported file.")
    download_url: str                 = Field(description="URL to download the file.")
    exported_at: datetime             = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str                       = Field(examples=["ok"])
    vector_store: str                 = Field(examples=["connected", "unavailable"])
    environment: str
    version: str                      = Field(default="1.0.0")

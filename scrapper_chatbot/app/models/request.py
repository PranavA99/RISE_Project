from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional
from enum import Enum


class ExportFormat(str, Enum):
    pdf      = "pdf"
    markdown = "markdown"


# ---------------------------------------------------------------------------
# /scrape
# ---------------------------------------------------------------------------

class ScrapeRequest(BaseModel):
    urls: List[HttpUrl] = Field(
        ...,
        min_length=1,
        description="One or more URLs to scrape.",
        examples=[["https://example.com", "https://docs.example.com"]],
    )
    follow_links: bool = Field(
        default=False,
        description="If True, auto-detect and follow internal links on each page.",
    )
    max_links: Optional[int] = Field(
        default=None,
        ge=1,
        le=50,
        description="Override the default max internal links to follow per URL.",
    )


# ---------------------------------------------------------------------------
# /chat
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=3,
        description="The question to answer from the scraped knowledge base.",
        examples=["What is the refund policy?"],
    )
    top_k: int = Field(
        default=4,
        ge=1,
        le=10,
        description="Number of document chunks to retrieve for context.",
    )


# ---------------------------------------------------------------------------
# /export
# ---------------------------------------------------------------------------

class ExportRequest(BaseModel):
    format: ExportFormat = Field(
        default=ExportFormat.markdown,
        description="Output format: 'pdf' or 'markdown'.",
    )
    source_urls: Optional[List[HttpUrl]] = Field(
        default=None,
        description="Filter export to specific URLs. Leave empty to export all.",
    )

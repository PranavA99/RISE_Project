from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List

from app.models.request import ScrapeRequest
from app.models.response import ScrapeResponse, PageResult
from app.services.scraper import scrape_url
from app.services.embedder import embed_and_store
from app.utils.link_extractor import extract_internal_links
from app.config import settings

router = APIRouter()


@router.post("/", response_model=ScrapeResponse)
async def scrape_urls(payload: ScrapeRequest):
    """
    Accept one or more URLs, scrape their content, chunk the text,
    generate embeddings, and store them in ChromaDB.

    - **urls**: list of seed URLs to scrape
    - **follow_links**: if True, auto-follow internal links found on each page
    - **max_links**: cap on internal links followed per seed URL
    """
    max_links = payload.max_links or settings.MAX_LINKS_PER_URL

    all_results: List[PageResult] = []
    total_chunks = 0

    # Build the full list of URLs to process (seeds + optional internal links)
    urls_to_process: List[str] = [str(url) for url in payload.urls]

    if payload.follow_links:
        discovered: List[str] = []
        for seed_url in urls_to_process:
            links = await extract_internal_links(seed_url, max_links=max_links)
            discovered.extend(links)
        # Add discovered links (deduplicated, not already in seed list)
        existing = set(urls_to_process)
        urls_to_process += [l for l in discovered if l not in existing]

    # Scrape + embed each URL
    for url in urls_to_process:
        try:
            page_data = await scrape_url(url)          # { title, text, links }
            chunks_stored = await embed_and_store(
                url=url,
                title=page_data["title"],
                text=page_data["text"],
            )
            total_chunks += chunks_stored

            all_results.append(PageResult(
                url=url,
                title=page_data["title"],
                chunks_stored=chunks_stored,
                links_followed=page_data.get("links", []),
            ))

        except Exception as exc:
            # Don't abort the whole batch — record the error and continue
            all_results.append(PageResult(
                url=url,
                title="",
                chunks_stored=0,
                error=str(exc),
            ))

    failed = sum(1 for r in all_results if r.error)
    status = "success" if failed == 0 else ("failed" if failed == len(all_results) else "partial")

    if status == "failed":
        raise HTTPException(status_code=422, detail="All URLs failed to scrape. Check the error field in results.")

    return ScrapeResponse(
        status=status,
        pages_scraped=len(all_results),
        total_chunks_stored=total_chunks,
        results=all_results,
    )

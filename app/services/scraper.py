import httpx
from typing import TypedDict, List

from app.config import settings
from app.utils.text_cleaner import extract_text_from_html, extract_title_from_html
from app.utils.link_extractor import extract_internal_links


class PageData(TypedDict):
    url: str
    title: str
    text: str
    links: List[str]


async def scrape_url(url: str, follow_links: bool = False, max_links: int | None = None) -> PageData:
    """
    Fetch a single URL, clean its HTML, and return structured page data.

    Args:
        url:          The URL to scrape.
        follow_links: Whether to also extract internal links from the page.
        max_links:    Cap on internal links (only relevant if follow_links=True).

    Returns:
        PageData dict with url, title, cleaned text, and optionally found links.

    Raises:
        httpx.HTTPStatusError: On 4xx/5xx responses.
        httpx.TimeoutException: If the request times out.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; ScraperBot/1.0; "
            "+https://github.com/your-org/scraper-chatbot)"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }

    async with httpx.AsyncClient(
        timeout=settings.REQUEST_TIMEOUT,
        follow_redirects=True,
    ) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        html = response.text
        if not html or len(html.strip()) == 0:
            raise ValueError(f"Empty HTML received from {url}")

    title = extract_title_from_html(html)
    text = extract_text_from_html(html)

    if not text or len(text.strip()) == 0:
        print(f"Warning: No text extracted from {url}")
        text = ""

    links: List[str] = []
    if follow_links:
        links = await extract_internal_links(url, max_links=max_links)

    return {
        "url": url,
        "title": title or "",
        "text": text or "",
        "links": links or []
    }


async def scrape_multiple(
    urls: List[str],
    follow_links: bool = False,
    max_links: int | None = None,
) -> List[PageData | Exception]:
    """
    Scrape multiple URLs concurrently using asyncio.gather.

    Returns a list in the same order as `urls`.
    Each element is either a PageData dict or an Exception if that URL failed.
    """
    import asyncio

    tasks = [
        scrape_url(url, follow_links=follow_links, max_links=max_links)
        for url in urls
    ]
    # return_exceptions=True prevents one failure from cancelling the rest
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return list(results)

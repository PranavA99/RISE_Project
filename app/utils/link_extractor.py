from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import httpx
from typing import List

from app.config import settings


def _same_domain(base_url: str, link: str) -> bool:
    """Return True if `link` belongs to the same domain as `base_url`."""
    base_netloc = urlparse(base_url).netloc
    link_netloc = urlparse(link).netloc
    # link_netloc is empty for relative URLs — those are always internal
    return link_netloc == "" or link_netloc == base_netloc


def _normalise(base_url: str, href: str) -> str | None:
    """
    Convert a raw href into an absolute URL.
    Returns None for anchors, mailto, tel, javascript, etc.
    """
    href = href.strip()
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
        return None
    absolute = urljoin(base_url, href)
    # Strip fragment
    parsed = urlparse(absolute)
    return parsed._replace(fragment="").geturl()


async def extract_internal_links(url: str, max_links: int | None = None) -> List[str]:
    """
    Fetch `url` and return a list of unique internal links found on the page.

    Args:
        url:       The page to inspect.
        max_links: Cap on how many links to return. Defaults to settings value.

    Returns:
        List of absolute URLs on the same domain (excluding the seed URL itself).
    """
    cap = max_links or settings.MAX_LINKS_PER_URL

    try:
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT, follow_redirects=True) as client:
            response = await client.get(url, headers={"User-Agent": "ScraperBot/1.0"})
            response.raise_for_status()
            html = response.text
    except Exception:
        return []   # If we can't fetch the page, just return no links

    soup = BeautifulSoup(html, "html.parser")
    seen: set[str] = set()
    links: List[str] = []

    for tag in soup.find_all("a", href=True):
        normalised = _normalise(url, tag["href"])
        if normalised is None:
            continue
        if not _same_domain(url, normalised):
            continue
        if normalised == url or normalised in seen:
            continue
        seen.add(normalised)
        links.append(normalised)
        if len(links) >= cap:
            break

    return links

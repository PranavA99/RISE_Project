import re
from bs4 import BeautifulSoup


# Tags whose entire content we want to throw away
_REMOVE_TAGS = [
    "script", "style", "noscript", "iframe",
    "header", "footer", "nav", "aside",
    "form", "button", "input", "select",
    "svg", "img", "figure", "figcaption",
    "advertisement", "banner",
]


def extract_text_from_html(html: str) -> str:
    """
    Given raw HTML, return clean readable text with noise removed.

    Steps:
    1. Parse with BeautifulSoup
    2. Remove unwanted tags entirely (nav, footer, scripts …)
    3. Get remaining text
    4. Collapse whitespace
    5. Remove very short lines (likely leftover UI labels)
    """
    soup = BeautifulSoup(html, "html.parser")

    # Remove noisy tags
    for tag in soup.find_all(_REMOVE_TAGS):
        tag.decompose()

    # Also remove elements with common ad/cookie class names
    noise_classes = ["cookie", "popup", "modal", "ad-", "sidebar", "breadcrumb"]
    for tag in soup.find_all(True):
        tag_classes = " ".join(tag.get("class", []))
        if any(nc in tag_classes.lower() for nc in noise_classes):
            tag.decompose()

    # Extract text
    text = soup.get_text(separator="\n")

    # Clean up whitespace
    lines = [line.strip() for line in text.splitlines()]
    # Drop lines that are too short to be meaningful (e.g. single icon chars)
    lines = [line for line in lines if len(line) > 20]
    text = "\n".join(lines)

    # Collapse multiple blank lines into one
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def extract_title_from_html(html: str) -> str:
    """Return the <title> tag text, or empty string if not found."""
    soup = BeautifulSoup(html, "html.parser")
    title_tag = soup.find("title")
    return title_tag.get_text(strip=True) if title_tag else ""

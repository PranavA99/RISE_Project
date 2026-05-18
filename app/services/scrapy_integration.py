from app.services.ingestion import ingest_website


def process_scrapy_output(pages: list):

    for page in pages:
        url = page.get("url")
        content = page.get("content")

        if not url or not content:
            continue

        ingest_website(content, url)
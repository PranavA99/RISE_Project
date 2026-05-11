import os
from datetime import datetime
from typing import Optional, List

from fpdf import FPDF

from app.config import settings
from app.db.vector_store import get_collection


# ---------------------------------------------------------------------------
# Helpers — fetch data from ChromaDB
# ---------------------------------------------------------------------------

def _get_chunks_by_urls(source_urls: Optional[List[str]] = None) -> List[dict]:
    """
    Retrieve all stored chunks, optionally filtered by source URL.
    Groups chunks by URL so the export is organised per page.

    Returns a list of dicts: { url, title, chunks: [str] }
    """
    col = get_collection()

    if source_urls:
        # ChromaDB 'where' with multiple values uses the $in operator
        where = {"url": {"$in": source_urls}} if len(source_urls) > 1 else {"url": source_urls[0]}
        results = col.get(where=where, include=["documents", "metadatas"])
    else:
        results = col.get(include=["documents", "metadatas"])

    documents = results.get("documents", [])
    metadatas = results.get("metadatas", [])

    # Group by URL
    grouped: dict[str, dict] = {}
    for doc, meta in zip(documents, metadatas):
        url   = meta.get("url", "unknown")
        title = meta.get("title", url)
        if url not in grouped:
            grouped[url] = {"url": url, "title": title, "chunks": []}
        grouped[url]["chunks"].append(doc)

    return list(grouped.values())


# ---------------------------------------------------------------------------
# Markdown export
# ---------------------------------------------------------------------------

async def export_as_markdown(source_urls: Optional[List[str]] = None) -> str:
    """
    Write all scraped content to a Markdown file.
    Returns the file path.
    """
    pages = _get_chunks_by_urls(source_urls)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename  = f"export_{timestamp}.md"
    file_path = os.path.join(settings.EXPORT_DIR, filename)

    os.makedirs(settings.EXPORT_DIR, exist_ok=True)

    lines = [
        "# Scraped Knowledge Base Export",
        f"*Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}*",
        f"*Total pages: {len(pages)}*",
        "",
    ]

    for page in pages:
        lines.append(f"## {page['title'] or page['url']}")
        lines.append(f"**Source:** {page['url']}")
        lines.append("")
        full_text = " ".join(page["chunks"])
        lines.append(full_text)
        lines.append("")
        lines.append("---")
        lines.append("")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return file_path


# ---------------------------------------------------------------------------
# PDF export
# ---------------------------------------------------------------------------

class _PDF(FPDF):
    """Custom FPDF subclass with header and footer."""

    def header(self):
        self.set_font("Helvetica", "B", 12)
        self.cell(0, 10, "Scraped Knowledge Base Export", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")


async def export_as_pdf(source_urls: Optional[List[str]] = None) -> str:
    """
    Write all scraped content to a PDF file using fpdf2.
    Returns the file path.
    """
    pages = _get_chunks_by_urls(source_urls)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename  = f"export_{timestamp}.pdf"
    file_path = os.path.join(settings.EXPORT_DIR, filename)

    os.makedirs(settings.EXPORT_DIR, exist_ok=True)

    pdf = _PDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Title page info
    pdf.set_font("Helvetica", "I", 10)
    pdf.cell(0, 8, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
             new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, f"Total pages: {len(pages)}",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    for page in pages:
        # Section heading — page title
        pdf.set_font("Helvetica", "B", 13)
        title = page["title"] or page["url"]
        # multi_cell handles long titles that wrap
        pdf.multi_cell(0, 8, title)

        # Source URL
        pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(80, 80, 200)
        pdf.multi_cell(0, 6, page["url"])
        pdf.set_text_color(0, 0, 0)
        pdf.ln(2)

        # Body text
        pdf.set_font("Helvetica", size=10)
        full_text = " ".join(page["chunks"])
        # fpdf2 multi_cell with auto page break handles long content
        pdf.multi_cell(0, 6, full_text)
        pdf.ln(6)

        # Divider line
        pdf.set_draw_color(180, 180, 180)
        pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 190, pdf.get_y())
        pdf.ln(6)

    pdf.output(file_path)
    return file_path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

from app.models.request import ExportRequest, ExportFormat
from app.models.response import ExportResponse
from app.services.exporter import export_as_pdf, export_as_markdown
from app.config import settings

router = APIRouter()


@router.post("/", response_model=ExportResponse)
async def export_summaries(payload: ExportRequest):
    """
    Export scraped summaries as PDF or Markdown.

    - **format**: 'pdf' or 'markdown'
    - **source_urls**: optional filter — only export data from these URLs.
      Leave empty to export everything in the knowledge base.
    """
    source_urls = [str(u) for u in payload.source_urls] if payload.source_urls else None

    os.makedirs(settings.EXPORT_DIR, exist_ok=True)

    try:
        if payload.format == ExportFormat.pdf:
            file_path = await export_as_pdf(source_urls=source_urls)
        else:
            file_path = await export_as_markdown(source_urls=source_urls)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(exc)}")

    filename = os.path.basename(file_path)

    return ExportResponse(
        format=payload.format.value,
        file_path=file_path,
        download_url=f"/export/download/{filename}",
    )


@router.get("/download/{filename}")
async def download_export(filename: str):
    """
    Download a previously exported file by filename.
    """
    file_path = os.path.join(settings.EXPORT_DIR, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found. Please export again.")

    media_type = "application/pdf" if filename.endswith(".pdf") else "text/markdown"
    return FileResponse(path=file_path, filename=filename, media_type=media_type)

from fastapi import APIRouter
from app.models.response import HealthResponse
from app.db.vector_store import get_vector_store_status
from app.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Quick liveness check.
    Returns the status of the API and the vector store connection.
    Useful for teammates / frontend to verify the backend is up.
    """
    vector_status = get_vector_store_status()   # returns "connected" or "unavailable"

    return HealthResponse(
        status="ok",
        vector_store=vector_status,
        environment=settings.APP_ENV,
        version="1.0.0",
    )

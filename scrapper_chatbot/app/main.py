from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routes import scrape, chat, export, health
from app.db.vector_store import init_vector_store
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once on startup and once on shutdown.
    Use this to initialise DB connections, load models, etc.
    """
    print("🚀 Starting up — initialising vector store...")
    init_vector_store()
    print("✅ Vector store ready.")
    yield
    # --- shutdown logic goes here if needed ---
    print("🛑 Shutting down.")


app = FastAPI(
    title="Website Scraper & Chatbot API",
    description=(
        "Accepts URLs, scrapes and cleans their content, stores vector embeddings, "
        "and exposes a chatbot interface for domain-specific Q&A."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the frontend (Streamlit / Reflex) to call this API.
# In production, replace "*" with the actual frontend origin.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,   # e.g. ["http://localhost:8501"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers — each file in app/routes/ owns one feature area.
# ---------------------------------------------------------------------------
app.include_router(health.router, tags=["Health"])
app.include_router(scrape.router, prefix="/scrape", tags=["Scraping"])
app.include_router(chat.router,   prefix="/chat",   tags=["Chatbot"])
app.include_router(export.router, prefix="/export", tags=["Export"])


# ---------------------------------------------------------------------------
# Root endpoint — quick sanity check in the browser.
# ---------------------------------------------------------------------------
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Website Scraper & Chatbot API is running.",
        "docs": "/docs",
        "redoc": "/redoc",
    }

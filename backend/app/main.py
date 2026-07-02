"""UAPA FastAPI application entry-point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import projects, whitespace

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js frontend origin
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from app.routers import auth, projects, intake, whitespace, definition, prototype, gtm, tracking, overview
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(intake.router)
app.include_router(whitespace.router)
app.include_router(definition.router)
app.include_router(prototype.router)
app.include_router(gtm.router)
app.include_router(tracking.router)
app.include_router(overview.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}

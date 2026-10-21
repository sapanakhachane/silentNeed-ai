import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.ml.data_generator import seed_database_if_empty
from app.api.communities import router as communities_router
from app.api.predictions import router as predictions_router
from app.api.interventions import router as interventions_router
from app.api.simulation import router as simulation_router
from app.api.analytics import router as analytics_router
from app.api.osm import router as osm_router
from app.api.chat import router as chat_router
from app.api.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    Base.metadata.create_all(bind=engine)
    # Seed initial realistic benchmark dataset if DB is fresh
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="AI/ML platform detecting hidden community distress and resolving the civic complaint-reporting paradox.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(communities_router, prefix=settings.API_V1_STR)
app.include_router(predictions_router, prefix=settings.API_V1_STR)
app.include_router(interventions_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(osm_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "ml_models": "loaded",
        "anomaly_detector": "active",
        "complaint_gap_analyzer": "active"
    }

# Frontend static serving support
frontend_dist = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't intercept API or docs routes
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def read_root():
        return {
            "platform": settings.APP_NAME,
            "status": "operational",
            "docs_url": "/docs",
            "version": settings.ML_MODEL_VERSION,
            "database": "PostgreSQL-compatible / SQLite resilient"
        }

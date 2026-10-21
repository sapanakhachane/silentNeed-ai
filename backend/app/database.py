import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# If using PostgreSQL, connect directly; if sqlite, set check_same_thread
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        settings.DATABASE_URL, 
        connect_args=connect_args,
        echo=False
    )
except Exception as e:
    # If postgres failed or not reachable, fallback to SQLite
    print(f"Warning: Primary database connection failed: {e}. Falling back to SQLite.")
    sqlite_fallback_url = "sqlite:///./silentneed.db"
    engine = create_engine(sqlite_fallback_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

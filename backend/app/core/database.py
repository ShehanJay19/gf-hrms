from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,       # Reconnect if connection dropped
    pool_size=10,             # Max 10 DB connections
    max_overflow=20           # Allow 20 more in bursts
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency — use this in all route handlers
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
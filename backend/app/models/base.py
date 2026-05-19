from sqlalchemy import Column, Integer, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class BaseModel(Base):
    """
    Abstract base — every table inherits from this.
    Gives all tables: id, created_at, updated_at, is_active
    """
    __abstract__ = True  # SQLAlchemy won't create a table for this

    id         = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active  = Column(Boolean, default=True, nullable=False)
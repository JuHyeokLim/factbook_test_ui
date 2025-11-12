from sqlalchemy import create_engine, Column, String, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/factbook_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class Factbook(Base):
    __tablename__ = "factbooks"

    id = Column(String, primary_key=True)
    company_name = Column(String, index=True)
    product_name = Column(String)
    category = Column(String)
    competitors = Column(JSON)
    proposal_areas = Column(JSON)
    advertising_types = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    view_count = Column(Integer, default=0)

    sections = relationship("FactbookSection", back_populates="factbook")

class FactbookSection(Base):
    __tablename__ = "factbook_sections"

    id = Column(String, primary_key=True)
    factbook_id = Column(String, ForeignKey("factbooks.id"))
    section_order = Column(Integer)
    title = Column(String)
    content = Column(String)
    sources = Column(JSON)

    factbook = relationship("Factbook", back_populates="sections")

class RFPUpload(Base):
    __tablename__ = "rfp_uploads"

    id = Column(String, primary_key=True)
    filename = Column(String)
    file_path = Column(String)
    extracted_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

# 테이블 생성
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

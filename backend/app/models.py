from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, BigInteger, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid



class Department(Base):
    __tablename__ = "departments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)

class DocumentType(Base):
    __tablename__ = "document_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)

class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    document_type_id = Column(UUID(as_uuid=True), ForeignKey("document_types.id"), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    document_date = Column(Date, nullable=False)
    file_path = Column(String, nullable=False)
    file_mime_type = Column(String, nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    uploaded_by = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    flagged = Column(Boolean, default=False, nullable=False)
    flag_reason = Column(String)
    flagged_by = Column(String)
    flagged_at = Column(DateTime(timezone=True))

class DocumentTag(Base):
    __tablename__ = "document_tags"
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    tag = Column(String, primary_key=True)



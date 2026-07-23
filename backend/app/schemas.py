from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date, datetime
from uuid import UUID

class DepartmentBase(BaseModel):
    name: str

class DepartmentResponse(DepartmentBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

class DocumentTypeBase(BaseModel):
    name: str

class DocumentTypeResponse(DocumentTypeBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

class DocumentBase(BaseModel):
    title: str
    document_type_id: UUID
    department_id: UUID
    document_date: date
    tags: Optional[List[str]] = []

class DocumentCreate(DocumentBase):
    # Additional fields handled manually by route (file properties)
    pass

class DocumentResponse(DocumentBase):
    id: UUID
    file_path: str
    file_mime_type: str
    file_size_bytes: int
    uploaded_by: str
    uploaded_at: datetime
    flagged: bool
    flag_reason: Optional[str] = None
    flagged_by: Optional[str] = None
    flagged_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

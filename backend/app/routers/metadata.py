from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import Department, DocumentType
from app.schemas import DepartmentResponse, DocumentTypeResponse
from typing import List

router = APIRouter(prefix="/api/metadata", tags=["metadata"])

@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department))
    return result.scalars().all()

@router.get("/document-types", response_model=List[DocumentTypeResponse])
async def get_document_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DocumentType))
    return result.scalars().all()

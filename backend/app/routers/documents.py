import os
import uuid
import magic
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import insert, update
from app.database import get_db
from app.config import settings
from app.schemas import DocumentResponse
from app.models import Document, DocumentTag
from app.dependencies import get_current_role, require_admin

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/", response_model=DocumentResponse)
async def upload_document(
    title: str = Form(...),
    document_type_id: str = Form(...),
    department_id: str = Form(...),
    document_date: str = Form(...),
    tags: str = Form(default=""),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    role: str = Depends(get_current_role)
):
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not read file")

    # Validate file size
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB")

    # Validate file type using magic
    mime_type = magic.from_buffer(content[:2048], mime=True)
    allowed_mimes = ["application/pdf", "image/jpeg", "image/png", "image/tiff"]
    if mime_type not in allowed_mimes:
        raise HTTPException(status_code=415, detail=f"File type {mime_type} not allowed. Please upload PDF, JPG, PNG, or TIFF.")

    # Generate document ID and save file
    doc_id = uuid.uuid4()
    file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
    file_path_relative = f"{doc_id}{file_extension}"
    full_path = os.path.join(settings.STORAGE_ROOT, file_path_relative)
    
    with open(full_path, "wb") as f:
        f.write(content)

    # Insert Document
    try:
        parsed_date = datetime.strptime(document_date, "%Y-%m-%d").date()
        
        # It's better to use ORM model construction
        new_doc = Document(
            id=doc_id,
            title=title,
            document_type_id=document_type_id,
            department_id=department_id,
            document_date=parsed_date,
            file_path=file_path_relative,
            file_mime_type=mime_type,
            file_size_bytes=len(content),
            uploaded_by="Local Uploader Prototype" # Dropped users table
        )
        db.add(new_doc)
        await db.flush()

        # Handle Tags
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        for t in tag_list:
            db.add(DocumentTag(document_id=doc_id, tag=t))

        await db.commit()
        await db.refresh(new_doc)
        return new_doc
    except Exception as e:
        await db.rollback()
        # Clean up file on DB error
        if os.path.exists(full_path):
            os.remove(full_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{doc_id}/flag")
async def flag_document(
    doc_id: str,
    reason: str = Form(...),
    db: AsyncSession = Depends(get_db),
    role: str = Depends(require_admin)
):
    stmt = update(Document).where(Document.id == doc_id).values(
        flagged=True,
        flag_reason=reason,
        flagged_by="Admin Action",
        flagged_at=datetime.utcnow()
    )
    result = await db.execute(stmt)
    await db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return {"status": "flagged", "reason": reason}

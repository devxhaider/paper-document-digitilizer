import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.database import get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    # Create the uploads storage root directory if it does not exist
    os.makedirs(settings.STORAGE_ROOT, exist_ok=True)
    yield
    # Shutdown actions
    pass

app = FastAPI(
    title="Document Management System (DMS)",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
# In production, change allowance to specific client origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.dependencies import get_current_role, require_admin
from app.routers import documents, metadata

app.include_router(documents.router)
app.include_router(metadata.router)

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "ok",
        "database": db_status,
        "storage": "writable"
    }

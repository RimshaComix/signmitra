from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas.directory import (
    DirectoryItemCreate,
    DirectoryItemUpdate,
    DirectoryItemResponse
)
from backend.services.directory_service import directory_service

router = APIRouter(prefix="/directory", tags=["Accessibility Directory"])

@router.get("", response_model=List[DirectoryItemResponse])
def list_directory(
    query: Optional[str] = Query(None, description="Search keyword in name, address, notes"),
    city: Optional[str] = Query(None, description="Filter by city, e.g. Delhi, Mumbai"),
    domain: Optional[str] = Query(None, description="hospital, bank, education, transit"),
    wheelchair_only: bool = Query(False, description="Filter wheelchair accessible locations"),
    sign_desk_only: bool = Query(False, description="Filter locations with sign assistance"),
    verified_only: bool = Query(False, description="Filter officially verified records only"),
    db: Session = Depends(get_db)
):
    directory_service.seed_initial_records_if_empty(db)
    records = directory_service.search_records(
        db=db,
        query=query,
        city=city,
        domain=domain,
        wheelchair_only=wheelchair_only,
        sign_desk_only=sign_desk_only,
        verified_only=verified_only
    )
    return records

@router.post("", response_model=DirectoryItemResponse, status_code=201)
def create_directory_entry(data: DirectoryItemCreate, db: Session = Depends(get_db)):
    return directory_service.create_record(db, data)

@router.get("/{record_id}", response_model=DirectoryItemResponse)
def get_directory_entry(record_id: str, db: Session = Depends(get_db)):
    rec = directory_service.get_by_id(db, record_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Directory record not found.")
    return rec

@router.put("/{record_id}", response_model=DirectoryItemResponse)
def update_directory_entry(record_id: str, data: DirectoryItemUpdate, db: Session = Depends(get_db)):
    rec = directory_service.update_record(db, record_id, data)
    if not rec:
        raise HTTPException(status_code=404, detail="Directory record not found.")
    return rec

@router.delete("/{record_id}", status_code=204)
def delete_directory_entry(record_id: str, db: Session = Depends(get_db)):
    success = directory_service.delete_record(db, record_id)
    if not success:
        raise HTTPException(status_code=404, detail="Directory record not found.")
    return None

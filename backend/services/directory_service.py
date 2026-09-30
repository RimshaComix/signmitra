import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.models.directory import DirectoryModel
from backend.schemas.directory import DirectoryItemCreate, DirectoryItemUpdate

INITIAL_SEED_RECORDS = [
    {
        "id": "dir-delhi-aiims",
        "name": "AIIMS New Delhi - Central Registration",
        "domain": "hospital",
        "city": "New Delhi",
        "address": "Ansari Nagar East, New Delhi, Delhi 110029",
        "wheelchair_accessible": True,
        "sign_assistance_desk": True,
        "token_display_system": True,
        "written_communication_desk": True,
        "notes": "Dedicated Divyangjan registration counter at OPD Block A with visual token displays and written query slips.",
        "verified_status": "verified",
        "verified_by": "SignMitra Accessibility Field Audit",
        "contact_phone": "011-26588500"
    },
    {
        "id": "dir-delhi-sbi-parliament",
        "name": "State Bank of India - Parliament Street Main Branch",
        "domain": "bank",
        "city": "New Delhi",
        "address": "11, Sansad Marg, Connaught Place, New Delhi 110001",
        "wheelchair_accessible": True,
        "sign_assistance_desk": False,
        "token_display_system": True,
        "written_communication_desk": True,
        "notes": "Wheelchair ramp at entrance, electronic LED token callout system, special senior/divyang assistance desk Counter 1.",
        "verified_status": "verified",
        "verified_by": "SignMitra Accessibility Field Audit",
        "contact_phone": "011-23374100"
    },
    {
        "id": "dir-mumbai-kem",
        "name": "KEM Hospital & Seth G.S. Medical College",
        "domain": "hospital",
        "city": "Mumbai",
        "address": "Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012",
        "wheelchair_accessible": True,
        "sign_assistance_desk": True,
        "token_display_system": True,
        "written_communication_desk": True,
        "notes": "Multilingual guidance signage, priority registration desk at Gate 2, wheelchair access across main clinical block.",
        "verified_status": "verified",
        "verified_by": "Public Sector Accessibility Registry",
        "contact_phone": "022-24107000"
    }
]

class DirectoryService:
    def seed_initial_records_if_empty(self, db: Session):
        count = db.query(DirectoryModel).count()
        if count == 0:
            for rec in INITIAL_SEED_RECORDS:
                model = DirectoryModel(**rec)
                db.add(model)
            db.commit()

    def search_records(
        self,
        db: Session,
        query: Optional[str] = None,
        city: Optional[str] = None,
        domain: Optional[str] = None,
        wheelchair_only: bool = False,
        sign_desk_only: bool = False,
        verified_only: bool = False
    ) -> List[DirectoryModel]:
        q = db.query(DirectoryModel)

        if query:
            search_str = f"%{query.strip()}%"
            q = q.filter(
                (DirectoryModel.name.ilike(search_str)) |
                (DirectoryModel.address.ilike(search_str)) |
                (DirectoryModel.notes.ilike(search_str))
            )

        if city and city.lower() != "all":
            q = q.filter(DirectoryModel.city.ilike(f"%{city.strip()}%"))

        if domain and domain.lower() != "all":
            q = q.filter(DirectoryModel.domain.ilike(domain.strip()))

        if wheelchair_only:
            q = q.filter(DirectoryModel.wheelchair_accessible == True)

        if sign_desk_only:
            q = q.filter(DirectoryModel.sign_assistance_desk == True)

        if verified_only:
            q = q.filter(DirectoryModel.verified_status == "verified")

        return q.all()

    def get_by_id(self, db: Session, record_id: str) -> Optional[DirectoryModel]:
        return db.query(DirectoryModel).filter(DirectoryModel.id == record_id).first()

    def create_record(self, db: Session, data: DirectoryItemCreate) -> DirectoryModel:
        record_id = f"dir-{str(uuid.uuid4())[:8]}"
        record = DirectoryModel(id=record_id, **data.model_dump())
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def update_record(self, db: Session, record_id: str, data: DirectoryItemUpdate) -> Optional[DirectoryModel]:
        record = self.get_by_id(db, record_id)
        if not record:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(record, key, val)
        db.commit()
        db.refresh(record)
        return record

    def delete_record(self, db: Session, record_id: str) -> bool:
        record = self.get_by_id(db, record_id)
        if not record:
            return False
        db.delete(record)
        db.commit()
        return True

directory_service = DirectoryService()

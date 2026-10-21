from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import InterventionRecord, Community
from app.schemas.pydantic_models import (
    InterventionResponse, InterventionCreate, InterventionUpdate
)

router = APIRouter(prefix="/interventions", tags=["Interventions"])

@router.get("", response_model=List[InterventionResponse])
def get_interventions(
    status: Optional[str] = None,
    sector: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InterventionRecord)
    if status:
        query = query.filter(InterventionRecord.status.ilike(status))
    if sector:
        query = query.filter(InterventionRecord.sector.ilike(f"%{sector}%"))
    if priority:
        query = query.filter(InterventionRecord.priority.ilike(priority))

    return query.order_by(InterventionRecord.created_at.desc()).all()

@router.post("", response_model=InterventionResponse)
def create_intervention(payload: InterventionCreate, db: Session = Depends(get_db)):
    comm = db.query(Community).filter(Community.id == payload.community_id).first()
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    intervention = InterventionRecord(**payload.model_dump())
    db.add(intervention)
    db.commit()
    db.refresh(intervention)
    return intervention

@router.patch("/{intervention_id}", response_model=InterventionResponse)
def update_intervention(
    intervention_id: int, 
    payload: InterventionUpdate, 
    db: Session = Depends(get_db)
):
    item = db.query(InterventionRecord).filter(InterventionRecord.id == intervention_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Intervention not found")

    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(item, k, v)
    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)
    return item

@router.get("/summary")
def get_interventions_summary(db: Session = Depends(get_db)):
    all_items = db.query(InterventionRecord).all()
    total_budget = sum(i.estimated_budget for i in all_items)
    status_counts = {}
    sector_counts = {}
    
    for i in all_items:
        status_counts[i.status] = status_counts.get(i.status, 0) + 1
        sector_counts[i.sector] = sector_counts.get(i.sector, 0) + 1

    return {
        "total_interventions": len(all_items),
        "total_budget_allocated": total_budget,
        "by_status": status_counts,
        "by_sector": sector_counts,
        "critical_count": sum(1 for i in all_items if i.priority == "Critical")
    }

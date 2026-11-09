from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.database import get_db
from backend.app.database.models import Recommendation, Room

router = APIRouter(prefix="/recommendations", tags=["AI Recommendations"])

@router.get("/")
def get_recommendations(db: Session = Depends(get_db)):
    recs = db.query(Recommendation).order_by(desc(Recommendation.timestamp)).limit(30).all()
    results = []
    for r in recs:
        room = db.query(Room).filter(Room.id == r.room_id).first()
        results.append({
            "id": r.id,
            "timestamp": r.timestamp,
            "room_id": r.room_id,
            "room_number": room.room_number if room else "Unknown",
            "room_name": room.name if room else "",
            "category": r.category,
            "problem": r.problem,
            "suggested_action": r.suggested_action,
            "estimated_kwh_saving": r.estimated_kwh_saving,
            "estimated_cost_saving": r.estimated_cost_saving,
            "estimated_co2_saving": r.estimated_co2_saving,
            "status": r.status
        })
    return results

@router.post("/{rec_id}/apply")
def apply_recommendation(rec_id: int, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.status = "APPLIED"
    db.commit()
    return {"status": "success", "message": f"Applied recommendation #{rec_id}"}

@router.post("/{rec_id}/dismiss")
def dismiss_recommendation(rec_id: int, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    rec.status = "DISMISSED"
    db.commit()
    return {"status": "success", "message": f"Dismissed recommendation #{rec_id}"}

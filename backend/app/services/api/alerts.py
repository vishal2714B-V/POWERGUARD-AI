from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.database import get_db
from backend.app.database.models import Alert, Room

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("/")
def get_alerts(severity: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Alert)
    if severity and severity.upper() != "ALL":
        query = query.filter(Alert.alert_type == severity.upper())
    alerts = query.order_by(desc(Alert.timestamp)).limit(50).all()
    
    results = []
    for a in alerts:
        room = db.query(Room).filter(Room.id == a.room_id).first()
        results.append({
            "id": a.id,
            "timestamp": a.timestamp,
            "room_id": a.room_id,
            "room_number": room.room_number if room else "Unknown",
            "room_name": room.name if room else "",
            "alert_type": a.alert_type,
            "title": a.title,
            "message": a.message,
            "recommended_action": a.recommended_action,
            "is_read": a.is_read
        })
    return results

@router.post("/{alert_id}/read")
def mark_alert_as_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    return {"status": "success", "id": alert_id, "is_read": True}

@router.post("/mark-all-read")
def mark_all_alerts_read(db: Session = Depends(get_db)):
    db.query(Alert).filter(Alert.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "success", "message": "All alerts marked as read"}

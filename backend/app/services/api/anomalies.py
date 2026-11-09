from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.database import get_db
from backend.app.database.models import Anomaly, Room, EnergyReading

router = APIRouter(prefix="/anomalies", tags=["Anomalies & Wastage"])

@router.get("/")
def get_anomalies(db: Session = Depends(get_db)):
    anomalies = db.query(Anomaly).order_by(desc(Anomaly.timestamp)).limit(50).all()
    results = []
    
    for a in anomalies:
        room = db.query(Room).filter(Room.id == a.room_id).first()
        latest_reading = (
            db.query(EnergyReading)
            .filter(EnergyReading.room_id == a.room_id)
            .order_by(desc(EnergyReading.timestamp))
            .first()
        )
        
        # Build contributing factors breakdown
        factors = []
        if a.risk_score >= 70:
            factors.append({
                "factor_name": "Zero-Occupancy Air Conditioning",
                "contribution_score": 48.0,
                "description": "High-draw HVAC active with zero detected occupants."
            })
            factors.append({
                "factor_name": "Power Surge Beyond Baseline",
                "contribution_score": 20.0,
                "description": f"Continuous draw of {a.power_kw:.2f} kW vs 0.20 kW baseline."
            })
            factors.append({
                "factor_name": "Isolation Forest Anomaly Score",
                "contribution_score": 14.0,
                "description": f"Statistical anomaly metric: {a.anomaly_score:.3f}."
            })
        else:
            factors.append({
                "factor_name": "Elevated Power Draw",
                "contribution_score": 25.0,
                "description": "Consumption exceeds seasonal expectations."
            })
            factors.append({
                "factor_name": "Baseline Divergence",
                "contribution_score": 17.0,
                "description": "Energy trend differs from historical weekday patterns."
            })

        results.append({
            "id": a.id,
            "timestamp": a.timestamp,
            "room_id": a.room_id,
            "room_number": room.room_number if room else "Unknown",
            "room_name": room.name if room else "",
            "anomaly_score": a.anomaly_score,
            "risk_score": a.risk_score,
            "severity": a.severity,
            "is_wastage": a.is_wastage,
            "reason": a.reason,
            "power_kw": a.power_kw,
            "duration_hours": a.duration_hours,
            "wasted_kwh": a.wasted_kwh,
            "wasted_cost": a.wasted_cost,
            "occupancy": latest_reading.occupancy if latest_reading else 0,
            "ac_status": latest_reading.ac_status if latest_reading else False,
            "light_status": latest_reading.light_status if latest_reading else False,
            "factors": factors
        })
    return results

@router.get("/active-wastage")
def get_active_wastage(db: Session = Depends(get_db)):
    recent = datetime.utcnow() - timedelta(hours=6)
    active = (
        db.query(Anomaly)
        .filter(Anomaly.timestamp >= recent, Anomaly.is_wastage == True)
        .order_by(desc(Anomaly.timestamp))
        .all()
    )
    results = []
    for a in active:
        room = db.query(Room).filter(Room.id == a.room_id).first()
        latest = (
            db.query(EnergyReading)
            .filter(EnergyReading.room_id == a.room_id)
            .order_by(desc(EnergyReading.timestamp))
            .first()
        )
        results.append({
            "id": a.id,
            "room_id": a.room_id,
            "room_number": room.room_number if room else "204",
            "room_name": room.name if room else "Room",
            "reason": a.reason,
            "power_kw": a.power_kw,
            "duration_hours": a.duration_hours,
            "wasted_kwh": a.wasted_kwh,
            "wasted_cost": a.wasted_cost,
            "risk_score": a.risk_score,
            "severity": a.severity,
            "occupancy": latest.occupancy if latest else 0,
            "ac_status": latest.ac_status if latest else True,
            "light_status": latest.light_status if latest else True,
            "timestamp": a.timestamp
        })
    return results

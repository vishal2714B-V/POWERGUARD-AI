from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.database import get_db
from backend.app.database.models import Room, EnergyReading, Anomaly, Alert, Recommendation, User
from backend.app.schemas.schemas import RoomResponse, RoomLiveStatus
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/rooms", tags=["Rooms"])

@router.get("/", response_model=List[RoomResponse])
def get_all_rooms(db: Session = Depends(get_db)):
    return db.query(Room).all()

@router.get("/live", response_model=List[RoomLiveStatus])
def get_live_rooms_status(db: Session = Depends(get_db)):
    rooms = db.query(Room).filter(Room.is_monitored == True).all()
    results = []
    
    for room in rooms:
        latest_reading = (
            db.query(EnergyReading)
            .filter(EnergyReading.room_id == room.id)
            .order_by(desc(EnergyReading.timestamp))
            .first()
        )
        latest_anomaly = (
            db.query(Anomaly)
            .filter(Anomaly.room_id == room.id)
            .order_by(desc(Anomaly.timestamp))
            .first()
        )
        
        # Default nominal state if reading absent
        power_kw = latest_reading.power_kw if latest_reading else room.baseline_power_kw
        voltage = latest_reading.voltage if latest_reading else 230.0
        current_amp = latest_reading.current if latest_reading else 0.0
        temp = latest_reading.temperature if latest_reading else 25.0
        occ = latest_reading.occupancy if latest_reading else 0
        ac = latest_reading.ac_status if latest_reading else False
        light = latest_reading.light_status if latest_reading else False
        fan = latest_reading.fan_status if latest_reading else False
        comp = latest_reading.computer_status if latest_reading else False
        last_updated = latest_reading.timestamp if latest_reading else datetime.utcnow()
        
        status_val = "NORMAL"
        risk_score = 12.0
        active_reason = None
        
        if latest_anomaly:
            status_val = latest_anomaly.severity
            risk_score = latest_anomaly.risk_score
            active_reason = latest_anomaly.reason
        elif occ == 0 and ac:
            status_val = "CRITICAL"
            risk_score = 82.0
            active_reason = "High AC consumption detected while room is unoccupied."
        elif occ == 0 and light:
            status_val = "WARNING"
            risk_score = 35.0
            active_reason = "Unattended lighting in empty room."

        results.append(RoomLiveStatus(
            room_id=room.id,
            room_number=room.room_number,
            name=room.name,
            floor=room.floor,
            current_power_kw=power_kw,
            voltage=voltage,
            current_amp=current_amp,
            temperature=temp,
            occupancy=occ,
            ac_status=ac,
            light_status=light,
            fan_status=fan,
            computer_status=comp,
            status=status_val,
            risk_score=risk_score,
            active_anomaly_reason=active_reason,
            last_updated=last_updated
        ))
    return results

@router.get("/{room_id}")
def get_room_details(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    latest_reading = (
        db.query(EnergyReading)
        .filter(EnergyReading.room_id == room.id)
        .order_by(desc(EnergyReading.timestamp))
        .first()
    )
    
    # 24-hour historical readings
    since = datetime.utcnow() - timedelta(hours=24)
    recent_readings = (
        db.query(EnergyReading)
        .filter(EnergyReading.room_id == room.id, EnergyReading.timestamp >= since)
        .order_by(EnergyReading.timestamp.asc())
        .limit(48)
        .all()
    )
    
    anomalies = (
        db.query(Anomaly)
        .filter(Anomaly.room_id == room.id)
        .order_by(desc(Anomaly.timestamp))
        .limit(10)
        .all()
    )
    
    recommendations = (
        db.query(Recommendation)
        .filter(Recommendation.room_id == room.id)
        .order_by(desc(Recommendation.timestamp))
        .limit(10)
        .all()
    )
    
    return {
        "room": {
            "id": room.id,
            "room_number": room.room_number,
            "name": room.name,
            "floor": room.floor,
            "building": room.building,
            "area_sqft": room.area_sqft,
            "baseline_power_kw": room.baseline_power_kw,
            "is_monitored": room.is_monitored
        },
        "latest_reading": latest_reading,
        "recent_history": recent_readings,
        "anomalies": anomalies,
        "recommendations": recommendations
    }

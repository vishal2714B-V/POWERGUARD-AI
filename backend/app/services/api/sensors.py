from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.database import get_db
from backend.app.database.models import Sensor, EnergyReading, Room, Anomaly, Alert, Recommendation, SystemSetting
from backend.app.schemas.schemas import EnergyReadingCreate
from ml.anomaly_detection.detector import anomaly_detector
from backend.app.services.recommendation_service import recommendation_engine

router = APIRouter(prefix="/sensors", tags=["Sensors"])

@router.get("/")
def get_sensors(db: Session = Depends(get_db)):
    sensors = db.query(Sensor).all()
    results = []
    for s in sensors:
        room = db.query(Room).filter(Room.id == s.room_id).first()
        results.append({
            "id": s.id,
            "sensor_uid": s.sensor_uid,
            "room_id": s.room_id,
            "room_number": room.room_number if room else "Unknown",
            "sensor_type": s.sensor_type,
            "status": s.status,
            "last_seen": s.last_seen,
            "firmware_version": s.firmware_version
        })
    return results

@router.post("/ingest")
def ingest_reading(reading: EnergyReadingCreate, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == reading.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Target room not found")
        
    ts = reading.timestamp if reading.timestamp else datetime.utcnow()
    
    # 1. Persist sensor reading
    new_reading = EnergyReading(
        timestamp=ts,
        room_id=reading.room_id,
        voltage=reading.voltage,
        current=reading.current,
        power_kw=reading.power_kw,
        energy_kwh=reading.energy_kwh,
        temperature=reading.temperature,
        occupancy=reading.occupancy,
        ac_status=reading.ac_status,
        light_status=reading.light_status,
        fan_status=reading.fan_status,
        computer_status=reading.computer_status
    )
    db.add(new_reading)
    
    # Update sensor heartbeat
    sensor = db.query(Sensor).filter(Sensor.room_id == reading.room_id).first()
    if sensor:
        sensor.last_seen = ts
        sensor.status = "ONLINE"

    # 2. Run Real-Time AI ML Anomaly & Risk Analysis
    analysis = anomaly_detector.analyze_reading(
        power_kw=reading.power_kw,
        occupancy=reading.occupancy,
        temperature=reading.temperature,
        ac_status=reading.ac_status,
        light_status=reading.light_status,
        hour=ts.hour,
        baseline_kw=room.baseline_power_kw,
        duration_hours=1.0
    )
    
    # 3. Store anomaly if detected
    if analysis["severity"] in ["WARNING", "WASTAGE", "CRITICAL"]:
        anomaly = Anomaly(
            timestamp=ts,
            room_id=reading.room_id,
            anomaly_score=analysis["anomaly_score"],
            risk_score=analysis["risk_score"],
            severity=analysis["severity"],
            is_wastage=analysis["is_wastage"],
            reason=analysis["reason"],
            power_kw=reading.power_kw,
            duration_hours=1.0,
            wasted_kwh=analysis["wasted_kwh"],
            wasted_cost=analysis["wasted_cost"]
        )
        db.add(anomaly)
        db.flush()
        
        # 4. Trigger alert engine if severe
        if analysis["severity"] in ["WASTAGE", "CRITICAL"]:
            alert = Alert(
                timestamp=ts,
                room_id=reading.room_id,
                alert_type=analysis["severity"],
                title=f"{analysis['severity'].title()} Detected in Room {room.room_number}",
                message=f"Room {room.room_number}: {analysis['reason']} (Power: {reading.power_kw:.2f} kW, Occupancy: {reading.occupancy}).",
                recommended_action="Inspect room and switch off unnecessary equipment.",
                is_read=False
            )
            db.add(alert)
            
            # 5. Trigger AI recommendation engine
            recs = recommendation_engine.generate_recommendations(
                room_id=room.id,
                room_number=room.room_number,
                power_kw=reading.power_kw,
                occupancy=reading.occupancy,
                temperature=reading.temperature,
                ac_status=reading.ac_status,
                light_status=reading.light_status,
                fan_status=reading.fan_status,
                baseline_kw=room.baseline_power_kw
            )
            for r in recs:
                db.add(Recommendation(
                    timestamp=ts,
                    room_id=r["room_id"],
                    anomaly_id=anomaly.id,
                    category=r["category"],
                    problem=r["problem"],
                    suggested_action=r["suggested_action"],
                    estimated_kwh_saving=r["estimated_kwh_saving"],
                    estimated_cost_saving=r["estimated_cost_saving"],
                    estimated_co2_saving=r["estimated_co2_saving"],
                    status="PENDING"
                ))

    db.commit()
    return {
        "status": "success",
        "room_number": room.room_number,
        "power_kw": reading.power_kw,
        "analysis": analysis
    }

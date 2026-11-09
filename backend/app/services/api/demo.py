from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.database import get_db
from backend.app.database.models import Room, EnergyReading, Anomaly, Alert, Recommendation
from ml.anomaly_detection.detector import anomaly_detector
from backend.app.services.recommendation_service import recommendation_engine
from iot.simulator.simulator import iot_simulator

router = APIRouter(prefix="/demo", tags=["Demo Mode Engine"])

@router.post("/scenario/wastage")
def trigger_scenario_wastage(db: Session = Depends(get_db)):
    """Predefined Scenario 2: Severe AC Wastage in Room 204"""
    iot_simulator.trigger_wastage_scenario_204()
    now = datetime.utcnow()
    
    # Push live reading for Room 204
    db.add(EnergyReading(
        timestamp=now,
        room_id=8,
        voltage=230.4,
        current=11.0,
        power_kw=2.40,
        energy_kwh=1862.0,
        temperature=29.0,
        occupancy=0,
        ac_status=True,
        light_status=True,
        fan_status=False,
        computer_status=False
    ))
    
    # Add Critical Anomaly
    db.add(Anomaly(
        timestamp=now,
        room_id=8,
        anomaly_score=-0.22,
        risk_score=82.0,
        severity="CRITICAL",
        is_wastage=True,
        reason="High AC consumption detected while room is unoccupied.",
        power_kw=2.40,
        duration_hours=2.0,
        wasted_kwh=4.80,
        wasted_cost=38.40
    ))
    
    # Add Alert
    db.add(Alert(
        timestamp=now,
        room_id=8,
        alert_type="CRITICAL",
        title="Severe Wastage in Room 204",
        message="Room 204 has high consumption (2.4 kW) while completely unoccupied.",
        recommended_action="Turn OFF the AC immediately.",
        is_read=False
    ))
    
    # Add Recommendation
    recs = recommendation_engine.generate_recommendations(
        room_id=8, room_number="204", power_kw=2.40, occupancy=0,
        temperature=29.0, ac_status=True, light_status=True, fan_status=False
    )
    for r in recs:
        db.add(Recommendation(
            timestamp=now,
            room_id=r["room_id"],
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
        "scenario": "Severe AC Wastage",
        "room": "204",
        "occupancy": 0,
        "ac": "ON",
        "power_kw": 2.4,
        "risk_score": 82.0,
        "severity": "CRITICAL"
    }

@router.post("/scenario/normal")
def trigger_scenario_normal(db: Session = Depends(get_db)):
    """Predefined Scenario 1: Normal Operational Usage across rooms"""
    iot_simulator.trigger_normal_scenario()
    now = datetime.utcnow()
    
    # Normalize Room 204
    db.add(EnergyReading(
        timestamp=now,
        room_id=8,
        voltage=230.1,
        current=6.5,
        power_kw=1.42,
        energy_kwh=1864.0,
        temperature=24.0,
        occupancy=14,
        ac_status=True,
        light_status=True,
        fan_status=False,
        computer_status=False
    ))
    
    # Mark resolved anomaly
    db.add(Anomaly(
        timestamp=now,
        room_id=8,
        anomaly_score=0.12,
        risk_score=15.0,
        severity="NORMAL",
        is_wastage=False,
        reason="System operating within normal energy and occupancy parameters",
        power_kw=1.42,
        duration_hours=1.0,
        wasted_kwh=0.0,
        wasted_cost=0.0
    ))
    db.commit()
    return {
        "status": "success",
        "scenario": "Normal Usage",
        "room": "204",
        "occupancy": 14,
        "power_kw": 1.42,
        "risk_score": 15.0,
        "severity": "NORMAL"
    }

@router.post("/scenario/high-load")
def trigger_scenario_high_load(db: Session = Depends(get_db)):
    """Predefined Scenario 3: High Consumption Spike"""
    now = datetime.utcnow()
    db.add(EnergyReading(
        timestamp=now,
        room_id=3,
        voltage=228.0,
        current=19.5,
        power_kw=4.20,
        energy_kwh=2160.0,
        temperature=27.5,
        occupancy=75,
        ac_status=True,
        light_status=True,
        fan_status=True,
        computer_status=True
    ))
    db.add(Alert(
        timestamp=now,
        room_id=3,
        alert_type="WARNING",
        title="High Power Surge in Lecture Hall A",
        message="Instantaneous load reached 4.2 kW (peak allowable limit).",
        recommended_action="Inspect auxiliary HVAC and projection banks.",
        is_read=False
    ))
    db.commit()
    return {
        "status": "success",
        "scenario": "High Load Spike",
        "room": "103",
        "power_kw": 4.20
    }

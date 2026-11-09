from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database.database import get_db
from backend.app.database.models import WastageCharge, Room, SystemSetting
from backend.app.schemas.schemas import WastageChargeRequest, WastageChargeResponse
from simulation.wastage_charge.calculator import wastage_charge_engine

router = APIRouter(prefix="/wastage-charge", tags=["Smart Wastage Charge"])

@router.get("/", response_model=List[WastageChargeResponse])
def get_wastage_charges(db: Session = Depends(get_db)):
    charges = db.query(WastageCharge).order_by(desc(WastageCharge.timestamp)).limit(20).all()
    results = []
    for c in charges:
        room = db.query(Room).filter(Room.id == c.room_id).first()
        results.append(WastageChargeResponse(
            id=c.id,
            room_number=f"Room {room.room_number}" if room else "Facility Wide",
            billing_period=c.billing_period,
            expected_kwh=c.expected_kwh,
            actual_kwh=c.actual_kwh,
            avoidable_excess_kwh=c.avoidable_excess_kwh,
            penalty_rate=c.penalty_rate,
            simulated_charge_inr=c.simulated_charge,
            status="CRITICAL_EXCESS" if c.avoidable_excess_kwh > 40 else "EXCESS_WASTAGE",
            disclaimer=c.notes or "SIMULATED SMART WASTAGE CHARGE: This is a simulated behavioural charge intended to encourage responsible energy usage. It is not an actual electricity bill."
        ))
    return results

@router.post("/calculate", response_model=WastageChargeResponse)
def calculate_custom_charge(req: WastageChargeRequest, db: Session = Depends(get_db)):
    # Load default penalty rate from db
    penalty_setting = db.query(SystemSetting).filter(SystemSetting.key == "PENALTY_RATE").first()
    rate = req.penalty_rate if req.penalty_rate is not None else (float(penalty_setting.value) if penalty_setting else 10.0)
    
    room_name = "Whole Facility"
    if req.room_id:
        room = db.query(Room).filter(Room.id == req.room_id).first()
        if room:
            room_name = f"Room {room.room_number}"
            
    expected = req.expected_kwh if req.expected_kwh is not None else 400.0
    actual = req.actual_kwh if req.actual_kwh is not None else 450.0
    
    result = wastage_charge_engine.calculate_charge(
        expected_kwh=expected,
        actual_kwh=actual,
        penalty_rate=rate,
        room_number=room_name
    )
    
    return WastageChargeResponse(**result)

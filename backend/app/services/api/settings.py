from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.models import SystemSetting
from backend.app.schemas.schemas import SettingUpdate
from backend.app.services.auth_service import get_current_admin

router = APIRouter(prefix="/settings", tags=["System Settings"])

@router.get("/")
def get_settings(db: Session = Depends(get_db)):
    settings_records = db.query(SystemSetting).all()
    res = {}
    for s in settings_records:
        res[s.key] = {
            "value": s.value,
            "description": s.description,
            "updated_at": s.updated_at
        }
    return res

@router.put("/update")
def update_settings(update: SettingUpdate, db: Session = Depends(get_db)):
    # Can be updated by admin
    if update.energy_tariff is not None:
        rec = db.query(SystemSetting).filter(SystemSetting.key == "ENERGY_TARIFF").first()
        if rec:
            rec.value = str(update.energy_tariff)
            
    if update.co2_emission_factor is not None:
        rec = db.query(SystemSetting).filter(SystemSetting.key == "CO2_EMISSION_FACTOR").first()
        if rec:
            rec.value = str(update.co2_emission_factor)
            
    if update.penalty_rate is not None:
        rec = db.query(SystemSetting).filter(SystemSetting.key == "PENALTY_RATE").first()
        if rec:
            rec.value = str(update.penalty_rate)
            
    if update.wastage_threshold_kw is not None:
        rec = db.query(SystemSetting).filter(SystemSetting.key == "WASTAGE_THRESHOLD_KW").first()
        if rec:
            rec.value = str(update.wastage_threshold_kw)
            
    db.commit()
    return {"status": "success", "message": "System parameters updated successfully"}

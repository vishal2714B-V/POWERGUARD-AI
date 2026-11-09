import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.database.models import SimulationResult, SystemSetting
from backend.app.schemas.schemas import SimulationRequest, SimulationResponse
from simulation.what_if.engine import what_if_engine

router = APIRouter(prefix="/simulation", tags=["What-If Simulation"])

@router.post("/run", response_model=SimulationResponse)
def run_what_if_simulation(req: SimulationRequest, db: Session = Depends(get_db)):
    # Load current active tariff and CO2 factor
    tariff_setting = db.query(SystemSetting).filter(SystemSetting.key == "ENERGY_TARIFF").first()
    co2_setting = db.query(SystemSetting).filter(SystemSetting.key == "CO2_EMISSION_FACTOR").first()
    
    tariff = float(tariff_setting.value) if tariff_setting else 8.0
    co2_factor = float(co2_setting.value) if co2_setting else 0.82
    what_if_engine.update_factors(tariff=tariff, co2_factor=co2_factor)
    
    result = what_if_engine.simulate(
        ac_hours_current=req.ac_hours_current,
        ac_hours_target=req.ac_hours_target,
        ac_count=req.ac_count,
        ac_power_kw=req.ac_power_kw,
        light_hours_current=req.light_hours_current,
        light_hours_target=req.light_hours_target,
        light_kw=req.light_kw,
        occupants_current=req.occupants_current,
        occupants_target=req.occupants_target,
        temp_setpoint_current=req.temp_setpoint_current,
        temp_setpoint_target=req.temp_setpoint_target,
        idle_reduction_percent=req.idle_reduction_percent
    )
    
    # Save simulation history
    sim_record = SimulationResult(
        scenario_name="What-If Facility Optimization",
        current_kwh=result["current_daily_kwh"],
        optimized_kwh=result["optimized_daily_kwh"],
        energy_saved_kwh=result["energy_saved_kwh"],
        cost_saved=result["cost_saved_inr"],
        co2_reduced_kg=result["co2_reduced_kg"],
        parameters_json=json.dumps(req.dict())
    )
    db.add(sim_record)
    db.commit()
    
    return SimulationResponse(**result)

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    assigned_room_id: Optional[int] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "USER"
    assigned_room_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    assigned_room_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Room Schemas
class RoomBase(BaseModel):
    room_number: str
    name: str
    floor: int
    building: str
    area_sqft: float
    baseline_power_kw: float
    is_monitored: bool = True

class RoomResponse(RoomBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class RoomLiveStatus(BaseModel):
    room_id: int
    room_number: str
    name: str
    floor: int
    current_power_kw: float
    voltage: float
    current_amp: float
    temperature: float
    occupancy: int
    ac_status: bool
    light_status: bool
    fan_status: bool
    computer_status: bool
    status: str  # NORMAL, WARNING, WASTAGE, CRITICAL
    risk_score: float
    active_anomaly_reason: Optional[str] = None
    last_updated: datetime

# Sensor Reading Schemas
class EnergyReadingCreate(BaseModel):
    room_id: int
    voltage: float = 230.0
    current: float = 0.0
    power_kw: float
    energy_kwh: float
    temperature: float
    occupancy: int
    ac_status: bool = False
    light_status: bool = False
    fan_status: bool = False
    computer_status: bool = False
    timestamp: Optional[datetime] = None

class EnergyReadingResponse(EnergyReadingCreate):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Dashboard KPI Schemas
class DashboardKPIs(BaseModel):
    today_consumption_kwh: float
    current_power_kw: float
    predicted_consumption_kwh: float
    estimated_cost: float
    potential_savings: float
    wastage_risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    wastage_risk_score: float
    total_active_rooms: int
    wastage_rooms_count: int
    unread_alerts_count: int
    co2_emissions_kg: float

# Prediction Schemas
class PredictionItem(BaseModel):
    timestamp: datetime
    predicted_kwh: float
    actual_kwh: Optional[float] = None
    horizon_type: str

class PredictionPageResponse(BaseModel):
    next_hour_kwh: float
    next_day_kwh: float
    model_name: str
    training_samples: int
    mae: float
    rmse: float
    r2_score: float
    explanation: str
    predictions: List[PredictionItem]

# Anomaly & Risk Schemas
class RiskFactorBreakdown(BaseModel):
    factor_name: str
    contribution_score: float
    description: str

class AnomalyResponse(BaseModel):
    id: int
    timestamp: datetime
    room_id: int
    room_number: str
    anomaly_score: float
    risk_score: float
    severity: str
    is_wastage: bool
    reason: str
    power_kw: float
    duration_hours: float
    wasted_kwh: float
    wasted_cost: float
    occupancy: Optional[int] = 0
    ac_status: Optional[bool] = False
    light_status: Optional[bool] = False
    factors: List[RiskFactorBreakdown] = []

    class Config:
        from_attributes = True

# Alert Schemas
class AlertResponse(BaseModel):
    id: int
    timestamp: datetime
    room_id: int
    room_number: str
    alert_type: str
    title: str
    message: str
    recommended_action: Optional[str]
    is_read: bool

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    is_read: Optional[bool] = None

# Recommendation Schemas
class RecommendationResponse(BaseModel):
    id: int
    timestamp: datetime
    room_id: int
    room_number: str
    category: str
    problem: str
    suggested_action: str
    estimated_kwh_saving: float
    estimated_cost_saving: float
    estimated_co2_saving: float
    status: str

    class Config:
        from_attributes = True

# What-If Simulation Schemas
class SimulationRequest(BaseModel):
    room_id: Optional[int] = None  # None for building-wide
    ac_hours_current: float = 8.0
    ac_hours_target: float = 5.0
    ac_count: int = 1
    ac_power_kw: float = 2.0
    
    light_hours_current: float = 10.0
    light_hours_target: float = 6.0
    light_kw: float = 0.4
    
    occupants_current: int = 100
    occupants_target: int = 70
    
    temp_setpoint_current: float = 22.0
    temp_setpoint_target: float = 24.0
    
    idle_reduction_percent: float = 20.0

class SimulationResponse(BaseModel):
    scenario_name: str
    current_daily_kwh: float
    optimized_daily_kwh: float
    energy_saved_kwh: float
    cost_saved_inr: float
    co2_reduced_kg: float
    percentage_saved: float
    breakdown_by_category: Dict[str, float]
    hourly_comparison: List[Dict[str, Any]]

# Smart Wastage Charge Schemas
class WastageChargeRequest(BaseModel):
    room_id: Optional[int] = None
    expected_kwh: Optional[float] = None
    actual_kwh: Optional[float] = None
    penalty_rate: Optional[float] = None

class WastageChargeResponse(BaseModel):
    id: Optional[int] = None
    room_number: str
    billing_period: str
    expected_kwh: float
    actual_kwh: float
    avoidable_excess_kwh: float
    penalty_rate: float
    simulated_charge_inr: float
    status: str
    disclaimer: str

# System Settings Schemas
class SettingItem(BaseModel):
    key: str
    value: str
    description: Optional[str]

class SettingUpdate(BaseModel):
    energy_tariff: Optional[float] = None
    co2_emission_factor: Optional[float] = None
    penalty_rate: Optional[float] = None
    wastage_threshold_kw: Optional[float] = None

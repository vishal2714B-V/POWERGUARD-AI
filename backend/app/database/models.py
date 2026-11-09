from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from backend.app.database.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="USER", nullable=False)  # ADMIN or USER
    assigned_room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    assigned_room = relationship("Room", foreign_keys=[assigned_room_id])

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    floor = Column(Integer, default=1)
    building = Column(String(100), default="Academic Block A")
    area_sqft = Column(Float, default=450.0)
    baseline_power_kw = Column(Float, default=0.2)  # Idle load
    is_monitored = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    readings = relationship("EnergyReading", back_populates="room", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="room", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="room", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="room", cascade="all, delete-orphan")
    wastage_charges = relationship("WastageCharge", back_populates="room", cascade="all, delete-orphan")

class Sensor(Base):
    __tablename__ = "sensors"
    
    id = Column(Integer, primary_key=True, index=True)
    sensor_uid = Column(String(64), unique=True, index=True, nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    sensor_type = Column(String(50), default="ENERGY_MULTI")
    status = Column(String(20), default="ONLINE")  # ONLINE, OFFLINE
    last_seen = Column(DateTime, default=datetime.utcnow)
    firmware_version = Column(String(20), default="v1.2.0")

class EnergyReading(Base):
    __tablename__ = "energy_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, default=datetime.utcnow)
    room_id = Column(Integer, ForeignKey("rooms.id"), index=True, nullable=False)
    
    voltage = Column(Float, default=230.0)
    current = Column(Float, default=0.0)
    power_kw = Column(Float, default=0.0)
    energy_kwh = Column(Float, default=0.0)
    temperature = Column(Float, default=25.0)
    occupancy = Column(Integer, default=0)
    
    # Appliance states
    ac_status = Column(Boolean, default=False)
    light_status = Column(Boolean, default=False)
    fan_status = Column(Boolean, default=False)
    computer_status = Column(Boolean, default=False)
    
    room = relationship("Room", back_populates="readings")

Index("idx_room_time", EnergyReading.room_id, EnergyReading.timestamp)

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    room_id = Column(Integer, ForeignKey("rooms.id"), index=True, nullable=True)  # Null if building-wide
    target_timestamp = Column(DateTime, index=True, nullable=False)
    predicted_kwh = Column(Float, nullable=False)
    actual_kwh = Column(Float, nullable=True)
    horizon_type = Column(String(20), default="NEXT_HOUR")  # NEXT_HOUR, DAILY
    model_version = Column(String(50), default="RandomForest_v1.0")
    confidence_score = Column(Float, default=0.92)

class Anomaly(Base):
    __tablename__ = "anomalies"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, default=datetime.utcnow)
    room_id = Column(Integer, ForeignKey("rooms.id"), index=True, nullable=False)
    anomaly_score = Column(Float, default=0.0)  # From IsolationForest
    risk_score = Column(Float, default=0.0)     # 0-100 score
    severity = Column(String(20), default="NORMAL")  # NORMAL, WARNING, WASTAGE, CRITICAL
    is_wastage = Column(Boolean, default=False)
    reason = Column(Text, nullable=False)
    power_kw = Column(Float, default=0.0)
    duration_hours = Column(Float, default=1.0)
    wasted_kwh = Column(Float, default=0.0)
    wasted_cost = Column(Float, default=0.0)
    
    room = relationship("Room", back_populates="anomalies")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, default=datetime.utcnow)
    room_id = Column(Integer, ForeignKey("rooms.id"), index=True, nullable=False)
    alert_type = Column(String(20), default="WARNING")  # CRITICAL, WARNING, INFO, OPTIMIZATION
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    
    room = relationship("Room", back_populates="alerts")

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, default=datetime.utcnow)
    room_id = Column(Integer, ForeignKey("rooms.id"), index=True, nullable=False)
    anomaly_id = Column(Integer, ForeignKey("anomalies.id"), nullable=True)
    category = Column(String(50), default="Turn off appliance")
    problem = Column(Text, nullable=False)
    suggested_action = Column(Text, nullable=False)
    estimated_kwh_saving = Column(Float, default=0.0)
    estimated_cost_saving = Column(Float, default=0.0)
    estimated_co2_saving = Column(Float, default=0.0)
    status = Column(String(20), default="PENDING")  # PENDING, APPLIED, DISMISSED
    
    room = relationship("Room", back_populates="recommendations")

class SimulationResult(Base):
    __tablename__ = "simulation_results"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    scenario_name = Column(String(100), default="Custom Scenario")
    current_kwh = Column(Float, nullable=False)
    optimized_kwh = Column(Float, nullable=False)
    energy_saved_kwh = Column(Float, nullable=False)
    cost_saved = Column(Float, nullable=False)
    co2_reduced_kg = Column(Float, nullable=False)
    parameters_json = Column(Text, nullable=True)

class WastageCharge(Base):
    __tablename__ = "wastage_charges"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    room_id = Column(Integer, ForeignKey("rooms.id"), index=True, nullable=False)
    billing_period = Column(String(50), default="Current Cycle")
    expected_kwh = Column(Float, nullable=False)
    actual_kwh = Column(Float, nullable=False)
    avoidable_excess_kwh = Column(Float, nullable=False)
    penalty_rate = Column(Float, default=10.0)  # ₹/kWh
    simulated_charge = Column(Float, nullable=False)
    notes = Column(Text, default="Simulated behavioural charge for excessive unoccupied consumption.")
    
    room = relationship("Room", back_populates="wastage_charges")

class SystemSetting(Base):
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True, nullable=False)
    value = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

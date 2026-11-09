import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "PowerGuard AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "powerguard-secret-super-secure-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./powerguard.db")
    
    # Configurable Energy & Cost Parameters
    DEFAULT_ENERGY_TARIFF: float = 8.0  # ₹ per kWh
    DEFAULT_CO2_EMISSION_FACTOR: float = 0.82  # kg CO2 per kWh
    DEFAULT_PENALTY_RATE: float = 10.0  # ₹ per avoidable kWh
    DEFAULT_WASTAGE_THRESHOLD: float = 1.8  # kW threshold for single unoccupied zone
    DEFAULT_ANOMALY_THRESHOLD: float = -0.15  # Isolation Forest decision threshold

settings = Settings()

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.config import settings
from backend.app.database.database import engine, Base
from backend.app.api import (
    auth, rooms, sensors, energy, predictions, anomalies,
    alerts, recommendations, simulation, wastage_charge, reports, settings as api_settings, demo
)
from iot.simulator.simulator import iot_simulator

# Create tables if not existing
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Launch IoT Simulator in background
    print("PowerGuard AI backend starting up...")
    iot_simulator.start()
    yield
    # Shutdown: Stop simulator
    print("PowerGuard AI backend shutting down...")
    iot_simulator.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Smart Energy Management System for Colleges, Hostels, and Institutional Buildings",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(rooms.router, prefix=settings.API_PREFIX)
app.include_router(sensors.router, prefix=settings.API_PREFIX)
app.include_router(energy.router, prefix=settings.API_PREFIX)
app.include_router(predictions.router, prefix=settings.API_PREFIX)
app.include_router(anomalies.router, prefix=settings.API_PREFIX)
app.include_router(alerts.router, prefix=settings.API_PREFIX)
app.include_router(recommendations.router, prefix=settings.API_PREFIX)
app.include_router(simulation.router, prefix=settings.API_PREFIX)
app.include_router(wastage_charge.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(api_settings.router, prefix=settings.API_PREFIX)
app.include_router(demo.router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "demo_mode": True
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "simulator_active": iot_simulator.running
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

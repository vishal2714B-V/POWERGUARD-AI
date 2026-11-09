import os
import sys
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database.database import engine, SessionLocal, Base
from backend.app.database.models import (
    User, Room, Sensor, EnergyReading, Prediction, Anomaly, Alert,
    Recommendation, WastageCharge, SystemSetting
)
from backend.app.services.auth_service import get_password_hash
from ml.anomaly_detection.detector import anomaly_detector
from ml.prediction.predictor import predictor
from backend.app.services.recommendation_service import recommendation_engine
from simulation.wastage_charge.calculator import wastage_charge_engine

def seed():
    print("Dropping and recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        print("Seeding system configuration settings...")
        settings_data = [
            ("ENERGY_TARIFF", "8.0", "Electricity tariff in INR (₹) per kWh"),
            ("CO2_EMISSION_FACTOR", "0.82", "Carbon emission factor in kg CO2 per kWh"),
            ("PENALTY_RATE", "10.0", "Simulated penalty charge in INR (₹) per avoidable wasted kWh"),
            ("WASTAGE_THRESHOLD_KW", "1.8", "Power threshold in kW flagged when occupancy is zero"),
            ("DEMO_MODE", "true", "Presentation demo mode toggle"),
        ]
        for key, val, desc in settings_data:
            db.add(SystemSetting(key=key, value=val, description=desc))

        print("Seeding rooms...")
        rooms_data = [
            {"id": 1, "room_number": "101", "name": "Computer Lab 1", "floor": 1, "building": "Academic Block A", "area_sqft": 650, "baseline_power_kw": 0.4},
            {"id": 2, "room_number": "102", "name": "Faculty Office", "floor": 1, "building": "Academic Block A", "area_sqft": 300, "baseline_power_kw": 0.15},
            {"id": 3, "room_number": "103", "name": "Lecture Hall A", "floor": 1, "building": "Academic Block A", "area_sqft": 900, "baseline_power_kw": 0.3},
            {"id": 4, "room_number": "104", "name": "Seminar Room", "floor": 1, "building": "Academic Block A", "area_sqft": 450, "baseline_power_kw": 0.25},
            {"id": 5, "room_number": "201", "name": "Electronics Lab", "floor": 2, "building": "Academic Block A", "area_sqft": 550, "baseline_power_kw": 0.5},
            {"id": 6, "room_number": "202", "name": "Library Reading Room", "floor": 2, "building": "Academic Block A", "area_sqft": 800, "baseline_power_kw": 0.35},
            {"id": 7, "room_number": "203", "name": "Conference Hall", "floor": 2, "building": "Academic Block A", "area_sqft": 600, "baseline_power_kw": 0.25},
            {"id": 8, "room_number": "204", "name": "Executive Boardroom", "floor": 2, "building": "Academic Block A", "area_sqft": 500, "baseline_power_kw": 0.2},
        ]
        for r in rooms_data:
            db.add(Room(**r))
        db.commit()

        print("Seeding users (Admin and Regular User)...")
        users_data = [
            {
                "username": "admin",
                "email": "admin@powerguard.edu",
                "hashed_password": get_password_hash("admin123"),
                "role": "ADMIN",
                "assigned_room_id": None
            },
            {
                "username": "user",
                "email": "faculty@powerguard.edu",
                "hashed_password": get_password_hash("user123"),
                "role": "USER",
                "assigned_room_id": 8  # Assigned to Room 204
            },
            {
                "username": "lab_incharge",
                "email": "lab@powerguard.edu",
                "hashed_password": get_password_hash("user123"),
                "role": "USER",
                "assigned_room_id": 1  # Assigned to Room 101
            }
        ]
        for u in users_data:
            db.add(User(**u))
        db.commit()

        print("Seeding sensors...")
        for r in rooms_data:
            db.add(Sensor(
                sensor_uid=f"PG-NODE-{r['room_number']}",
                room_id=r["id"],
                sensor_type="MULTI_SENSOR_IOT",
                status="ONLINE",
                last_seen=datetime.utcnow(),
                firmware_version="v2.4.1"
            ))
        db.commit()

        # Load historical dataset into energy_readings
        dataset_path = "ml/datasets/powerguard_dataset.csv"
        if os.path.exists(dataset_path):
            print("Populating database with 60 days of historical energy readings from dataset...")
            df = pd.read_csv(dataset_path)
            # Take recent 2000 records or all for rich charts
            # For optimal speed and rich charts, load the last 14 days (14 * 24 * 8 = 2688 records)
            recent_df = df.tail(2688)
            readings = []
            for _, row in recent_df.iterrows():
                readings.append(EnergyReading(
                    timestamp=pd.to_datetime(row["timestamp"]),
                    room_id=int(row["room_id"]),
                    voltage=float(row["voltage"]),
                    current=float(row["current"]),
                    power_kw=float(row["power_kw"]),
                    energy_kwh=float(row["energy_kwh"]),
                    temperature=float(row["temperature"]),
                    occupancy=int(row["occupancy"]),
                    ac_status=bool(row["ac_status"]),
                    light_status=bool(row["light_status"]),
                    fan_status=bool(row["fan_status"]),
                    computer_status=bool(row["computer_status"])
                ))
            db.bulk_save_objects(readings)
            db.commit()
            print(f"Inserted {len(readings)} historical sensor readings.")

        # Seed CURRENT LIVE readings for all rooms matching the required demo flow!
        # Room 101 -> NORMAL (Occ 18, Temp 24.2, AC ON, Power 1.8 kW)
        # Room 102 -> NORMAL (Occ 4, Temp 24.8, AC ON, Power 1.5 kW)
        # Room 103 -> WARNING (Occ 62, Temp 26.5, High load)
        # Room 204 -> WASTAGE (Occ 0, Temp 29.0, AC ON, Power 2.4 kW)
        print("Seeding live status readings...")
        now = datetime.utcnow()
        live_samples = [
            {"room_id": 1, "v": 231.2, "i": 8.2, "p": 1.79, "kwh": 1420.5, "t": 24.2, "occ": 18, "ac": True, "light": True, "fan": True, "comp": True},
            {"room_id": 2, "v": 229.8, "i": 6.8, "p": 1.48, "kwh": 890.2, "t": 24.8, "occ": 4, "ac": True, "light": True, "fan": False, "comp": True},
            {"room_id": 3, "v": 230.1, "i": 13.5, "p": 2.95, "kwh": 2150.0, "t": 26.5, "occ": 62, "ac": True, "light": True, "fan": True, "comp": False},
            {"room_id": 4, "v": 230.0, "i": 0.9, "p": 0.20, "kwh": 410.1, "t": 25.0, "occ": 0, "ac": False, "light": False, "fan": False, "comp": False},
            {"room_id": 5, "v": 228.9, "i": 14.1, "p": 3.06, "kwh": 1980.4, "t": 27.0, "occ": 22, "ac": True, "light": True, "fan": True, "comp": True},
            {"room_id": 6, "v": 230.5, "i": 7.5, "p": 1.64, "kwh": 1320.8, "t": 24.0, "occ": 35, "ac": True, "light": True, "fan": False, "comp": False},
            {"room_id": 7, "v": 230.2, "i": 1.1, "p": 0.24, "kwh": 550.0, "t": 24.5, "occ": 0, "ac": False, "light": False, "fan": False, "comp": False},
            # ROOM 204: KEY WASTAGE ROOM
            {"room_id": 8, "v": 230.4, "i": 11.0, "p": 2.40, "kwh": 1860.2, "t": 29.0, "occ": 0, "ac": True, "light": True, "fan": False, "comp": False},
        ]
        
        for s in live_samples:
            db.add(EnergyReading(
                timestamp=now,
                room_id=s["room_id"],
                voltage=s["v"],
                current=s["i"],
                power_kw=s["p"],
                energy_kwh=s["kwh"],
                temperature=s["t"],
                occupancy=s["occ"],
                ac_status=s["ac"],
                light_status=s["light"],
                fan_status=s["fan"],
                computer_status=s["comp"]
            ))
        db.commit()

        # Seed Anomaly & Wastage events using the Anomaly Detector
        print("Analyzing and seeding detected wastage events...")
        # Analyze Room 204 specifically
        analysis_204 = anomaly_detector.analyze_reading(
            power_kw=2.40, occupancy=0, temperature=29.0, ac_status=True, light_status=True,
            hour=now.hour, baseline_kw=0.2, expected_kw=0.25, duration_hours=2.0
        )
        
        anom_204 = Anomaly(
            timestamp=now - timedelta(hours=2),
            room_id=8,
            anomaly_score=analysis_204["anomaly_score"],
            risk_score=82.0,  # Exactly matching the prompt: "Risk: 82 / 100, CRITICAL, WASTAGE DETECTED"
            severity="CRITICAL",
            is_wastage=True,
            reason="High AC consumption detected while room is unoccupied.",
            power_kw=2.40,
            duration_hours=2.0,
            wasted_kwh=4.80,
            wasted_cost=38.40
        )
        db.add(anom_204)
        
        # Analyze Room 103 (Warning: consumption above predicted)
        anom_103 = Anomaly(
            timestamp=now - timedelta(hours=1),
            room_id=3,
            anomaly_score=-0.08,
            risk_score=42.0,
            severity="WARNING",
            is_wastage=False,
            reason="Room consumption is 18% above typical historical baseline.",
            power_kw=2.95,
            duration_hours=1.0,
            wasted_kwh=0.85,
            wasted_cost=6.80
        )
        db.add(anom_103)
        db.commit()

        # Seed Alerts from Section 9
        print("Seeding alerts...")
        alerts_data = [
            {
                "timestamp": now - timedelta(minutes=45),
                "room_id": 8,
                "alert_type": "CRITICAL",
                "title": "Severe Wastage in Room 204",
                "message": "Room 204 has high consumption (2.4 kW) while completely unoccupied.",
                "recommended_action": "Turn OFF the AC and zone lighting immediately.",
                "is_read": False
            },
            {
                "timestamp": now - timedelta(hours=2),
                "room_id": 3,
                "alert_type": "WARNING",
                "title": "High Load in Lecture Hall A",
                "message": "Building consumption is 18% above predicted usage in Lecture Hall A.",
                "recommended_action": "Check setpoint temperature and ventilation fan controls.",
                "is_read": False
            },
            {
                "timestamp": now - timedelta(hours=4),
                "room_id": 1,
                "alert_type": "OPTIMIZATION",
                "title": "Energy Optimization Opportunity",
                "message": "Computer Lab 1 can save 3.2 kWh by enabling auto-sleep on 15 idle terminals.",
                "recommended_action": "Push group-policy sleep state to lab computers.",
                "is_read": False
            },
            {
                "timestamp": now - timedelta(days=1),
                "room_id": 5,
                "alert_type": "INFO",
                "title": "Scheduled Sensor Health Check",
                "message": "Electronics Lab IoT node heartbeat reported nominal telemetry.",
                "recommended_action": "No action needed.",
                "is_read": True
            }
        ]
        for a in alerts_data:
            db.add(Alert(**a))
        db.commit()

        # Seed Recommendations from Section 2.E & 7
        print("Seeding AI recommendations...")
        recs = recommendation_engine.generate_recommendations(
            room_id=8, room_number="204", power_kw=2.4, occupancy=0, temperature=29.0,
            ac_status=True, light_status=True, fan_status=False
        )
        for r in recs:
            db.add(Recommendation(
                timestamp=now - timedelta(minutes=40),
                room_id=r["room_id"],
                anomaly_id=anom_204.id,
                category=r["category"],
                problem=r["problem"],
                suggested_action=r["suggested_action"],
                estimated_kwh_saving=r["estimated_kwh_saving"],
                estimated_cost_saving=r["estimated_cost_saving"],
                estimated_co2_saving=r["estimated_co2_saving"],
                status="PENDING"
            ))
        db.commit()

        # Seed Predictions for next 24 hours
        print("Seeding ML predictions...")
        future_preds = predictor.predict_future_timeline(start_time=now, current_power=14.5, hours_ahead=24)
        for p in future_preds:
            db.add(Prediction(
                timestamp=now,
                room_id=None,  # Facility wide
                target_timestamp=datetime.fromisoformat(p["timestamp"]),
                predicted_kwh=round(p["predicted_kwh"] * 8.0, 2),  # Scaled for entire block
                actual_kwh=None,
                horizon_type="NEXT_HOUR" if p["hour"] == (now.hour + 1) % 24 else "DAILY",
                model_version="RandomForestRegressor_v1.0",
                confidence_score=0.96
            ))
        db.commit()

        # Seed Smart Wastage Charges from Section 11
        print("Seeding Simulated Smart Wastage Charges...")
        charge = wastage_charge_engine.calculate_charge(
            expected_kwh=400.0,
            actual_kwh=450.0,
            penalty_rate=10.0,
            room_number="Room 204",
            billing_period="October 2026 Cycle"
        )
        db.add(WastageCharge(
            timestamp=now,
            room_id=8,
            billing_period=charge["billing_period"],
            expected_kwh=charge["expected_kwh"],
            actual_kwh=charge["actual_kwh"],
            avoidable_excess_kwh=charge["avoidable_excess_kwh"],
            penalty_rate=charge["penalty_rate"],
            simulated_charge=charge["simulated_charge_inr"],
            notes=charge["disclaimer"]
        ))
        db.commit()

        print("\nDatabase seeded successfully!")
        print("Default Accounts:")
        print("  Admin: username='admin', password='admin123'")
        print("  User:  username='user',  password='user123' (assigned to Room 204)")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()

import os
import math
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_energy_dataset(output_path="ml/datasets/powerguard_dataset.csv", num_days=60):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    random.seed(42)
    np.random.seed(42)
    
    start_date = datetime.now() - timedelta(days=num_days)
    rooms = [
        {"id": 1, "room_number": "101", "name": "Computer Lab 1", "capacity": 40, "base_kw": 0.4},
        {"id": 2, "room_number": "102", "name": "Faculty Office", "capacity": 6, "base_kw": 0.15},
        {"id": 3, "room_number": "103", "name": "Lecture Hall A", "capacity": 80, "base_kw": 0.3},
        {"id": 4, "room_number": "104", "name": "Seminar Room", "capacity": 50, "base_kw": 0.25},
        {"id": 5, "room_number": "201", "name": "Electronics Lab", "capacity": 30, "base_kw": 0.5},
        {"id": 6, "room_number": "202", "name": "Library Reading Room", "capacity": 60, "base_kw": 0.35},
        {"id": 7, "room_number": "203", "name": "Conference Hall", "capacity": 45, "base_kw": 0.3},
        {"id": 8, "room_number": "204", "name": "Executive Boardroom / Suite", "capacity": 25, "base_kw": 0.2},
    ]
    
    records = []
    total_hours = num_days * 24
    
    for r in rooms:
        cumulative_kwh = round(random.uniform(500, 2000), 2)
        for h in range(total_hours):
            current_time = start_date + timedelta(hours=h)
            hour = current_time.hour
            weekday = current_time.weekday()  # 0=Monday, 6=Sunday
            is_weekend = 1 if weekday >= 5 else 0
            
            # Ambient temperature cycle (peaks around 14:00 - 15:00)
            daily_temp_swing = 7.0 * math.sin((hour - 9) * math.pi / 12)
            seasonal_temp = 28.0 + random.uniform(-1.5, 1.5)
            temperature = round(max(20.0, seasonal_temp + daily_temp_swing), 1)
            
            # College/Office Working hours: 08:00 to 18:00
            is_working_hour = 1 if (8 <= hour <= 18 and not is_weekend) else 0
            is_evening = 1 if (18 < hour <= 21 and not is_weekend) else 0
            
            # Occupancy probability
            if is_working_hour:
                occupancy = int(random.gauss(r["capacity"] * 0.75, r["capacity"] * 0.15))
                occupancy = max(2, min(r["capacity"], occupancy))
            elif is_evening:
                occupancy = int(random.uniform(0, r["capacity"] * 0.2))
            else:
                occupancy = 0
            
            # Appliance states
            # Room 204 has intentional recurring wastage scenarios (AC running while unoccupied)
            is_room_204_wastage_scenario = (
                r["room_number"] == "204" and 
                (h % 72 in [18, 19, 20, 21, 22, 23]) and 
                occupancy == 0
            )
            # Occasional random wastage in other rooms (1.5% chance)
            is_random_wastage = (random.random() < 0.015 and occupancy == 0 and hour > 19)
            
            if occupancy > 0:
                ac_status = 1 if temperature > 25.5 else (1 if random.random() < 0.6 else 0)
                light_status = 1
                fan_status = 1 if temperature > 24 else 0
                computer_status = 1 if ("Lab" in r["name"] or "Office" in r["name"]) else 0
            else:
                if is_room_204_wastage_scenario or is_random_wastage:
                    ac_status = 1  # Wasted AC!
                    light_status = 1 if random.random() < 0.5 else 0
                    fan_status = 0
                    computer_status = 1 if random.random() < 0.3 else 0
                else:
                    ac_status = 0
                    light_status = 0
                    fan_status = 0
                    computer_status = 0
                    
            # Power calculation (kW)
            # Base idle load + active equipment
            power = r["base_kw"]
            if ac_status:
                # AC consumes between 1.5 kW and 2.4 kW depending on ambient temp
                power += 1.6 + 0.05 * max(0.0, temperature - 24.0) + random.uniform(-0.1, 0.15)
            if light_status:
                power += 0.01 * min(occupancy + 5, r["capacity"]) + 0.15
            if fan_status:
                power += 0.075 * min(4, max(1, occupancy // 5))
            if computer_status:
                power += 0.12 * max(1, min(occupancy, 25))
                
            # Voltage and Current (P = V * I * pf, pf ~ 0.95)
            voltage = round(random.gauss(230.0, 3.5), 1)
            power_factor = 0.95
            current = round((power * 1000) / (voltage * power_factor), 2)
            power = round(power, 3)
            
            # Energy delta (kWh for 1 hour)
            energy_delta = round(power * 1.0, 3)
            cumulative_kwh += energy_delta
            cumulative_kwh = round(cumulative_kwh, 3)
            
            # Is Anomaly / Wastage flag
            is_wastage = 1 if (occupancy == 0 and (ac_status == 1 or power > (r["base_kw"] + 1.2))) else 0
            
            records.append({
                "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                "room_id": r["id"],
                "room_number": r["room_number"],
                "voltage": voltage,
                "current": current,
                "power_kw": power,
                "energy_kwh": cumulative_kwh,
                "hourly_kwh": energy_delta,
                "temperature": temperature,
                "occupancy": occupancy,
                "ac_status": ac_status,
                "light_status": light_status,
                "fan_status": fan_status,
                "computer_status": computer_status,
                "is_wastage": is_wastage
            })
            
    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} records across {len(rooms)} rooms over {num_days} days at: {output_path}")
    return df

if __name__ == "__main__":
    generate_energy_dataset()

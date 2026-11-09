import time
import random
import threading
import requests
from datetime import datetime
from typing import Dict, Any, List

class IoTSimulator:
    def __init__(self, api_base_url: str = "http://localhost:8000/api", interval_seconds: int = 5):
        self.api_base_url = api_base_url
        self.interval_seconds = interval_seconds
        self.running = False
        self.thread = None
        self.demo_mode = True
        
        # State tracking per room
        self.rooms_state = {
            1: {"room_number": "101", "name": "Computer Lab 1", "occ": 18, "temp": 24.2, "ac": True, "light": True, "fan": True, "comp": True, "base_kw": 0.4},
            2: {"room_number": "102", "name": "Faculty Office", "occ": 4, "temp": 24.8, "ac": True, "light": True, "fan": False, "comp": True, "base_kw": 0.15},
            3: {"room_number": "103", "name": "Lecture Hall A", "occ": 62, "temp": 26.5, "ac": True, "light": True, "fan": True, "comp": False, "base_kw": 0.3},
            4: {"room_number": "104", "name": "Seminar Room", "occ": 0, "temp": 25.0, "ac": False, "light": False, "fan": False, "comp": False, "base_kw": 0.2},
            5: {"room_number": "201", "name": "Electronics Lab", "occ": 22, "temp": 27.0, "ac": True, "light": True, "fan": True, "comp": True, "base_kw": 0.5},
            6: {"room_number": "202", "name": "Library Reading Room", "occ": 35, "temp": 24.0, "ac": True, "light": True, "fan": False, "comp": False, "base_kw": 0.35},
            7: {"room_number": "203", "name": "Conference Hall", "occ": 0, "temp": 24.5, "ac": False, "light": False, "fan": False, "comp": False, "base_kw": 0.25},
            # ROOM 204: KEY DEMO WASTAGE ROOM (Unoccupied + AC ON + 2.4 kW)
            8: {"room_number": "204", "name": "Executive Boardroom", "occ": 0, "temp": 29.0, "ac": True, "light": True, "fan": False, "comp": False, "base_kw": 0.2},
        }

    def set_room_override(self, room_id: int, **kwargs):
        if room_id in self.rooms_state:
            self.rooms_state[room_id].update(kwargs)

    def trigger_wastage_scenario_204(self):
        """Predefined Scenario 2: Severe AC Wastage in Room 204"""
        self.set_room_override(8, occ=0, temp=29.0, ac=True, light=True)

    def trigger_normal_scenario(self):
        """Predefined Scenario 1: Normal operational profile"""
        self.set_room_override(8, occ=12, temp=24.0, ac=True, light=True)
        self.set_room_override(1, occ=20, temp=24.0, ac=True, light=True)

    def generate_current_reading(self, room_id: int) -> Dict[str, Any]:
        state = self.rooms_state.get(room_id, {
            "room_number": str(room_id), "name": f"Room {room_id}", "occ": 0,
            "temp": 25.0, "ac": False, "light": False, "fan": False, "comp": False, "base_kw": 0.25
        })
        
        # Calculate dynamic power with realistic appliance loads
        power = state["base_kw"]
        
        # AC consumption (1.8 to 2.4 kW)
        if state["ac"]:
            temp_stress = max(0.0, state["temp"] - 24.0) * 0.05
            ac_power = 2.0 + temp_stress + random.uniform(-0.08, 0.12)
            power += ac_power
            
        # Lighting load
        if state["light"]:
            power += 0.35 + random.uniform(-0.02, 0.02)
            
        # Fans
        if state["fan"]:
            power += 0.15 + random.uniform(-0.01, 0.01)
            
        # Computers / electronics
        if state["comp"]:
            power += (0.12 * max(1, min(state["occ"], 20))) + random.uniform(-0.05, 0.05)

        # Fluctuations
        voltage = round(random.gauss(230.0, 2.5), 1)
        pf = 0.95
        power = max(0.05, round(power, 3))
        current = round((power * 1000) / (voltage * pf), 2)
        
        return {
            "room_id": room_id,
            "room_number": state["room_number"],
            "voltage": voltage,
            "current": current,
            "power_kw": power,
            "energy_kwh": round(power * (self.interval_seconds / 3600.0), 4),
            "temperature": round(state["temp"] + random.uniform(-0.2, 0.2), 1),
            "occupancy": state["occ"],
            "ac_status": state["ac"],
            "light_status": state["light"],
            "fan_status": state["fan"],
            "computer_status": state["comp"],
            "timestamp": datetime.utcnow().isoformat()
        }

    def push_readings(self):
        for room_id in self.rooms_state.keys():
            reading = self.generate_current_reading(room_id)
            try:
                requests.post(f"{self.api_base_url}/sensors/ingest", json=reading, timeout=3.0)
            except Exception:
                # Backend might be initializing or busy
                pass

    def run_loop(self):
        while self.running:
            self.push_readings()
            time.sleep(self.interval_seconds)

    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self.run_loop, daemon=True)
            self.thread.start()
            print("IoT Simulator background thread started.")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
        print("IoT Simulator stopped.")

iot_simulator = IoTSimulator()

from typing import Dict, Any, List
from backend.app.config import settings

class RecommendationEngine:
    def __init__(self, tariff: float = None, co2_factor: float = None):
        self.tariff = tariff or settings.DEFAULT_ENERGY_TARIFF
        self.co2_factor = co2_factor or settings.DEFAULT_CO2_EMISSION_FACTOR

    def update_factors(self, tariff: float, co2_factor: float):
        if tariff is not None:
            self.tariff = tariff
        if co2_factor is not None:
            self.co2_factor = co2_factor

    def generate_recommendations(self, room_id: int, room_number: str, 
                                 power_kw: float, occupancy: int, temperature: float,
                                 ac_status: bool, light_status: bool, fan_status: bool,
                                 baseline_kw: float = 0.25) -> List[Dict[str, Any]]:
        recommendations = []
        
        # Recommendation 1: Zero occupancy with AC active (Highest impact)
        if occupancy == 0 and ac_status:
            # AC typically consumes ~2.0-2.4 kW. If left on overnight or during idle 4 hours:
            hours_saved = 4.0
            kw_saved = max(1.6, power_kw - baseline_kw)
            kwh_saving_day = round(kw_saved * hours_saved, 2)
            cost_saving_day = round(kwh_saving_day * self.tariff, 2)
            co2_saving_day = round(kwh_saving_day * self.co2_factor, 2)
            
            recommendations.append({
                "room_id": room_id,
                "room_number": room_number,
                "category": "Turn off appliance",
                "problem": f"Room {room_number} is currently unoccupied while the AC is drawing {power_kw:.2f} kW.",
                "suggested_action": f"Immediately turn OFF the air conditioning unit in Room {room_number} or activate automated occupancy shut-off.",
                "estimated_kwh_saving": kwh_saving_day,
                "estimated_cost_saving": cost_saving_day,
                "estimated_co2_saving": co2_saving_day,
                "status": "PENDING"
            })

        # Recommendation 2: Zero occupancy with lighting active
        if occupancy == 0 and light_status:
            hours_saved = 6.0
            kw_saved = 0.35
            kwh_saving_day = round(kw_saved * hours_saved, 2)
            cost_saving_day = round(kwh_saving_day * self.tariff, 2)
            co2_saving_day = round(kwh_saving_day * self.co2_factor, 2)
            
            recommendations.append({
                "room_id": room_id,
                "room_number": room_number,
                "category": "Avoid unnecessary lighting",
                "problem": f"Zone lights remain ON in empty Room {room_number}.",
                "suggested_action": "Switch off perimeter and classroom luminaires or install PIR motion sensors.",
                "estimated_kwh_saving": kwh_saving_day,
                "estimated_cost_saving": cost_saving_day,
                "estimated_co2_saving": co2_saving_day,
                "status": "PENDING"
            })

        # Recommendation 3: Low Temperature Setpoint optimization
        if ac_status and temperature < 23.0 and occupancy > 0:
            # Raising setpoint by 2°C (e.g. from 21°C to 24°C) saves ~12-18% of compressor load
            kwh_saving_day = round(power_kw * 0.15 * 8.0, 2)
            cost_saving_day = round(kwh_saving_day * self.tariff, 2)
            co2_saving_day = round(kwh_saving_day * self.co2_factor, 2)
            
            recommendations.append({
                "room_id": room_id,
                "room_number": room_number,
                "category": "Reduce temperature setpoint",
                "problem": f"AC cooling setpoint is overchilled (ambient {temperature:.1f}°C).",
                "suggested_action": "Adjust thermostat setpoint to Bureau of Energy Efficiency (BEE) recommended 24°C.",
                "estimated_kwh_saving": kwh_saving_day,
                "estimated_cost_saving": cost_saving_day,
                "estimated_co2_saving": co2_saving_day,
                "status": "PENDING"
            })

        # Recommendation 4: Optimization for high sustained baseline
        if power_kw > 3.0 and occupancy < 10:
            kwh_saving_day = round(1.2 * 5.0, 2)
            cost_saving_day = round(kwh_saving_day * self.tariff, 2)
            co2_saving_day = round(kwh_saving_day * self.co2_factor, 2)
            recommendations.append({
                "room_id": room_id,
                "room_number": room_number,
                "category": "Optimize high-consumption appliances",
                "problem": f"Elevated load profile ({power_kw:.2f} kW) during off-peak utilization.",
                "suggested_action": "Stagger equipment startup and enable auto-sleep on peripheral electronics.",
                "estimated_kwh_saving": kwh_saving_day,
                "estimated_cost_saving": cost_saving_day,
                "estimated_co2_saving": co2_saving_day,
                "status": "PENDING"
            })

        return recommendations

recommendation_engine = RecommendationEngine()

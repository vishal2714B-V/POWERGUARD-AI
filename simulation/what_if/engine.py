from typing import Dict, Any, List
from backend.app.config import settings

class WhatIfSimulationEngine:
    def __init__(self, tariff: float = None, co2_factor: float = None):
        self.tariff = tariff or settings.DEFAULT_ENERGY_TARIFF
        self.co2_factor = co2_factor or settings.DEFAULT_CO2_EMISSION_FACTOR

    def update_factors(self, tariff: float = None, co2_factor: float = None):
        if tariff is not None:
            self.tariff = tariff
        if co2_factor is not None:
            self.co2_factor = co2_factor

    def simulate(self, 
                 ac_hours_current: float = 8.0, ac_hours_target: float = 5.0,
                 ac_count: int = 1, ac_power_kw: float = 2.0,
                 light_hours_current: float = 10.0, light_hours_target: float = 6.0,
                 light_kw: float = 0.4,
                 occupants_current: int = 100, occupants_target: int = 70,
                 temp_setpoint_current: float = 22.0, temp_setpoint_target: float = 24.0,
                 idle_reduction_percent: float = 20.0) -> Dict[str, Any]:
        """
        Physics-based What-If simulation calculating before vs after daily energy, monetary savings, and carbon reduction.
        """
        # Baseline idle load: ~1.5 kW constant building idle
        base_idle_kwh_current = 1.5 * 24.0
        base_idle_kwh_optimized = base_idle_kwh_current * (1.0 - (idle_reduction_percent / 100.0))
        
        # AC Consumption Calculation
        # Raising setpoint by 1 deg C reduces compressor load by ~6%
        temp_delta = max(0.0, temp_setpoint_target - temp_setpoint_current)
        cooling_efficiency_factor = max(0.70, 1.0 - (temp_delta * 0.06))
        
        ac_kwh_current = ac_count * ac_power_kw * ac_hours_current
        ac_kwh_optimized = ac_count * (ac_power_kw * cooling_efficiency_factor) * ac_hours_target
        
        # Lighting Calculation
        light_kwh_current = light_kw * light_hours_current
        light_kwh_optimized = light_kw * light_hours_target
        
        # Peripheral & Miscellaneous Load (Computers, projectors, chargers scaled by occupancy)
        # 0.08 kW per occupant
        misc_kwh_current = (occupants_current * 0.08) * min(ac_hours_current, 8.0)
        misc_kwh_optimized = (occupants_target * 0.08) * min(ac_hours_target, 8.0)
        
        total_current_kwh = round(base_idle_kwh_current + ac_kwh_current + light_kwh_current + misc_kwh_current, 2)
        total_optimized_kwh = round(base_idle_kwh_optimized + ac_kwh_optimized + light_kwh_optimized + misc_kwh_optimized, 2)
        
        energy_saved_kwh = round(max(0.0, total_current_kwh - total_optimized_kwh), 2)
        cost_saved_inr = round(energy_saved_kwh * self.tariff, 2)
        co2_reduced_kg = round(energy_saved_kwh * self.co2_factor, 2)
        pct_saved = round((energy_saved_kwh / total_current_kwh * 100.0) if total_current_kwh > 0 else 0.0, 1)
        
        category_breakdown = {
            "AC Cooling": round(max(0.0, ac_kwh_current - ac_kwh_optimized), 2),
            "Lighting": round(max(0.0, light_kwh_current - light_kwh_optimized), 2),
            "Occupancy / Equipment": round(max(0.0, misc_kwh_current - misc_kwh_optimized), 2),
            "Idle Power Elimination": round(max(0.0, base_idle_kwh_current - base_idle_kwh_optimized), 2),
        }
        
        # Generate 24-hour comparative curve
        hourly_curve = []
        for h in range(24):
            # Baseline curve distribution
            is_active_current = (8 <= h < (8 + int(ac_hours_current)))
            is_active_target = (8 <= h < (8 + int(ac_hours_target)))
            
            h_curr = (base_idle_kwh_current / 24.0) + ((ac_kwh_current + light_kwh_current + misc_kwh_current) / max(1.0, ac_hours_current) if is_active_current else 0.0)
            h_opt = (base_idle_kwh_optimized / 24.0) + ((ac_kwh_optimized + light_kwh_optimized + misc_kwh_optimized) / max(1.0, ac_hours_target) if is_active_target else 0.0)
            
            hourly_curve.append({
                "hour": f"{h:02d}:00",
                "current_kwh": round(h_curr, 2),
                "optimized_kwh": round(h_opt, 2),
                "saving_kwh": round(max(0.0, h_curr - h_opt), 2)
            })

        return {
            "scenario_name": "Facility Optimization Simulation",
            "current_daily_kwh": total_current_kwh,
            "optimized_daily_kwh": total_optimized_kwh,
            "energy_saved_kwh": energy_saved_kwh,
            "cost_saved_inr": cost_saved_inr,
            "co2_reduced_kg": co2_reduced_kg,
            "percentage_saved": pct_saved,
            "breakdown_by_category": category_breakdown,
            "hourly_comparison": hourly_curve
        }

what_if_engine = WhatIfSimulationEngine()

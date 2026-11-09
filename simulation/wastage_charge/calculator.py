from typing import Dict, Any
from backend.app.config import settings

class SmartWastageChargeEngine:
    def __init__(self, penalty_rate: float = None):
        self.penalty_rate = penalty_rate or settings.DEFAULT_PENALTY_RATE

    def update_penalty_rate(self, rate: float):
        if rate is not None and rate >= 0:
            self.penalty_rate = rate

    def calculate_charge(self, expected_kwh: float, actual_kwh: float, 
                         penalty_rate: float = None, room_number: str = "Whole Facility",
                         billing_period: str = "Current Billing Cycle") -> Dict[str, Any]:
        """
        Calculates Simulated Smart Wastage Charge.
        Formula:
        Avoidable Excess = max(0, actual_kwh - expected_kwh)
        Simulated Smart Wastage Charge = Avoidable Excess * Penalty Rate
        """
        active_rate = penalty_rate if penalty_rate is not None else self.penalty_rate
        avoidable_excess = max(0.0, round(actual_kwh - expected_kwh, 2))
        simulated_charge = round(avoidable_excess * active_rate, 2)
        
        status = "COMPLIANT"
        if avoidable_excess > 100.0:
            status = "CRITICAL_EXCESS"
        elif avoidable_excess > 20.0:
            status = "EXCESS_WASTAGE"
        elif avoidable_excess > 0.0:
            status = "MINOR_EXCESS"
            
        return {
            "room_number": room_number,
            "billing_period": billing_period,
            "expected_kwh": round(expected_kwh, 2),
            "actual_kwh": round(actual_kwh, 2),
            "avoidable_excess_kwh": avoidable_excess,
            "penalty_rate": active_rate,
            "simulated_charge_inr": simulated_charge,
            "status": status,
            "disclaimer": "SIMULATED SMART WASTAGE CHARGE: This is a simulated behavioural charge intended to encourage responsible energy usage. It is not an actual electricity bill."
        }

wastage_charge_engine = SmartWastageChargeEngine()

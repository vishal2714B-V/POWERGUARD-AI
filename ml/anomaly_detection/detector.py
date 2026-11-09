import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

class AnomalyDetector:
    def __init__(self):
        self.iso_forest = None
        self.scaler = None
        self.feature_names = None
        self.load_model()
        
    def load_model(self):
        model_path = os.path.join(MODELS_DIR, "isolation_forest.joblib")
        scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
        features_path = os.path.join(MODELS_DIR, "anomaly_features.joblib")
        
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            self.iso_forest = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self.feature_names = joblib.load(features_path) if os.path.exists(features_path) else [
                "power_kw", "occupancy", "temperature", "ac_status", "light_status", "hour"
            ]

    def is_ready(self) -> bool:
        return self.iso_forest is not None and self.scaler is not None

    def analyze_reading(self, power_kw: float, occupancy: int, temperature: float,
                        ac_status: bool, light_status: bool, hour: int,
                        baseline_kw: float = 0.25, expected_kw: float = None,
                        duration_hours: float = 1.0) -> Dict[str, Any]:
        """
        Analyzes real-time sensor reading using Isolation Forest + Domain-Rule Validation + Risk Scorer
        """
        if not self.is_ready():
            self.load_model()
            
        # 1. Isolation Forest Anomaly Score
        # Raw decision_function: lower means more anomalous (negative values are typically anomalous)
        if self.is_ready():
            features = pd.DataFrame([{
                "power_kw": power_kw,
                "occupancy": occupancy,
                "temperature": temperature,
                "ac_status": int(ac_status),
                "light_status": int(light_status),
                "hour": hour
            }])[self.feature_names]
            
            scaled = self.scaler.transform(features)
            raw_anomaly_score = float(self.iso_forest.decision_function(scaled)[0])
            is_iforest_anomaly = bool(self.iso_forest.predict(scaled)[0] == -1)
        else:
            raw_anomaly_score = 0.05
            is_iforest_anomaly = False

        # 2. Domain Expert Rule Checking & Wastage Reasons
        reasons = []
        is_wastage = False
        factors: List[Dict[str, Any]] = []
        
        # Risk score accumulator (0 to 100)
        risk_score = 10.0  # nominal baseline
        
        # Condition 1: Room Unoccupied + AC ON (Severe Wastage)
        if occupancy == 0 and ac_status:
            is_wastage = True
            risk_score += 48.0
            reasons.append("High AC consumption detected while room is completely unoccupied")
            factors.append({
                "factor_name": "Zero-Occupancy AC Run",
                "contribution_score": 48.0,
                "description": f"AC active with 0 occupants consuming {power_kw:.2f} kW."
            })
            
        # Condition 2: Room Unoccupied + Lights ON
        if occupancy == 0 and light_status:
            is_wastage = True
            risk_score += 15.0
            reasons.append("Lighting active in an unoccupied room")
            factors.append({
                "factor_name": "Unattended Lighting",
                "contribution_score": 15.0,
                "description": "Lights are drawing power with zero occupancy."
            })
            
        # Condition 3: Abnormally High Consumption above baseline
        excess_power = power_kw - baseline_kw
        if excess_power > 2.0 and occupancy < 5:
            risk_score += 20.0
            reasons.append(f"Disproportionate electrical load ({power_kw:.2f} kW) for {occupancy} occupants")
            factors.append({
                "factor_name": "Disproportionate Load",
                "contribution_score": 20.0,
                "description": f"Consuming {power_kw:.2f} kW vs {baseline_kw:.2f} kW baseline."
            })
            
        # Condition 4: Significant Mismatch vs Expected Model Consumption
        if expected_kw is not None and expected_kw > 0:
            diff_ratio = (power_kw - expected_kw) / expected_kw
            if diff_ratio > 0.35:
                risk_score += 18.0
                reasons.append(f"Consumption is {diff_ratio*100:.1f}% above AI expected baseline ({expected_kw:.2f} kW)")
                factors.append({
                    "factor_name": "AI Baseline Divergence",
                    "contribution_score": 18.0,
                    "description": f"Actual {power_kw:.2f} kW exceeds predicted {expected_kw:.2f} kW."
                })
                
        # Condition 5: Isolation Forest Statistical Anomaly
        if is_iforest_anomaly:
            risk_score += 14.0
            if not reasons:
                reasons.append("Unusual multi-variable electrical pattern detected by Isolation Forest")
            factors.append({
                "factor_name": "Isolation Forest Anomaly",
                "contribution_score": 14.0,
                "description": f"Statistical outlier score: {raw_anomaly_score:.3f}"
            })
            
        # Condition 6: Duration multiplier
        if duration_hours > 1.5 and is_wastage:
            extra_dur_score = min(15.0, (duration_hours - 1.0) * 8.0)
            risk_score += extra_dur_score
            factors.append({
                "factor_name": "Extended Wastage Duration",
                "contribution_score": round(extra_dur_score, 1),
                "description": f"Equipment running continuously for {duration_hours:.1f} hours unattended."
            })

        # Clamp risk score to [0, 100]
        risk_score = min(100.0, max(0.0, round(risk_score, 1)))
        
        # Categorize Severity Level
        if risk_score >= 76.0:
            severity = "CRITICAL"
        elif risk_score >= 51.0:
            severity = "WASTAGE"
        elif risk_score >= 26.0:
            severity = "WARNING"
        else:
            severity = "NORMAL"
            
        if not reasons:
            reasons.append("System operating within normal energy and occupancy parameters")
            
        primary_reason = "; ".join(reasons)
        
        # Calculate estimated wasted energy & cost
        wasted_kw = max(0.0, power_kw - baseline_kw) if is_wastage else 0.0
        wasted_kwh = round(wasted_kw * duration_hours, 2)
        # Default tariff ₹8.0
        wasted_cost = round(wasted_kwh * 8.0, 2)
        
        return {
            "is_anomaly": is_iforest_anomaly or is_wastage or (severity in ["WASTAGE", "CRITICAL"]),
            "is_wastage": is_wastage,
            "severity": severity,
            "risk_score": risk_score,
            "anomaly_score": round(raw_anomaly_score, 4),
            "reason": primary_reason,
            "power_kw": round(power_kw, 3),
            "duration_hours": duration_hours,
            "wasted_kwh": wasted_kwh,
            "wasted_cost": wasted_cost,
            "factors": factors
        }

anomaly_detector = AnomalyDetector()

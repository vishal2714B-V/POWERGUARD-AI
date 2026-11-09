import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
EVAL_DIR = os.path.join(BASE_DIR, "evaluation")

class EnergyPredictor:
    def __init__(self):
        self.model = None
        self.feature_names = None
        self.metrics = None
        self.load_model()
        
    def load_model(self):
        model_path = os.path.join(MODELS_DIR, "rf_predictor.joblib")
        features_path = os.path.join(MODELS_DIR, "feature_names.joblib")
        metrics_path = os.path.join(EVAL_DIR, "metrics.json")
        
        if os.path.exists(model_path) and os.path.exists(features_path):
            self.model = joblib.load(model_path)
            self.feature_names = joblib.load(features_path)
        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                self.metrics = json.load(f)
                
    def is_ready(self) -> bool:
        return self.model is not None

    def predict_single(self, hour: int, day_of_week: int, temperature: float, occupancy: int,
                       ac_status: int, light_status: int, fan_status: int, computer_status: int,
                       lag_1h_power: float, lag_24h_power: float, rolling_mean_6h: float) -> float:
        if not self.is_ready():
            self.load_model()
            if not self.is_ready():
                # Fallback to analytical calculation if model not ready
                return round(0.2 + (1.8 * ac_status) + (0.2 * light_status) + (0.05 * occupancy), 2)
                
        is_weekend = 1 if day_of_week >= 5 else 0
        hour_sin = np.sin(2 * np.pi * hour / 24.0)
        hour_cos = np.cos(2 * np.pi * hour / 24.0)
        
        feature_dict = {
            "hour": hour,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "hour_sin": hour_sin,
            "hour_cos": hour_cos,
            "temperature": temperature,
            "occupancy": occupancy,
            "ac_status": ac_status,
            "light_status": light_status,
            "fan_status": fan_status,
            "computer_status": computer_status,
            "lag_1h_power": lag_1h_power,
            "lag_24h_power": lag_24h_power,
            "rolling_mean_6h": rolling_mean_6h
        }
        
        input_df = pd.DataFrame([feature_dict])[self.feature_names]
        pred = self.model.predict(input_df)[0]
        return max(0.05, round(float(pred), 3))

    def predict_future_timeline(self, start_time: datetime, current_power: float, 
                                historical_lags: dict = None, hours_ahead: int = 24) -> list:
        if historical_lags is None:
            historical_lags = {}
            
        timeline = []
        running_lag_1 = current_power
        running_lag_24 = historical_lags.get("lag_24h_power", current_power)
        running_rolling_6 = historical_lags.get("rolling_mean_6h", current_power)
        
        for step in range(1, hours_ahead + 1):
            future_dt = start_time + timedelta(hours=step)
            hour = future_dt.hour
            dow = future_dt.weekday()
            is_wknd = 1 if dow >= 5 else 0
            
            # Simulated ambient temperature cycle
            temp = round(24.0 + 6.0 * np.sin((hour - 9) * np.pi / 12) + (1.0 if not is_wknd else 0.0), 1)
            
            # Typical schedule expectation
            if 8 <= hour <= 18 and not is_wknd:
                occ = 25
                ac = 1 if temp > 25.5 else 0
                light = 1
                fan = 1
                comp = 1
            else:
                occ = 0
                ac = 0
                light = 0
                fan = 0
                comp = 0
                
            pred_val = self.predict_single(
                hour=hour, day_of_week=dow, temperature=temp, occupancy=occ,
                ac_status=ac, light_status=light, fan_status=fan, computer_status=comp,
                lag_1h_power=running_lag_1, lag_24h_power=running_lag_24,
                rolling_mean_6h=running_rolling_6
            )
            
            timeline.append({
                "timestamp": future_dt.isoformat(),
                "hour": hour,
                "predicted_kwh": pred_val,
                "expected_occupancy": occ,
                "expected_temp": temp
            })
            
            # Update recursive lags
            running_lag_1 = pred_val
            running_rolling_6 = (running_rolling_6 * 5 + pred_val) / 6.0
            
        return timeline

predictor = EnergyPredictor()

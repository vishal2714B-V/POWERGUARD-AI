import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from ml.datasets.generate_dataset import generate_energy_dataset

def build_features(df):
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(by=["room_id", "timestamp"]).reset_index(drop=True)
    
    # Time-based features
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].apply(lambda x: 1 if x >= 5 else 0)
    df["month"] = df["timestamp"].dt.month
    
    # Cyclical hour encoding
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)
    
    # Group-wise Lag features
    df["lag_1h_power"] = df.groupby("room_id")["power_kw"].shift(1)
    df["lag_24h_power"] = df.groupby("room_id")["power_kw"].shift(24)
    df["rolling_mean_6h"] = df.groupby("room_id")["power_kw"].shift(1).rolling(window=6, min_periods=1).mean()
    
    # Backfill/forward fill initial lags
    df["lag_1h_power"] = df["lag_1h_power"].bfill()
    df["lag_24h_power"] = df["lag_24h_power"].bfill()
    df["rolling_mean_6h"] = df["rolling_mean_6h"].bfill()
    
    return df

def train_and_save_pipeline(dataset_path="ml/datasets/powerguard_dataset.csv", models_dir="ml/models", eval_dir="ml/evaluation"):
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)
    
    if not os.path.exists(dataset_path):
        print(f"Dataset not found at {dataset_path}. Generating now...")
        generate_energy_dataset(output_path=dataset_path, num_days=60)
        
    print("Loading dataset...")
    df = pd.read_csv(dataset_path)
    df = build_features(df)
    
    # Feature columns for Energy Prediction
    feature_cols = [
        "hour", "day_of_week", "is_weekend", "hour_sin", "hour_cos",
        "temperature", "occupancy", "ac_status", "light_status",
        "fan_status", "computer_status", "lag_1h_power", "lag_24h_power", "rolling_mean_6h"
    ]
    target_col = "power_kw"
    
    X = df[feature_cols].copy()
    y = df[target_col].copy()
    
    # Train-test split (80/20 chronological or random with fixed seed)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, shuffle=True)
    
    print(f"Training Random Forest Regressor on {len(X_train)} samples...")
    rf_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=16,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)
    
    # Evaluation on actual test set
    y_pred = rf_model.predict(X_test)
    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = float(r2_score(y_test, y_pred))
    
    print(f"--- Prediction Model Evaluation ---")
    print(f"MAE:  {mae:.4f} kW")
    print(f"RMSE: {rmse:.4f} kW")
    print(f"R²:   {r2:.4f}")
    
    # Anomaly Detection Training with Isolation Forest
    # Features for anomaly detection: power, occupancy, temperature, ac_status, light_status, hour
    anomaly_feature_cols = ["power_kw", "occupancy", "temperature", "ac_status", "light_status", "hour"]
    X_anomaly = df[anomaly_feature_cols].copy()
    
    scaler = StandardScaler()
    X_anomaly_scaled = scaler.fit_transform(X_anomaly)
    
    print("Training Isolation Forest Anomaly Detector...")
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.06,  # approx 6% anomalies in real facilities
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_anomaly_scaled)
    
    # Save models
    joblib.dump(rf_model, os.path.join(models_dir, "rf_predictor.joblib"))
    joblib.dump(iso_forest, os.path.join(models_dir, "isolation_forest.joblib"))
    joblib.dump(scaler, os.path.join(models_dir, "scaler.joblib"))
    joblib.dump(feature_cols, os.path.join(models_dir, "feature_names.joblib"))
    joblib.dump(anomaly_feature_cols, os.path.join(models_dir, "anomaly_features.joblib"))
    
    metrics = {
        "model_name": "Random Forest Regressor (Optimized)",
        "anomaly_model_name": "Isolation Forest (Ensemble)",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "total_dataset_records": len(df),
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "r2_score": round(r2, 4),
        "feature_importances": {
            feat: round(float(imp), 4) for feat, imp in zip(feature_cols, rf_model.feature_importances_)
        }
    }
    
    with open(os.path.join(eval_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"All ML models and evaluation metrics saved successfully to {models_dir} and {eval_dir}!")
    return metrics

if __name__ == "__main__":
    train_and_save_pipeline()

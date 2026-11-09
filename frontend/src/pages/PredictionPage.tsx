import React, { useState, useEffect } from 'react';
import {
  LineChart as LucideLineChart, Brain, Target, Database,
  CheckCircle, ArrowRight, Award, Info
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../services/api';
import { PredictionSummary } from '../types';
import { KPICard } from '../components/KPICard';

export const PredictionPage: React.FC = () => {
  const [data, setData] = useState<PredictionSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const res = await api.getPredictionSummary();
        setData(res);
      } catch (err) {
        console.error('Failed to load predictions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrediction();
  }, []);

  if (loading || !data) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: 60 }}>
        <Brain size={32} color="#a855f7" style={{ animation: 'pulse 1.5s infinite' }} />
        <div style={{ marginTop: 14, color: 'var(--text-secondary)' }}>Loading ML inference data...</div>
      </div>
    );
  }

  // Format feature importances for chart
  const featureList = Object.entries(data.feature_importances || {}).map(([key, val]) => ({
    feature: key.replace(/_/g, ' '),
    importance: val,
  })).sort((a, b) => b.importance - a.importance).slice(0, 7);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Brain size={22} color="#a855f7" />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Machine Learning Energy Prediction
          </h2>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          {data.explanation}
        </p>
      </div>

      {/* Top Prediction Horizon KPI Cards */}
      <div className="kpi-grid">
        <KPICard
          label="Next-Hour Forecast"
          value={data.next_hour_kwh}
          unit="kWh"
          subtitle="Trained Random Forest Inference"
          icon={<Target size={20} />}
          accentColor="#38bdf8"
        />

        <KPICard
          label="Tomorrow's Forecast"
          value={data.next_day_kwh}
          unit="kWh"
          subtitle="24-hour ahead aggregated cycle"
          icon={<LucideLineChart size={20} />}
          accentColor="#a855f7"
        />

        <KPICard
          label="R² Goodness of Fit"
          value={data.r2_score}
          subtitle="Honest holdout test set metric"
          icon={<Award size={20} />}
          accentColor="#10b981"
        />

        <KPICard
          label="Mean Absolute Error (MAE)"
          value={`${data.mae} kW`}
          subtitle="Holdout test evaluation error"
          icon={<CheckCircle size={20} />}
          accentColor="#fbbf24"
        />

        <KPICard
          label="Root Mean Squared (RMSE)"
          value={`${data.rmse} kW`}
          subtitle="Model prediction variance"
          icon={<Database size={20} />}
          accentColor="#60a5fa"
        />
      </div>

      {/* Actual vs Predicted Timeline Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">
          <LucideLineChart size={18} color="#a855f7" />
          <span>Actual vs Predicted Load Profile (Historical Past 12h & Future 12h Forecast)</span>
        </div>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="predAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="actAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="actual_kwh"
                name="Actual Load (kW)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#actAreaGrad)"
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="predicted_kwh"
                name="AI Prediction (kW)"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#predAreaGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 8 }}>
          <Info size={14} color="#38bdf8" />
          <span>Dashed purple curve shows autonomous multi-step forecast extending into tomorrow's operating schedule.</span>
        </div>
      </div>

      {/* Model Specs & Feature Importances */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* ML Specifications Table */}
        <div className="card">
          <div className="card-title">
            <Database size={18} color="#38bdf8" />
            <span>ML Model Pipeline Specifications</span>
          </div>
          <table className="data-table">
            <tbody>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Algorithm Architecture</td>
                <td style={{ fontWeight: 600 }}>{data.model_name}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Training Records</td>
                <td style={{ fontWeight: 600 }}>{data.training_samples.toLocaleString()} hours</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Lag Features Engineered</td>
                <td style={{ fontWeight: 600 }}>lag_1h, lag_24h, rolling_mean_6h</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Input Variables</td>
                <td style={{ fontWeight: 600 }}>Occupancy, Temp, AC/Light status, Hour sin/cos</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Persistence Method</td>
                <td style={{ fontWeight: 600 }}>joblib binary serialization (.joblib)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Feature Importance Bar */}
        <div className="card">
          <div className="card-title">
            <Brain size={18} color="#10b981" />
            <span>Random Forest Feature Importance Weightings</span>
          </div>
          <div style={{ height: 210, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={featureList} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="feature" type="category" stroke="#64748b" fontSize={10} width={90} />
                <Tooltip
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Weight']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="importance" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

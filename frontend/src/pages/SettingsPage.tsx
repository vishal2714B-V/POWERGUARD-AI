import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Save, IndianRupee, Leaf,
  AlertTriangle, Cpu, CheckCircle2, Shield
} from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [tariff, setTariff] = useState<number>(8.0);
  const [co2Factor, setCo2Factor] = useState<number>(0.82);
  const [penaltyRate, setPenaltyRate] = useState<number>(10.0);
  const [wastageThreshold, setWastageThreshold] = useState<number>(1.8);
  const [sensors, setSensors] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSettingsAndSensors = async () => {
    try {
      const [settingsRes, sensorsRes] = await Promise.all([
        api.getSettings(),
        fetch('http://localhost:8000/api/sensors/').then((r) => r.json()),
      ]);

      if (settingsRes.ENERGY_TARIFF) setTariff(Number(settingsRes.ENERGY_TARIFF.value));
      if (settingsRes.CO2_EMISSION_FACTOR) setCo2Factor(Number(settingsRes.CO2_EMISSION_FACTOR.value));
      if (settingsRes.PENALTY_RATE) setPenaltyRate(Number(settingsRes.PENALTY_RATE.value));
      if (settingsRes.WASTAGE_THRESHOLD_KW) setWastageThreshold(Number(settingsRes.WASTAGE_THRESHOLD_KW.value));
      setSensors(sensorsRes);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndSensors();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        energy_tariff: tariff,
        co2_emission_factor: co2Factor,
        penalty_rate: penaltyRate,
        wastage_threshold_kw: wastageThreshold,
      });
      setFeedback('Configuration parameters saved and propagated across analytical models.');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback(`Error updating settings: ${err.message}`);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SettingsIcon size={22} color="#38bdf8" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            System Parameters & IoT Gateway Management
          </h2>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Configure institutional financial tariffs, greenhouse emission indices, and edge sensor telemetry.
        </p>
      </div>

      {feedback && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          borderRadius: 8,
          padding: '12px 18px',
          marginBottom: 20,
          color: '#6ee7b7',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 26 }}>
        <div className="card">
          <div className="card-title">
            <Shield size={18} color="#38bdf8" />
            <span>Economic & Environmental Factors</span>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IndianRupee size={14} color="#fbbf24" /> Electricity Tariff Rate (₹ / kWh)
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="50.0"
                className="form-input"
                value={tariff}
                onChange={(e) => setTariff(Number(e.target.value))}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Applied across all financial KPI calculations, What-If models, and wastage estimates.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Leaf size={14} color="#10b981" /> Carbon Emission Factor (kg CO₂ / kWh)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="2.0"
                className="form-input"
                value={co2Factor}
                onChange={(e) => setCo2Factor(Number(e.target.value))}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Grid carbon intensity coefficient (Standard Indian Regional Grid factor: 0.82 kg CO₂/kWh).
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IndianRupee size={14} color="#f59e0b" /> Smart Wastage Penalty Rate (₹ / avoidable kWh)
              </label>
              <input
                type="number"
                step="0.5"
                min="1.0"
                max="100.0"
                className="form-input"
                value={penaltyRate}
                onChange={(e) => setPenaltyRate(Number(e.target.value))}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Rate used to calculate the simulated smart wastage behavioural charge.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} color="#ef4444" /> Zero-Occupancy Wastage Power Threshold (kW)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="10.0"
                className="form-input"
                value={wastageThreshold}
                onChange={(e) => setWastageThreshold(Number(e.target.value))}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Power level triggering automated anomaly alarms if occupancy remains 0.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
              <Save size={15} /> Save & Propagate Parameters
            </button>
          </form>
        </div>

        {/* System Architecture Specifications */}
        <div className="card">
          <div className="card-title">
            <Cpu size={18} color="#10b981" />
            <span>Infrastructure Health Status</span>
          </div>

          <table className="data-table">
            <tbody>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>FastAPI Gateway</td>
                <td><span style={{ color: '#34d399', fontWeight: 600 }}>● OPERATIONAL</span></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Machine Learning Engine</td>
                <td><span style={{ color: '#34d399', fontWeight: 600 }}>● RANDOM FOREST v1.0</span></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Anomaly Classifier</td>
                <td><span style={{ color: '#34d399', fontWeight: 600 }}>● ISOLATION FOREST</span></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>IoT Telemetry Ingestion</td>
                <td><span style={{ color: '#34d399', fontWeight: 600 }}>● MULTI-NODE ONLINE</span></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)' }}>Persistent Database</td>
                <td><span style={{ color: '#34d399', fontWeight: 600 }}>● SQLITE / POSTGRES-READY</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensor Node Telemetry Health Table */}
      <div className="card">
        <div className="card-title">
          <Cpu size={18} color="#38bdf8" />
          <span>Campus IoT Sensor Node Diagnostics</span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Node Hardware UID</th>
                <th>Monitored Zone</th>
                <th>Sensor Architecture</th>
                <th>Firmware</th>
                <th>Telemetry Status</th>
                <th>Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {sensors.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.sensor_uid}</td>
                  <td>Room {s.room_number}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.sensor_type}</td>
                  <td>{s.firmware_version}</td>
                  <td>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                    }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {new Date(s.last_seen).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

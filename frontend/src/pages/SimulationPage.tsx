import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal, Zap, IndianRupee, Leaf, ArrowRight,
  RotateCcw, Sparkles, TrendingDown, Layers
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../services/api';
import { SimulationResult } from '../types';
import { KPICard } from '../components/KPICard';

export const SimulationPage: React.FC = () => {
  // Input parameters matching Section 10
  const [acHoursCurrent, setAcHoursCurrent] = useState<number>(8);
  const [acHoursTarget, setAcHoursTarget] = useState<number>(5);

  const [lightHoursCurrent, setLightHoursCurrent] = useState<number>(10);
  const [lightHoursTarget, setLightHoursTarget] = useState<number>(6);

  const [occupantsCurrent, setOccupantsCurrent] = useState<number>(100);
  const [occupantsTarget, setOccupantsTarget] = useState<number>(70);

  const [tempCurrent, setTempCurrent] = useState<number>(22);
  const [tempTarget, setTempTarget] = useState<number>(24);

  const [idleReduction, setIdleReduction] = useState<number>(25);

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.runSimulation({
        ac_hours_current: acHoursCurrent,
        ac_hours_target: acHoursTarget,
        light_hours_current: lightHoursCurrent,
        light_hours_target: lightHoursTarget,
        occupants_current: occupantsCurrent,
        occupants_target: occupantsTarget,
        temp_setpoint_current: tempCurrent,
        temp_setpoint_target: tempTarget,
        idle_reduction_percent: idleReduction,
      });
      setResult(res);
    } catch (err) {
      console.error('Simulation calculation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount and parameter updates
  useEffect(() => {
    runSimulation();
  }, [acHoursCurrent, acHoursTarget, lightHoursCurrent, lightHoursTarget, occupantsCurrent, occupantsTarget, tempCurrent, tempTarget, idleReduction]);

  const handleResetDefaults = () => {
    setAcHoursCurrent(8);
    setAcHoursTarget(5);
    setLightHoursCurrent(10);
    setLightHoursTarget(6);
    setOccupantsCurrent(100);
    setOccupantsTarget(70);
    setTempCurrent(22);
    setTempTarget(24);
    setIdleReduction(20);
  };

  // Format category breakdown for bar chart
  const categoryData = result ? Object.entries(result.breakdown_by_category).map(([cat, val]) => ({
    category: cat,
    saved_kwh: val,
  })) : [];

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SlidersHorizontal size={22} color="#38bdf8" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              What-If Energy & Cost Simulation Engine
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Parametric thermodynamic model calculating real-time impacts of scheduled runtimes and cooling setpoints.
          </p>
        </div>

        <button
          className="btn btn-outline"
          style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          onClick={handleResetDefaults}
        >
          <RotateCcw size={14} /> Reset Example Scenario
        </button>
      </div>

      {/* KPI Cards: Before vs After & Savings */}
      <div className="kpi-grid">
        <KPICard
          label="Current Daily Energy"
          value={result ? result.current_daily_kwh : 480}
          unit="kWh"
          subtitle="Baseline operational schedule"
          icon={<Zap size={20} />}
          accentColor="#64748b"
        />

        <KPICard
          label="Optimized Daily Energy"
          value={result ? result.optimized_daily_kwh : 390}
          unit="kWh"
          subtitle="After scheduled reductions"
          icon={<TrendingDown size={20} />}
          accentColor="#38bdf8"
        />

        <KPICard
          label="Daily Energy Saved"
          value={result ? result.energy_saved_kwh : 90}
          unit="kWh"
          subtitle={`Achieving ${result?.percentage_saved || 18.8}% reduction`}
          icon={<Sparkles size={20} />}
          accentColor="#10b981"
        />

        <KPICard
          label="Daily Cost Saved"
          value={result ? `₹${result.cost_saved_inr.toFixed(0)}` : '₹720'}
          subtitle="Based on ₹8.00 / kWh tariff"
          icon={<IndianRupee size={20} />}
          accentColor="#fbbf24"
        />

        <KPICard
          label="Daily CO₂ Abated"
          value={result ? result.co2_reduced_kg : 73.8}
          unit="kg"
          subtitle="0.82 kg CO₂/kWh factor"
          icon={<Leaf size={20} />}
          accentColor="#34d399"
        />
      </div>

      {/* Main Simulation Layout: Left Controls, Right Before vs After Curves */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 24, marginBottom: 24 }}>
        {/* Controls Card */}
        <div className="card">
          <div className="card-title">
            <SlidersHorizontal size={18} color="#38bdf8" />
            <span>Interactive Operational Levers</span>
          </div>

          {/* AC Hours Slider */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
              <span>AC Runtime:</span>
              <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {acHoursCurrent}h current ➔ <strong style={{ color: '#34d399' }}>{acHoursTarget}h target</strong>
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={16}
              value={acHoursTarget}
              onChange={(e) => setAcHoursTarget(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>1 hr</span>
              <span>8 hrs</span>
              <span>16 hrs</span>
            </div>
          </div>

          {/* Lighting Hours Slider */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
              <span>Lighting Duration:</span>
              <span style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                {lightHoursCurrent}h current ➔ <strong style={{ color: '#34d399' }}>{lightHoursTarget}h target</strong>
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={18}
              value={lightHoursTarget}
              onChange={(e) => setLightHoursTarget(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#fbbf24' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>1 hr</span>
              <span>10 hrs</span>
              <span>18 hrs</span>
            </div>
          </div>

          {/* Occupants Count */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
              <span>Concurrent Occupants:</span>
              <span style={{ color: '#a855f7', fontFamily: 'var(--font-mono)' }}>
                {occupantsCurrent} current ➔ <strong style={{ color: '#38bdf8' }}>{occupantsTarget} target</strong>
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={150}
              step={5}
              value={occupantsTarget}
              onChange={(e) => setOccupantsTarget(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#a855f7' }}
            />
          </div>

          {/* Thermostat Setpoint */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
              <span>Thermostat Cooling Setpoint:</span>
              <span style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                {tempCurrent}°C ➔ <strong style={{ color: '#38bdf8' }}>{tempTarget}°C (Eco)</strong>
              </span>
            </div>
            <input
              type="range"
              min={18}
              max={28}
              value={tempTarget}
              onChange={(e) => setTempTarget(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#34d399' }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
              *Each +1°C setpoint elevation reduces compressor energy by ~6%.
            </div>
          </div>

          {/* Idle Vampire Load Cut */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
              <span>Automated Standby Load Shedding:</span>
              <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{idleReduction}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={idleReduction}
              onChange={(e) => setIdleReduction(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8' }}
            />
          </div>
        </div>

        {/* 24-Hour Comparative Curve Chart (BEFORE vs AFTER) */}
        <div className="card">
          <div className="card-title">
            <Zap size={18} color="#10b981" />
            <span>24-Hour Profile: BEFORE (Current) vs AFTER (Optimized)</span>
          </div>

          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={result?.hourly_comparison || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="simBeforeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="simAfterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="current_kwh"
                  name="Current Schedule (kWh)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#simBeforeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="optimized_kwh"
                  name="Optimized Plan (kWh)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#simAfterGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Daily Savings Contribution by System:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {categoryData.map((c) => (
                <div key={c.category} style={{ background: 'var(--bg-secondary)', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.category}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                    +{c.saved_kwh} kWh
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

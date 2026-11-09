import React, { useState, useEffect } from 'react';
import {
  Zap, TrendingUp, AlertTriangle, IndianRupee, Leaf,
  Layers, ArrowUpRight, Clock, ShieldAlert, Cpu
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { api } from '../services/api';
import { DashboardKPIs } from '../types';
import { KPICard } from '../components/KPICard';
import { StatusBadge } from '../components/StatusBadge';
import { DemoScenarioBar } from '../components/DemoScenarioBar';

const APPLIANCE_COLORS = ['#3b82f6', '#38bdf8', '#10b981', '#f59e0b', '#8b5cf6'];

interface DashboardPageProps {
  onNavigateToRoom?: (roomId: number) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToRoom,
  onNavigateToTab,
}) => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [roomData, setRoomData] = useState<any[]>([]);
  const [applianceData, setApplianceData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      const [kpiRes, hourlyRes, dailyRes, roomRes, appRes] = await Promise.all([
        api.getKPIs(),
        api.getHourlyConsumption(),
        api.getDailyConsumption(),
        api.getRoomWiseConsumption(),
        api.getApplianceBreakdown(),
      ]);
      setKpis(kpiRes);
      setHourlyData(hourlyRes);
      setDailyData(dailyRes);
      setRoomData(roomRes);
      setApplianceData(appRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 8 seconds to reflect live IoT changes
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-wrapper">
      {/* College Presentation Demo Mode Switcher */}
      <DemoScenarioBar onScenarioTriggered={fetchDashboardData} />

      {/* Critical Wastage Warning Banner if Room 204 or Wastage Detected */}
      {kpis && kpis.wastage_risk_level === 'CRITICAL' && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.2), rgba(15, 23, 42, 0.9))',
          border: '1px solid #ef4444',
          borderRadius: 12,
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: '#ef4444',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
                Severe Energy Wastage Detected in Room 204
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fca5a5' }}>
                AC active at 2.4 kW with zero occupancy. Risk Score: {kpis.wastage_risk_score} / 100 (CRITICAL).
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-danger"
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
              onClick={() => onNavigateToRoom ? onNavigateToRoom(8) : onNavigateToTab?.('room-detail')}
            >
              Inspect Room 204 <ArrowUpRight size={14} />
            </button>
            <button
              className="btn btn-outline"
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}
              onClick={() => onNavigateToTab?.('recommendations')}
            >
              View AI Recommendation
            </button>
          </div>
        </div>
      )}

      {/* Top Level KPI Cards (Section 3) */}
      <div className="kpi-grid">
        <KPICard
          label="Today's Consumption"
          value={kpis ? kpis.today_consumption_kwh : '---'}
          unit="kWh"
          subtitle="Cumulative past 24 hours"
          icon={<Zap size={20} />}
          accentColor="#38bdf8"
        />

        <KPICard
          label="Current Power"
          value={kpis ? kpis.current_power_kw : '---'}
          unit="kW"
          subtitle={`${kpis?.total_active_rooms || 8} active monitored nodes`}
          icon={<Cpu size={20} />}
          accentColor="#60a5fa"
        />

        <KPICard
          label="Predicted Consumption"
          value={kpis ? kpis.predicted_consumption_kwh : '---'}
          unit="kWh"
          subtitle="AI Random Forest 24h Model"
          icon={<TrendingUp size={20} />}
          accentColor="#a855f7"
        />

        <KPICard
          label="Estimated Cost"
          value={kpis ? `₹${kpis.estimated_cost.toLocaleString()}` : '---'}
          subtitle="Based on ₹8.00 / kWh tariff"
          icon={<IndianRupee size={20} />}
          accentColor="#fbbf24"
        />

        <KPICard
          label="Potential Savings"
          value={kpis ? `₹${kpis.potential_savings.toLocaleString()}` : '---'}
          subtitle="Identified actionable waste"
          icon={<Leaf size={20} />}
          accentColor="#34d399"
        />

        <KPICard
          label="Wastage Risk"
          value={kpis ? `${kpis.wastage_risk_score} / 100` : '---'}
          subtitle={`${kpis?.wastage_rooms_count || 1} room(s) in excess`}
          icon={<ShieldAlert size={20} />}
          accentColor={kpis?.wastage_risk_level === 'CRITICAL' ? '#ef4444' : '#f59e0b'}
          badge={kpis ? <StatusBadge status={kpis.wastage_risk_level} size="sm" /> : undefined}
        />
      </div>

      {/* Row 1 Charts: Hourly Actual vs Predicted & Appliance Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Hourly Chart */}
        <div className="card">
          <div className="card-title">
            <Clock size={18} color="#38bdf8" />
            <span>Hourly Facility Consumption (Actual vs Predicted kW)</span>
          </div>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="actual_kwh" name="Actual Load (kW)" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#actualGrad)" />
                <Area type="monotone" dataKey="predicted_kwh" name="Predicted Baseline (kW)" stroke="#a855f7" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#predGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appliance Breakdown Donut */}
        <div className="card">
          <div className="card-title">
            <Layers size={18} color="#34d399" />
            <span>Appliance-Wise Load Share</span>
          </div>
          <div style={{ height: 210, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={applianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="power_kw"
                  nameKey="appliance"
                >
                  {applianceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={APPLIANCE_COLORS[index % APPLIANCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} kW`, 'Load']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {applianceData.slice(0, 3).map((item, i) => (
              <div key={item.appliance} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: APPLIANCE_COLORS[i] }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.appliance}</span>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Room-Wise Current Load & 7-Day Daily Consumption */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Room-wise Bar Chart */}
        <div className="card">
          <div className="card-title">
            <Zap size={18} color="#f59e0b" />
            <span>Room-Wise Current Power Demand (kW)</span>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="room_number" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  formatter={(val: any, _, item: any) => [`${val} kW (${item.payload.name})`, 'Power']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="current_power_kw" name="Power (kW)">
                  {roomData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.room_number === '204' ? '#ef4444' : '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
            🔴 Room 204 highlighted in red represents active zero-occupancy wastage.
          </div>
        </div>

        {/* 7-Day Daily Energy Cost & Savings Trend */}
        <div className="card">
          <div className="card-title">
            <IndianRupee size={18} color="#10b981" />
            <span>7-Day Daily Energy Cost & Potential Savings (₹)</span>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`₹${val}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="cost_inr" name="Electricity Cost (₹)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="savings_inr" name="Recoverable Savings (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

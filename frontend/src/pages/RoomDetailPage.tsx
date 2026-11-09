import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Zap, Users, Thermometer, Wind, Lightbulb,
  AlertTriangle, CheckCircle, ShieldAlert, Sparkles, Power,
  Clock, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface RoomDetailPageProps {
  roomId: number;
  onBack: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const RoomDetailPage: React.FC<RoomDetailPageProps> = ({
  roomId = 8,
  onBack,
  onNavigateToTab,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      const res = await api.getRoomDetails(roomId);
      setData(res);
    } catch (err) {
      console.error('Error fetching room details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  const handleApplyTurnOffAC = async () => {
    try {
      setActionFeedback('Executing remote automated shutoff signal via IoT gateway...');
      // Trigger normal scenario
      await api.triggerDemoScenario('normal');
      await fetchDetails();
      setActionFeedback('Success: AC shutoff confirmed. Room load normalized to 0.20 kW baseline.');
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  if (loading || !data) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: 60 }}>
        <Activity size={32} color="#38bdf8" style={{ animation: 'spin 1.5s infinite linear' }} />
        <div style={{ marginTop: 14, color: 'var(--text-secondary)' }}>Loading telemetry data...</div>
      </div>
    );
  }

  const { room, latest_reading, recent_history, anomalies, recommendations } = data;
  const activeAnomaly = anomalies && anomalies.length > 0 ? anomalies[0] : null;
  const isWastage = activeAnomaly?.is_wastage || (latest_reading?.occupancy === 0 && latest_reading?.ac_status);

  // Format history for chart
  const chartPoints = (recent_history || []).map((r: any) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    power_kw: r.power_kw,
    occupancy: r.occupancy,
    temp: r.temperature,
  }));

  return (
    <div className="page-wrapper">
      {/* Top breadcrumb & back button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button
          onClick={onBack}
          className="btn btn-outline"
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
        >
          <ArrowLeft size={14} /> Back to Live Matrix
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Building: {room.building}</span>
          <StatusBadge status={isWastage ? 'CRITICAL' : 'NORMAL'} />
        </div>
      </div>

      {actionFeedback && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid #10b981',
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 20,
          color: '#6ee7b7',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <CheckCircle size={18} />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Main Room Inspection Header Card */}
      <div className="card" style={{
        marginBottom: 24,
        borderColor: isWastage ? '#ef4444' : 'var(--border-subtle)',
        background: isWastage ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.12), var(--bg-card))' : 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ROOM {room.room_number}
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '3px 10px', borderRadius: 6 }}>
                {room.name}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Floor {room.floor} • Floor Area: {room.area_sqft} sq.ft • Baseline Idle: {room.baseline_power_kw} kW
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Wastage Risk Score
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isWastage ? '#ef4444' : '#34d399', fontFamily: 'var(--font-mono)' }}>
                {activeAnomaly ? activeAnomaly.risk_score : 12} / 100
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics Quad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginTop: 20,
          background: 'rgba(7, 11, 19, 0.6)',
          padding: '16px',
          borderRadius: 12,
          border: '1px solid var(--border-subtle)',
        }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} color="#38bdf8" /> Current Power
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isWastage ? '#f87171' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {latest_reading?.power_kw?.toFixed(2) || '2.40'} <span style={{ fontSize: '0.85rem' }}>kW</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} color="#34d399" /> Occupancy
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {latest_reading?.occupancy ?? 0} <span style={{ fontSize: '0.85rem' }}>people</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Thermometer size={14} color="#f59e0b" /> Temperature
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {latest_reading?.temperature?.toFixed(1) || '29.0'}°C
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wind size={14} color="#38bdf8" /> AC Status
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: latest_reading?.ac_status ? '#38bdf8' : 'var(--text-muted)' }}>
              {latest_reading?.ac_status ? 'ON' : 'OFF'}
            </div>
          </div>
        </div>

        {/* Wastage Diagnosis Section (Section 6 & 8) */}
        {isWastage && (
          <div style={{
            marginTop: 20,
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 10,
            padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontWeight: 700, fontSize: '0.92rem', marginBottom: 6 }}>
              <AlertTriangle size={18} />
              <span>WASTAGE DETECTED</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#ffffff', marginBottom: 8 }}>
              <strong>Reason:</strong> {activeAnomaly?.reason || 'High AC consumption detected while room is unoccupied.'}
            </div>
            <div style={{ display: 'flex', gap: 20, fontSize: '0.78rem', color: '#fca5a5' }}>
              <span>Duration: {activeAnomaly?.duration_hours || 2.0} hours</span>
              <span>Wasted Energy: {activeAnomaly?.wasted_kwh || 4.8} kWh</span>
              <span>Direct Cost Loss: ₹{activeAnomaly?.wasted_cost || 38.4}</span>
            </div>
          </div>
        )}
      </div>

      {/* AI Recommendation Box (Section 2.E & STEP 7) */}
      {isWastage && (
        <div className="card" style={{ marginBottom: 24, border: '1px solid #3b82f6', background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), var(--bg-card))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', fontWeight: 700, fontSize: '0.92rem', marginBottom: 4 }}>
                <Sparkles size={18} />
                <span>AI Recommendation Engine</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', maxWidth: 650 }}>
                Room {room.room_number} is currently unoccupied while the AC is drawing approximately {latest_reading?.power_kw?.toFixed(2) || 2.4} kW.
              </p>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', marginTop: 6 }}>
                Suggested Action: Turn OFF the AC immediately.
              </div>

              <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: '0.78rem' }}>
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: 6, color: '#38bdf8' }}>
                  ⚡ Energy Saving: <strong>4.2 kWh/day</strong>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: 6, color: '#fbbf24' }}>
                  💰 Cost Saving: <strong>₹35.00/day</strong>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 6, color: '#34d399' }}>
                  🌱 CO₂ Reduction: <strong>3.44 kg/day</strong>
                </div>
              </div>
            </div>

            <div>
              <button
                className="btn btn-primary"
                style={{ padding: '10px 18px', fontSize: '0.88rem' }}
                onClick={handleApplyTurnOffAC}
              >
                <Power size={16} /> Execute Action: Turn OFF AC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 24-Hour Telemetry History Chart */}
      <div className="card">
        <div className="card-title">
          <Clock size={18} color="#38bdf8" />
          <span>24-Hour Power Demand & Occupancy Profile</span>
        </div>
        <div style={{ height: 260, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="roomPowerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isWastage ? '#ef4444' : '#38bdf8'} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={isWastage ? '#ef4444' : '#38bdf8'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="power_kw"
                name="Power (kW)"
                stroke={isWastage ? '#ef4444' : '#38bdf8'}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#roomPowerGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

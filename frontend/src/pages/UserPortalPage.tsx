import React, { useState, useEffect } from 'react';
import {
  DoorOpen, Zap, Users, Thermometer, Wind, Lightbulb,
  AlertTriangle, Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { KPICard } from '../components/KPICard';

interface UserPortalPageProps {
  onNavigateToTab?: (tab: string) => void;
}

export const UserPortalPage: React.FC<UserPortalPageProps> = ({ onNavigateToTab }) => {
  const { user } = useAuth();
  const assignedRoomId = user?.assigned_room_id || 8; // Default Room 204
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRoomData = async () => {
    try {
      const res = await api.getRoomDetails(assignedRoomId);
      setData(res);
    } catch (err) {
      console.error('Failed to load user room details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();
    const interval = setInterval(fetchRoomData, 6000);
    return () => clearInterval(interval);
  }, [assignedRoomId]);

  if (loading || !data) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: 50 }}>
        <DoorOpen size={30} color="#38bdf8" />
        <div style={{ marginTop: 10, color: 'var(--text-secondary)' }}>Loading your assigned zone telemetry...</div>
      </div>
    );
  }

  const { room, latest_reading, recommendations, anomalies } = data;
  const isWastage = latest_reading?.occupancy === 0 && latest_reading?.ac_status;

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DoorOpen size={22} color="#38bdf8" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Assigned Room Portal: Room {room.room_number}
          </h2>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Dedicated dashboard for {room.name} ({room.building}, Floor {room.floor}).
        </p>
      </div>

      {/* KPI Overview for this room */}
      <div className="kpi-grid">
        <KPICard
          label="Zone Current Power"
          value={latest_reading?.power_kw?.toFixed(2) || '2.40'}
          unit="kW"
          subtitle="Real-time draw"
          icon={<Zap size={20} />}
          accentColor="#38bdf8"
        />

        <KPICard
          label="Occupancy Count"
          value={latest_reading?.occupancy ?? 0}
          unit="occupants"
          subtitle="PIR & AI detection"
          icon={<Users size={20} />}
          accentColor="#34d399"
        />

        <KPICard
          label="Zone Temperature"
          value={`${latest_reading?.temperature?.toFixed(1) || 29.0}°C`}
          subtitle="Ambient sensor reading"
          icon={<Thermometer size={20} />}
          accentColor="#f59e0b"
        />

        <KPICard
          label="Compliance Status"
          value={isWastage ? 'WASTAGE' : 'NORMAL'}
          subtitle={isWastage ? 'Risk: 82 / 100' : 'Optimal'}
          icon={<AlertTriangle size={20} />}
          accentColor={isWastage ? '#ef4444' : '#10b981'}
          badge={<StatusBadge status={isWastage ? 'CRITICAL' : 'NORMAL'} size="sm" />}
        />
      </div>

      {/* Wastage notification if active */}
      {isWastage && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.2), rgba(15, 23, 42, 0.9))',
          border: '1px solid #ef4444',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', fontWeight: 700, fontSize: '0.95rem' }}>
            <AlertTriangle size={20} />
            <span>WASTAGE NOTIFICATION FOR YOUR ASSIGNED ROOM</span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#ffffff', marginTop: 4 }}>
            High AC consumption detected (2.4 kW) while your room has 0 occupants.
          </p>
          <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: 4 }}>
            Potential avoided penalty: ~₹38.40 per hour of unattended cooling.
          </div>
        </div>
      )}

      {/* Recommendations & Quick Action */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-title">
            <Sparkles size={18} color="#38bdf8" />
            <span>AI Savings Recommendations for Your Zone</span>
          </div>
          {recommendations && recommendations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recommendations.slice(0, 2).map((rec: any) => (
                <div key={rec.id} style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>
                    {rec.problem}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Suggested: {rec.suggested_action}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 600, marginTop: 6 }}>
                    Estimated Daily Savings: ₹{rec.estimated_cost_saving} ({rec.estimated_kwh_saving} kWh)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No pending optimizations required for your room.
            </div>
          )}
        </div>

        {/* Quick Simulation Link */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="card-title">
            <Zap size={18} color="#10b981" />
            <span>Room Energy Optimization</span>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Want to see how adjusting AC hours from 8h to 5h saves energy and lowers your simulated carbon footprint?
          </p>
          <button
            className="btn btn-primary"
            onClick={() => onNavigateToTab?.('simulation')}
          >
            Launch What-If Simulation for Room {room.room_number} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Activity, Users, Thermometer, Wind, Lightbulb,
  Zap, ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { RoomLiveStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DemoScenarioBar } from '../components/DemoScenarioBar';

interface LiveMonitoringPageProps {
  onSelectRoom: (roomId: number) => void;
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState<RoomLiveStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('ALL');

  const fetchRooms = async () => {
    try {
      const data = await api.getLiveRooms();
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch live rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredRooms = rooms.filter((r) => {
    if (filter === 'ALL') return true;
    if (filter === 'WASTAGE') return r.status === 'WASTAGE' || r.status === 'CRITICAL';
    if (filter === 'WARNING') return r.status === 'WARNING';
    if (filter === 'NORMAL') return r.status === 'NORMAL';
    return true;
  });

  return (
    <div className="page-wrapper">
      <DemoScenarioBar onScenarioTriggered={fetchRooms} />

      {/* Header controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Facility Live Telemetry Matrix
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Real-time multi-sensor telemetry streamed from academic and administrative zones.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: 3, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            {['ALL', 'CRITICAL / WASTAGE', 'WARNING', 'NORMAL'].map((f) => {
              const key = f.startsWith('CRITICAL') ? 'WASTAGE' : f;
              const active = filter === key;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(key)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    background: active ? '#2563eb' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchRooms}
            className="btn btn-outline"
            style={{ padding: '7px 12px', fontSize: '0.78rem' }}
          >
            <RefreshCw size={13} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Grid of Room Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
        gap: 18,
      }}>
        {filteredRooms.map((room) => {
          const isCritical = room.status === 'CRITICAL' || room.status === 'WASTAGE';
          return (
            <div
              key={room.room_id}
              className="card"
              style={{
                cursor: 'pointer',
                borderColor: isCritical ? '#ef4444' : (room.status === 'WARNING' ? '#f59e0b' : 'var(--border-subtle)'),
                background: isCritical ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.08), var(--bg-card))' : 'var(--bg-card)',
              }}
              onClick={() => onSelectRoom(room.room_id)}
            >
              {/* Room Top Info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Room {room.room_number}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 4 }}>
                      Floor {room.floor}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {room.name}
                  </div>
                </div>
                <StatusBadge status={room.status} />
              </div>

              {/* Sensor Metrics Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                background: 'rgba(10, 16, 30, 0.6)',
                borderRadius: 10,
                padding: '12px',
                marginBottom: 14,
                border: '1px solid var(--border-subtle)',
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap size={12} color="#38bdf8" /> Current Power
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: isCritical ? '#f87171' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {room.current_power_kw.toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>kW</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={12} color="#34d399" /> Occupancy
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {room.occupancy} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>people</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Thermometer size={12} color="#f59e0b" /> Temperature
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {room.temperature.toFixed(1)}°C
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Wastage Risk
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: isCritical ? '#ef4444' : '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                    {room.risk_score.toFixed(0)} <span style={{ fontSize: '0.7rem' }}>/ 100</span>
                  </div>
                </div>
              </div>

              {/* Appliance Status Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: room.ac_status ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: room.ac_status ? '#38bdf8' : 'var(--text-muted)',
                  border: `1px solid ${room.ac_status ? 'rgba(56, 189, 248, 0.3)' : 'transparent'}`,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Wind size={11} /> AC: {room.ac_status ? 'ON' : 'OFF'}
                </span>

                <span style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: room.light_status ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: room.light_status ? '#fbbf24' : 'var(--text-muted)',
                  border: `1px solid ${room.light_status ? 'rgba(251, 191, 36, 0.3)' : 'transparent'}`,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Lightbulb size={11} /> Lights: {room.light_status ? 'ON' : 'OFF'}
                </span>
              </div>

              {/* Reason Explanation if Anomaly Present */}
              {room.active_anomaly_reason && (
                <div style={{
                  fontSize: '0.74rem',
                  color: isCritical ? '#fca5a5' : '#fde68a',
                  background: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.12)',
                  padding: '6px 10px',
                  borderRadius: 6,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  <span>{room.active_anomaly_reason}</span>
                </div>
              )}

              {/* Inspect Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 600, gap: 4, marginTop: 6 }}>
                <span>Inspect Room Details</span>
                <ArrowRight size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

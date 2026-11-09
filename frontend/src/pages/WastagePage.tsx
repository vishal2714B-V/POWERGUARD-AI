import React, { useState, useEffect } from 'react';
import {
  AlertOctagon, Flame, Clock, IndianRupee, Zap,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { AnomalyItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DemoScenarioBar } from '../components/DemoScenarioBar';

interface WastagePageProps {
  onSelectRoom?: (roomId: number) => void;
}

export const WastagePage: React.FC<WastagePageProps> = ({ onSelectRoom }) => {
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [tab, setTab] = useState<'ACTIVE' | 'ALL'>('ACTIVE');

  const fetchAnomalies = async () => {
    try {
      const data = await api.getAnomalies();
      setAnomalies(data);
      if (data.length > 0 && expandedId === null) {
        setExpandedId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 6000);
    return () => clearInterval(interval);
  }, []);

  const displayedList = anomalies.filter((a) => {
    if (tab === 'ACTIVE') return a.is_wastage || a.severity === 'CRITICAL' || a.severity === 'WASTAGE';
    return true;
  });

  return (
    <div className="page-wrapper">
      <DemoScenarioBar onScenarioTriggered={fetchAnomalies} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertOctagon size={22} color="#ef4444" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Wastage & Anomaly Detection Center
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Real-time multi-variate anomaly classification powered by Scikit-Learn Isolation Forest.
          </p>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-card)', padding: 3, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setTab('ACTIVE')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              fontSize: '0.76rem',
              fontWeight: 600,
              background: tab === 'ACTIVE' ? '#ef4444' : 'transparent',
              color: tab === 'ACTIVE' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            Active Wastage Events
          </button>
          <button
            onClick={() => setTab('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              fontSize: '0.76rem',
              fontWeight: 600,
              background: tab === 'ALL' ? '#2563eb' : 'transparent',
              color: tab === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            All Historical Events
          </button>
        </div>
      </div>

      {/* Events List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {displayedList.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>All Systems Operating Normally</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              No active wastage or anomalous consumption conditions detected across monitored facility zones.
            </p>
          </div>
        ) : (
          displayedList.map((item) => {
            const isExpanded = expandedId === item.id;
            const isCritical = item.severity === 'CRITICAL' || item.severity === 'WASTAGE';

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  borderColor: isCritical ? '#ef4444' : 'var(--border-subtle)',
                  background: isCritical ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.08), var(--bg-card))' : 'var(--bg-card)',
                }}
              >
                {/* Header Row */}
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', flexWrap: 'wrap', gap: 12 }}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCritical ? '#ef4444' : '#f59e0b',
                    }}>
                      <Flame size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
                          Room {item.room_number} {item.room_name && `(${item.room_name})`}
                        </span>
                        <StatusBadge status={item.severity} size="sm" />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: isCritical ? '#fca5a5' : 'var(--text-secondary)', marginTop: 2 }}>
                        {item.reason}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Wastage Risk</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isCritical ? '#ef4444' : '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                        {item.risk_score} / 100
                      </div>
                    </div>

                    <div style={{ color: 'var(--text-muted)' }}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details & Factor Decomposition */}
                {isExpanded && (
                  <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border-subtle)' }}>
                    {/* Key Metrics Pill Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: 12,
                      marginBottom: 18,
                    }}>
                      <div style={{ background: 'rgba(7, 11, 19, 0.5)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Zap size={12} color="#38bdf8" /> Draw Level
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                          {item.power_kw} kW
                        </div>
                      </div>

                      <div style={{ background: 'rgba(7, 11, 19, 0.5)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} color="#f59e0b" /> Duration Unattended
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                          {item.duration_hours} hours
                        </div>
                      </div>

                      <div style={{ background: 'rgba(7, 11, 19, 0.5)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={12} color="#ef4444" /> Wasted Energy
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                          {item.wasted_kwh} kWh
                        </div>
                      </div>

                      <div style={{ background: 'rgba(7, 11, 19, 0.5)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IndianRupee size={12} color="#fbbf24" /> Estimated Cost Loss
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                          ₹{item.wasted_cost.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Contributing Risk Factors Breakdown (Section 2.D) */}
                    {item.factors && item.factors.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                          Contributing Risk Score Factors (Total: {item.risk_score} / 100)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {item.factors.map((f, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255, 255, 255, 0.02)',
                                padding: '8px 12px',
                                borderRadius: 6,
                                border: '1px solid var(--border-subtle)',
                                fontSize: '0.78rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                                <strong>{f.factor_name}:</strong>
                                <span style={{ color: 'var(--text-muted)' }}>{f.description}</span>
                              </div>
                              <span style={{ fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                                +{f.contribution_score} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      {onSelectRoom && (
                        <button
                          className="btn btn-outline"
                          style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                          onClick={() => onSelectRoom(item.room_id)}
                        >
                          Inspect Room {item.room_number} <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

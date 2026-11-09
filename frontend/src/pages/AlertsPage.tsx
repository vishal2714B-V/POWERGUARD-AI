import React, { useState, useEffect } from 'react';
import {
  Bell, AlertTriangle, AlertCircle, Info, Sparkles,
  Check, CheckCheck, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { AlertItem } from '../types';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const fetchAlerts = async () => {
    try {
      const data = await api.getAlerts(severityFilter);
      setAlerts(data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [severityFilter]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markAlertRead(id);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertsRead();
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'CRITICAL':
        return <AlertTriangle size={18} color="#ef4444" />;
      case 'WARNING':
        return <AlertCircle size={18} color="#f59e0b" />;
      case 'OPTIMIZATION':
        return <Sparkles size={18} color="#10b981" />;
      default:
        return <Info size={18} color="#38bdf8" />;
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={22} color="#38bdf8" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Operational Incident & Alert Center
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Real-time critical events and anomaly flags dispatched by automated AI facility agents.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', padding: '7px 12px' }}
            onClick={handleMarkAllRead}
          >
            <CheckCheck size={14} /> Mark All as Read
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['ALL', 'CRITICAL', 'WARNING', 'OPTIMIZATION', 'INFO'].map((sev) => (
          <button
            key={sev}
            className={`btn ${severityFilter === sev ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.74rem', padding: '6px 12px' }}
            onClick={() => setSeverityFilter(sev)}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alerts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <Check size={32} color="#10b981" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>No Active Unresolved Alerts</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              All electrical consumption metrics across campus are within target baselines.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
                padding: '16px 20px',
                borderLeft: `4px solid ${
                  alert.alert_type === 'CRITICAL'
                    ? '#ef4444'
                    : alert.alert_type === 'WARNING'
                    ? '#f59e0b'
                    : '#38bdf8'
                }`,
                background: alert.is_read ? 'var(--bg-card)' : 'rgba(15, 23, 42, 0.95)',
                opacity: alert.is_read ? 0.65 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ marginTop: 2 }}>{getAlertIcon(alert.alert_type)}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                      {alert.title}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-secondary)',
                    }}>
                      Room {alert.room_number}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {alert.message}
                  </p>

                  {alert.recommended_action && (
                    <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: 6 }}>
                      <strong>Action:</strong> {alert.recommended_action}
                    </div>
                  )}
                </div>
              </div>

              {!alert.is_read && (
                <button
                  className="btn btn-outline"
                  style={{ fontSize: '0.74rem', padding: '5px 10px', flexShrink: 0 }}
                  onClick={() => handleMarkRead(alert.id)}
                >
                  <Check size={12} /> Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Bell, Wifi, Clock, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  pageTitle: string;
  unreadCount?: number;
  onOpenAlerts?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  pageTitle,
  unreadCount = 0,
  onOpenAlerts,
}) => {
  const { user } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {pageTitle}
        </h2>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '2px 8px',
          borderRadius: 9999,
          fontSize: '0.72rem',
          color: '#34d399',
          fontWeight: 600,
        }}>
          <Wifi size={12} />
          Telemetry: LIVE (5s)
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
          <Clock size={14} />
          <span>{timeStr}</span>
        </div>

        {/* Alerts Bell */}
        <button
          onClick={onOpenAlerts}
          style={{
            position: 'relative',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Open Alerts Center"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#ef4444',
              color: 'white',
              fontSize: '0.62rem',
              fontWeight: 800,
              width: 17,
              height: 17,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-secondary)',
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        {/* User indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          padding: '4px 12px',
          borderRadius: 8,
        }}>
          <Shield size={14} color="#38bdf8" />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.role === 'ADMIN' ? 'Building Facility Admin' : 'Room In-Charge'}
          </span>
        </div>
      </div>
    </header>
  );
};

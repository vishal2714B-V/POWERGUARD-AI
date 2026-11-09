import React from 'react';
import {
  LayoutDashboard, Activity, DoorOpen, LineChart, AlertOctagon,
  Lightbulb, SlidersHorizontal, Receipt, FileText, Bell,
  Settings, LogOut, Zap, ShieldCheck, User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  unreadAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  unreadAlertsCount = 0,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'monitoring', label: 'Live Monitoring', icon: <Activity size={18} /> },
    { id: 'room-detail', label: 'Room Inspection', icon: <DoorOpen size={18} /> },
    { id: 'prediction', label: 'AI Prediction', icon: <LineChart size={18} /> },
    { id: 'wastage', label: 'Wastage Detection', icon: <AlertOctagon size={18} /> },
    { id: 'recommendations', label: 'Recommendations', icon: <Lightbulb size={18} /> },
    { id: 'simulation', label: 'What-If Simulation', icon: <SlidersHorizontal size={18} /> },
    { id: 'wastage-charge', label: 'Smart Wastage Charge', icon: <Receipt size={18} /> },
    { id: 'reports', label: 'Energy Reports', icon: <FileText size={18} /> },
    {
      id: 'alerts',
      label: 'Alert Center',
      icon: <Bell size={18} />,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
    },
    ...(user?.role === 'ADMIN'
      ? [{ id: 'settings', label: 'System Settings', icon: <Settings size={18} /> }]
      : []),
    { id: 'user-portal', label: 'Assigned Room Portal', icon: <UserIcon size={18} /> },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '22px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #0284c7, #2563eb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)',
        }}>
          <Zap size={22} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            POWERGUARD <span style={{ color: '#38bdf8' }}>AI</span>
          </h1>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Smart Energy Management
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px 10px' }}>
          Operations & Intelligence
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 8,
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(90deg, #1e3a8a, #1e293b)' : 'transparent',
                  border: isActive ? '1px solid #3b82f6' : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: isActive ? '#38bdf8' : 'var(--text-muted)' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span style={{
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 9999,
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Footer */}
      <div style={{
        padding: '16px 18px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(7, 11, 19, 0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              fontWeight: 700,
              fontSize: '0.82rem',
              border: '1px solid var(--border-subtle)',
            }}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.username || 'Guest'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={11} color="#34d399" />
                <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700 }}>
                  {user?.role || 'USER'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
            }}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

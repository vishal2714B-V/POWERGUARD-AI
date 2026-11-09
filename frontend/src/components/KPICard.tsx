import React from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  badge?: React.ReactNode;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  unit,
  subtitle,
  icon,
  accentColor = '#38bdf8',
  badge,
}) => {
  return (
    <div className="kpi-card" style={{ borderLeft: `3px solid ${accentColor}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="kpi-label">{label}</span>
        {icon && <span style={{ color: accentColor, opacity: 0.85 }}>{icon}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="kpi-value">{value}</span>
        {unit && <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600 }}>{unit}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        {subtitle && <span className="kpi-subtitle">{subtitle}</span>}
        {badge && <div>{badge}</div>}
      </div>
    </div>
  );
};

import React from 'react';

interface StatusBadgeProps {
  status: 'NORMAL' | 'WARNING' | 'WASTAGE' | 'CRITICAL' | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let badgeClass = 'badge-normal';
  let dotColor = '#10b981';

  if (normalized === 'CRITICAL') {
    badgeClass = 'badge-critical';
    dotColor = '#ef4444';
  } else if (normalized === 'WASTAGE') {
    badgeClass = 'badge-wastage';
    dotColor = '#f87171';
  } else if (normalized === 'WARNING') {
    badgeClass = 'badge-warning';
    dotColor = '#f59e0b';
  }

  const paddingStyle = size === 'sm' ? { padding: '2px 8px', fontSize: '0.68rem' } : {};

  return (
    <span className={`badge ${badgeClass}`} style={paddingStyle}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block',
        }}
      />
      {normalized}
    </span>
  );
};

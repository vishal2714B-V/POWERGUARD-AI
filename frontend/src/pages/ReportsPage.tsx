import React, { useState, useEffect } from 'react';
import {
  FileText, Download, IndianRupee, Zap, Leaf,
  TrendingDown, AlertOctagon, BarChart2
} from 'lucide-react';
import { api } from '../services/api';
import { KPICard } from '../components/KPICard';

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.getReportSummary();
        setData(res);
      } catch (err) {
        console.error('Failed to load report summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const handleDownloadCSV = () => {
    window.open(api.getCSVExportUrl(), '_blank');
  };

  if (loading || !data) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: 60 }}>
        <FileText size={32} color="#38bdf8" />
        <div style={{ marginTop: 14, color: 'var(--text-secondary)' }}>Compiling monthly institutional audit...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} color="#38bdf8" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Executive Energy & Sustainability Audit
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Comprehensive institutional analytics, cost reconciliations, and greenhouse gas reductions.
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ fontSize: '0.82rem', padding: '9px 16px' }}
          onClick={handleDownloadCSV}
        >
          <Download size={15} /> Export Audit CSV Data
        </button>
      </div>

      {/* KPI Cards: Daily, Weekly, Monthly Aggregates (Section 26) */}
      <div className="kpi-grid">
        <KPICard
          label="Daily Consumption"
          value={data.daily_consumption_kwh}
          unit="kWh"
          subtitle="Past 24-hour aggregate"
          icon={<Zap size={20} />}
          accentColor="#38bdf8"
        />

        <KPICard
          label="Weekly Consumption"
          value={data.weekly_consumption_kwh.toLocaleString()}
          unit="kWh"
          subtitle="7-day running aggregate"
          icon={<BarChart2 size={20} />}
          accentColor="#60a5fa"
        />

        <KPICard
          label="Monthly Consumption"
          value={data.monthly_consumption_kwh.toLocaleString()}
          unit="kWh"
          subtitle="30-day facility load"
          icon={<BarChart2 size={20} />}
          accentColor="#a855f7"
        />

        <KPICard
          label="Monthly Cost"
          value={`₹${data.total_cost_inr.toLocaleString()}`}
          subtitle="Computed at ₹8.00 / kWh tariff"
          icon={<IndianRupee size={20} />}
          accentColor="#fbbf24"
        />

        <KPICard
          label="Monthly Wastage Cost"
          value={`₹${data.wastage_cost_inr.toLocaleString()}`}
          subtitle={`${data.wastage_energy_kwh} kWh avoidable waste`}
          icon={<AlertOctagon size={20} />}
          accentColor="#ef4444"
        />

        <KPICard
          label="CO₂ Reduction Potential"
          value={`${data.co2_reduction_kg.toLocaleString()} kg`}
          subtitle="By eliminating idle HVAC"
          icon={<Leaf size={20} />}
          accentColor="#34d399"
        />
      </div>

      {/* Side-by-side Tables: Top Consumers vs Top Wastage Rooms */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* Top Consuming Rooms */}
        <div className="card">
          <div className="card-title">
            <Zap size={18} color="#38bdf8" />
            <span>Top Energy Consuming Zones</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Zone Name</th>
                  <th>Monthly Energy</th>
                  <th>Monthly Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.top_consuming_rooms.map((r: any) => (
                  <tr key={r.room_id}>
                    <td style={{ fontWeight: 700 }}>Room {r.room_number}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{r.monthly_kwh} kWh</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fbbf24' }}>₹{r.monthly_cost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Wastage Rooms */}
        <div className="card">
          <div className="card-title">
            <AlertOctagon size={18} color="#ef4444" />
            <span>Top Identified Wastage Locations</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Wasted Load</th>
                  <th>Cost Impact</th>
                  <th>Primary Factor</th>
                </tr>
              </thead>
              <tbody>
                {data.top_wastage_rooms.map((w: any) => (
                  <tr key={w.room_number}>
                    <td style={{ fontWeight: 700, color: '#f87171' }}>Room {w.room_number}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#f87171', fontWeight: 600 }}>{w.wasted_kwh} kWh</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>₹{w.wasted_cost}</td>
                    <td style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{w.primary_cause}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

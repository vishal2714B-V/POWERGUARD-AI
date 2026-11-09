import React, { useState, useEffect } from 'react';
import {
  Receipt, AlertTriangle, ShieldCheck, IndianRupee,
  Scale, Calculator, Info, FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { WastageChargeItem } from '../types';
import { KPICard } from '../components/KPICard';

export const SmartWastageChargePage: React.FC = () => {
  const [expectedKwh, setExpectedKwh] = useState<number>(400);
  const [actualKwh, setActualKwh] = useState<number>(450);
  const [penaltyRate, setPenaltyRate] = useState<number>(10);

  const [activeCharge, setActiveCharge] = useState<WastageChargeItem | null>(null);
  const [history, setHistory] = useState<WastageChargeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const calculateCharge = async () => {
    setLoading(true);
    try {
      const res = await api.calculateWastageCharge({
        expected_kwh: expectedKwh,
        actual_kwh: actualKwh,
        penalty_rate: penaltyRate,
      });
      setActiveCharge(res);
    } catch (err) {
      console.error('Failed to calculate wastage charge:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const list = await api.getWastageCharges();
      setHistory(list);
    } catch (err) {
      console.error('Error fetching charge history:', err);
    }
  };

  useEffect(() => {
    calculateCharge();
    fetchHistory();
  }, [expectedKwh, actualKwh, penaltyRate]);

  return (
    <div className="page-wrapper">
      {/* Abstract Concept Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Receipt size={22} color="#fbbf24" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Simulated Smart Wastage Charge
          </h2>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Behavioural economics framework penalizing avoidable unoccupied or excessive electrical consumption.
        </p>
      </div>

      {/* Mandatory Regulatory / Educational Disclaimer Callout */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: 12,
        padding: '14px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <Info size={22} color="#fbbf24" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.82rem', color: '#fef3c7' }}>
          <strong>SIMULATED SMART WASTAGE CHARGE NOTICE:</strong> This is a simulated behavioural charge intended to encourage responsible energy usage across colleges, hostels, and academic departments. <u>It is not an actual electricity bill.</u>
        </div>
      </div>

      {/* Main Example Calculation Cards (Section 11) */}
      <div className="kpi-grid">
        <KPICard
          label="Expected Baseline"
          value={activeCharge ? activeCharge.expected_kwh : expectedKwh}
          unit="kWh"
          subtitle="AI Predicted Target"
          icon={<Scale size={20} />}
          accentColor="#38bdf8"
        />

        <KPICard
          label="Actual Consumption"
          value={activeCharge ? activeCharge.actual_kwh : actualKwh}
          unit="kWh"
          subtitle="Monitored meter consumption"
          icon={<AlertTriangle size={20} />}
          accentColor="#ef4444"
        />

        <KPICard
          label="Avoidable Excess"
          value={activeCharge ? activeCharge.avoidable_excess_kwh : (actualKwh - expectedKwh)}
          unit="kWh"
          subtitle="Direct preventable waste"
          icon={<Calculator size={20} />}
          accentColor="#fbbf24"
        />

        <KPICard
          label="Configurable Penalty Rate"
          value={`₹${penaltyRate.toFixed(2)}`}
          unit="/kWh"
          subtitle="Surcharge rate per excess kWh"
          icon={<IndianRupee size={20} />}
          accentColor="#a855f7"
        />

        <KPICard
          label="Simulated Wastage Charge"
          value={activeCharge ? `₹${activeCharge.simulated_charge_inr.toFixed(0)}` : '₹500'}
          subtitle="Avoidable Excess × Rate"
          icon={<Receipt size={20} />}
          accentColor="#ef4444"
        />
      </div>

      {/* Interactive Formulation & Calculator Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 26 }}>
        {/* Formula breakdown & live slider */}
        <div className="card">
          <div className="card-title">
            <Calculator size={18} color="#fbbf24" />
            <span>Interactive Charge Formulation Parameters</span>
          </div>

          <div style={{ background: 'rgba(7, 11, 19, 0.6)', padding: 14, borderRadius: 8, marginBottom: 18, border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#38bdf8' }}>
            Avoidable Excess = max(0, Actual kWh - Expected kWh)<br />
            Simulated Charge = Avoidable Excess kWh × ₹{penaltyRate}/kWh
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
                <span>Expected Consumption (kWh):</span>
                <span style={{ color: '#38bdf8' }}>{expectedKwh} kWh</span>
              </div>
              <input
                type="range"
                min={200}
                max={800}
                step={10}
                value={expectedKwh}
                onChange={(e) => setExpectedKwh(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
                <span>Actual Consumption (kWh):</span>
                <span style={{ color: '#ef4444' }}>{actualKwh} kWh</span>
              </div>
              <input
                type="range"
                min={200}
                max={800}
                step={10}
                value={actualKwh}
                onChange={(e) => setActualKwh(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ef4444' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
                <span>Simulated Penalty Rate (₹ / kWh):</span>
                <span style={{ color: '#fbbf24' }}>₹{penaltyRate} / kWh</span>
              </div>
              <input
                type="range"
                min={5}
                max={25}
                step={1}
                value={penaltyRate}
                onChange={(e) => setPenaltyRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#fbbf24' }}
              />
            </div>
          </div>
        </div>

        {/* Big Highlight Assessment Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), var(--bg-card))', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Simulated Assessment Statement
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#ef4444', fontFamily: 'var(--font-mono)', margin: '10px 0' }}>
            ₹{activeCharge ? activeCharge.simulated_charge_inr.toFixed(0) : '500'}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>
            {activeCharge?.avoidable_excess_kwh || 50} kWh Avoidable Excess Detected
          </div>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 8, maxWidth: 360, margin: '8px auto 0' }}>
            Encourages students and faculty to switch off climate control and illumination when vacating seminar spaces.
          </p>
        </div>
      </div>

      {/* Charge Ledger Table */}
      <div className="card">
        <div className="card-title">
          <FileSpreadsheet size={18} color="#38bdf8" />
          <span>Departmental Wastage Assessment Ledger</span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Facility Zone</th>
                <th>Billing Period</th>
                <th>Expected (kWh)</th>
                <th>Actual (kWh)</th>
                <th>Avoidable Excess</th>
                <th>Penalty Surcharge</th>
                <th>Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{h.room_number}</td>
                  <td>{h.billing_period}</td>
                  <td>{h.expected_kwh}</td>
                  <td>{h.actual_kwh}</td>
                  <td style={{ color: '#f87171', fontWeight: 600 }}>+{h.avoidable_excess_kwh} kWh</td>
                  <td style={{ fontWeight: 700, color: '#fbbf24' }}>₹{h.simulated_charge_inr.toFixed(2)}</td>
                  <td>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                    }}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

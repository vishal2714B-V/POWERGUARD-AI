import React, { useState, useEffect } from 'react';
import {
  Lightbulb, CheckCircle2, XCircle, Sparkles, Zap,
  IndianRupee, Leaf, ArrowRight, Check
} from 'lucide-react';
import { api } from '../services/api';
import { RecommendationItem } from '../types';
import { KPICard } from '../components/KPICard';

export const RecommendationsPage: React.FC = () => {
  const [recs, setRecs] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      const data = await api.getRecommendations();
      setRecs(data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleApply = async (id: number) => {
    try {
      await api.applyRecommendation(id);
      setFeedback(`Applied recommendation #${id} successfully.`);
      setTimeout(() => setFeedback(null), 3000);
      fetchRecommendations();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await api.dismissRecommendation(id);
      setFeedback(`Dismissed recommendation #${id}.`);
      setTimeout(() => setFeedback(null), 3000);
      fetchRecommendations();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  const pendingRecs = recs.filter((r) => r.status === 'PENDING');
  const totalKwh = pendingRecs.reduce((acc, r) => acc + r.estimated_kwh_saving, 0);
  const totalCost = pendingRecs.reduce((acc, r) => acc + r.estimated_cost_saving, 0);
  const totalCo2 = pendingRecs.reduce((acc, r) => acc + r.estimated_co2_saving, 0);

  const filteredRecs = recs.filter((r) => {
    if (filter === 'ALL') return true;
    return r.category.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={22} color="#38bdf8" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            AI Advisory & Energy Optimization Engine
          </h2>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Continuous rule-based and predictive suggestions derived from real-time occupancy and load analysis.
        </p>
      </div>

      {feedback && (
        <div style={{
          background: 'rgba(56, 189, 248, 0.15)',
          border: '1px solid #38bdf8',
          borderRadius: 8,
          padding: '10px 16px',
          marginBottom: 20,
          color: '#38bdf8',
          fontSize: '0.84rem',
        }}>
          {feedback}
        </div>
      )}

      {/* Aggregate Savings KPI Cards */}
      <div className="kpi-grid">
        <KPICard
          label="Recoverable Energy"
          value={totalKwh.toFixed(1)}
          unit="kWh/day"
          subtitle="From pending recommendations"
          icon={<Zap size={20} />}
          accentColor="#38bdf8"
        />

        <KPICard
          label="Recoverable Cost"
          value={`₹${totalCost.toFixed(0)}`}
          unit="/day"
          subtitle="Estimated operational reduction"
          icon={<IndianRupee size={20} />}
          accentColor="#fbbf24"
        />

        <KPICard
          label="Carbon Abatement"
          value={totalCo2.toFixed(1)}
          unit="kg CO₂/day"
          subtitle="Calculated at 0.82 kg/kWh"
          icon={<Leaf size={20} />}
          accentColor="#34d399"
        />
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'All Recommendations', val: 'ALL' },
          { label: 'Turn off appliance', val: 'Turn off' },
          { label: 'Avoid unnecessary lighting', val: 'lighting' },
          { label: 'Reduce temperature setpoint', val: 'temperature' },
          { label: 'Optimize high-consumption', val: 'Optimize' },
        ].map((btn) => (
          <button
            key={btn.val}
            className={`btn ${filter === btn.val ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.74rem', padding: '6px 12px' }}
            onClick={() => setFilter(btn.val)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Recommendations Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredRecs.map((rec) => {
          const isApplied = rec.status === 'APPLIED';
          const isDismissed = rec.status === 'DISMISSED';

          return (
            <div
              key={rec.id}
              className="card"
              style={{
                opacity: isDismissed ? 0.5 : 1,
                borderLeft: `4px solid ${isApplied ? '#10b981' : '#3b82f6'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                      {rec.category}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Room {rec.room_number}
                    </span>
                    {isApplied && (
                      <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={12} /> APPLIED
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
                    {rec.problem}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    <strong>Action:</strong> {rec.suggested_action}
                  </div>

                  {/* Savings Triplet */}
                  <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.76rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '3px 8px', borderRadius: 6 }}>
                      ⚡ Energy: <strong>{rec.estimated_kwh_saving} kWh/day</strong>
                    </span>
                    <span style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '3px 8px', borderRadius: 6 }}>
                      💰 Cost Saving: <strong>₹{rec.estimated_cost_saving}/day</strong>
                    </span>
                    <span style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: 6 }}>
                      🌱 Carbon Saving: <strong>{rec.estimated_co2_saving} kg CO₂/day</strong>
                    </span>
                  </div>
                </div>

                {rec.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '0.78rem', padding: '7px 12px' }}
                      onClick={() => handleApply(rec.id)}
                    >
                      <CheckCircle2 size={14} /> Apply Recommendation
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: '0.78rem', padding: '7px 10px' }}
                      onClick={() => handleDismiss(rec.id)}
                    >
                      <XCircle size={14} /> Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

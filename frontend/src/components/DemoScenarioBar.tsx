import React, { useState } from 'react';
import { Play, Sparkles, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import { api } from '../services/api';

interface DemoScenarioBarProps {
  onScenarioTriggered?: () => void;
}

export const DemoScenarioBar: React.FC<DemoScenarioBarProps> = ({ onScenarioTriggered }) => {
  const [activeScenario, setActiveScenario] = useState<string>('wastage');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleTrigger = async (type: 'normal' | 'wastage' | 'high-load', label: string) => {
    setLoading(true);
    try {
      await api.triggerDemoScenario(type);
      setActiveScenario(type);
      setFeedback(`Active: ${label}`);
      setTimeout(() => setFeedback(null), 3000);
      if (onScenarioTriggered) {
        onScenarioTriggered();
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="demo-bar">
      <div className="demo-title">
        <Sparkles size={16} />
        <span>Presentation Demo Mode</span>
        {feedback && (
          <span style={{ fontSize: '0.75rem', color: '#38bdf8', marginLeft: 8 }}>
            ({feedback})
          </span>
        )}
      </div>

      <div className="scenario-buttons">
        <button
          className={`scenario-btn ${activeScenario === 'wastage' ? 'active-danger' : ''}`}
          onClick={() => handleTrigger('wastage', 'Scenario 2: Severe AC Wastage in Room 204')}
          disabled={loading}
          title="Triggers 0 occupancy with AC running at 2.4 kW in Room 204 (Status: CRITICAL WASTAGE)"
        >
          <Flame size={13} style={{ display: 'inline', marginRight: 4 }} />
          Scenario 2: AC Wastage (Room 204)
        </button>

        <button
          className={`scenario-btn ${activeScenario === 'normal' ? 'active-success' : ''}`}
          onClick={() => handleTrigger('normal', 'Scenario 1: Normal Operational Usage')}
          disabled={loading}
          title="Normalizes occupancy and load across all rooms (Status: NORMAL)"
        >
          <CheckCircle size={13} style={{ display: 'inline', marginRight: 4 }} />
          Scenario 1: Normal Usage
        </button>

        <button
          className={`scenario-btn ${activeScenario === 'high-load' ? 'active-danger' : ''}`}
          onClick={() => handleTrigger('high-load', 'Scenario 3: Peak Load Surge')}
          disabled={loading}
          title="Spikes consumption to 4.2 kW in Lecture Hall A"
        >
          <AlertTriangle size={13} style={{ display: 'inline', marginRight: 4 }} />
          Scenario 3: Peak Surge
        </button>
      </div>
    </div>
  );
};

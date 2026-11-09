import React, { useState } from 'react';
import { Zap, Lock, User as UserIcon, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, #172554 0%, #080c14 80%)',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-highlight)',
        borderRadius: 18,
        padding: '36px 32px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 60px rgba(37, 99, 235, 0.15)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #0284c7, #2563eb)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
          }}>
            <Zap size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            POWERGUARD <span style={{ color: '#38bdf8' }}>AI</span>
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            AI-Powered Smart Energy Management System
          </p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#f87171',
            fontSize: '0.82rem',
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 38 }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: 38 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: 10, fontSize: '0.92rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (
              <>
                Sign In to System <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Presentation Demo Quick Logins */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, textAlign: 'center' }}>
            Evaluator Demo Credentials
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.76rem', padding: '8px 10px', justifyContent: 'center' }}
              onClick={() => handleQuickLogin('admin', 'admin123')}
            >
              <ShieldCheck size={14} color="#38bdf8" />
              Admin (admin)
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.76rem', padding: '8px 10px', justifyContent: 'center' }}
              onClick={() => handleQuickLogin('user', 'user123')}
            >
              <UserIcon size={14} color="#34d399" />
              Faculty (user)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { loginUser, wakeUpBackend } from '../services/api';
import '../styles/Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const triggerWakeup = async () => {
      setWaking(true);
      await wakeUpBackend();
      setWaking(false);
    };
    triggerWakeup();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(false);
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(email, name);
      if (result.success && result.user) {
        auth.login(result.user);
        navigate('/dashboard');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      const errMsg = String(err?.message || err || '').toLowerCase();
      if (errMsg.includes('network error') || errMsg.includes('econnrefused') || errMsg.includes('timeout')) {
        setError('Backend is waking up (free tier cold start). Please wait 30-60 seconds and try again.');
      } else {
        setError(err?.response?.data?.error || 'Login failed. Connection refused.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-orb orb-1"></div>
      <div className="auth-orb orb-2"></div>

      <div className="auth-card glass-card">
        {waking && (
          <div 
            className="animate-pulse"
            style={{ 
              backgroundColor: 'rgba(255, 69, 0, 0.12)', 
              border: '1px solid rgba(255, 69, 0, 0.3)', 
              color: '#ff8c00', 
              padding: '8px 12px', 
              borderRadius: '8px', 
              fontSize: '0.825rem', 
              marginBottom: '1.25rem',
              textAlign: 'center',
              fontWeight: 500
            }}
          >
            ⏳ Waking up backend server...
          </div>
        )}

        <div className="auth-header">
          <div style={{ fontSize: '4.5rem', marginBottom: '1rem', textAlign: 'center' }}>🔥</div>
          <h1>Agniv 2.0</h1>
          <p>AI Fire & Smoke Detection</p>
        </div>

        {error && (
          <div 
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.15)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              color: '#ef4444', 
              padding: '10px 14px', 
              borderRadius: '8px', 
              fontSize: '0.875rem', 
              marginBottom: '1.5rem' 
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper" style={{ display: 'block' }}>
              <input
                id="email"
                type="email"
                placeholder="Enter any email — no verification needed"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '16px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">Name (Optional)</label>
            <div className="input-wrapper" style={{ display: 'block' }}>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: '16px' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In →'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Any email works. No verification required.</p>
        </div>
      </div>
    </div>
  );
}

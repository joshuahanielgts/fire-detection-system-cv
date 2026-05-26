import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Zap, MapPin } from 'lucide-react'
import '../styles/Landing.css'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing-container">
      {/* Animated Background Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* Header */}
      <header className="landing-header fade-in-down">
        <div className="header-content">
          <div className="logo">
            <Shield className="logo-icon" />
            <span>Agniv2.0</span>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero fade-in-up">
        <div className="hero-badge">
          <span>🔥 AI-Powered Fire Safety System</span>
        </div>
        
        <h1>Intelligent Fire Safety,<br /><span className="gradient-text">Instant Peace of Mind</span></h1>
        
        <p className="hero-subtitle">
          Advanced AI monitoring that detects fire hazards in real-time and instantly alerts both property 
          owners and emergency responders for rapid intervention.
        </p>

        <div className="hero-buttons">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
            <Shield className="w-5 h-5" />
            Secure My Property
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
            <Zap className="w-5 h-5" />
            Join as Responder
          </button>
        </div>

        {/* Feature Cards */}
        <div className="features-grid">
          <div className="feature-card glass-card slide-in-left">
            <div className="feature-icon">
              <Zap />
            </div>
            <h3>Real-Time Detection</h3>
            <p>AI-powered YOLO detection catches fire hazards instantly across all monitored areas</p>
          </div>
          
          <div className="feature-card glass-card slide-in-left" style={{ animationDelay: '0.1s' }}>
            <div className="feature-icon">
              <MapPin />
            </div>
            <h3>Instant Alerts</h3>
            <p>GPS-enabled notifications to both property owners and nearest fire stations in seconds</p>
          </div>
          
          <div className="feature-card glass-card slide-in-left" style={{ animationDelay: '0.2s' }}>
            <div className="feature-icon">
              <Shield />
            </div>
            <h3>Verified Response</h3>
            <p>Automated coordination with emergency services for verified rapid intervention</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="glass-card cta-card">
          <h2>Ready to Protect Your Property?</h2>
          <p>Join thousands of property owners using Agniv2.0 for intelligent fire safety</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; 2026 Agniv2.0. Advanced AI Fire Detection System.</p>
      </footer>
    </div>
  )
}

import React, { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, User, LogOut, Plus, MapPin, Camera } from 'lucide-react'
import { AuthContext } from '../App'
import { fetchProperties, fetchStatus } from '../services/api'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, handleLogout } = useContext(AuthContext)
  const [properties, setProperties] = useState([])
  const [status, setStatus] = useState({ is_detecting: false, fps: 0, alert_count: 0 })
  const [loading, setLoading] = useState(true)

  const handleLogoutClick = () => {
    handleLogout()
    navigate('/')
  }

  const loadData = async () => {
    try {
      const response = await fetchProperties()
      setProperties(response.data.properties || [])
    } catch (error) {
      console.error('Failed to load properties', error)
    }

    try {
      const statusResponse = await fetchStatus()
      setStatus(statusResponse.data)
    } catch (error) {
      console.error('Failed to load status', error)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="dashboard-container">
      <nav className="dashboard-navbar glass-card">
        <div className="navbar-content">
          <div className="navbar-left">
            <h2>Agniv2.0 Dashboard</h2>
            <p>Welcome back, {user?.name || 'User'}</p>
          </div>
          <div className="navbar-right">
            <div className="navbar-hint">
              <span>To exit full screen, press and hold</span>
              <kbd>Esc</kbd>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate('/verify')}>
              Face Verification
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/fire-station')}>
              Fire Station
            </button>
            <button className="btn-icon-sm" onClick={handleLogoutClick} title="Logout">
              <LogOut className="navbar-icon" />
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <section className="dashboard-header">
          <div>
            <h1>My Properties</h1>
            <p>Manage your protected properties</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/add-property')}>
            <Plus className="w-5 h-5" />
            Add Property
          </button>
        </section>

        <section className="dashboard-summary glass-card">
          <div className="summary-item">
            <span className="summary-value">{properties.length}</span>
            <span className="summary-label">Protected Properties</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{status.alert_count || 0}</span>
            <span className="summary-label">Active Alerts</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{status.fps || 0}</span>
            <span className="summary-label">Detection FPS</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{status.is_detecting ? 'Live' : 'Idle'}</span>
            <span className="summary-label">AI Monitoring</span>
          </div>
        </section>

        <section className="properties-grid">
          {loading ? (
            <div className="loading-state glass-card">Loading properties...</div>
          ) : properties.length === 0 ? (
            <div className="loading-state glass-card">No properties found.</div>
          ) : (
            properties.map((property) => (
              <div
                key={property.id}
                className="property-card glass-card"
                onClick={() => navigate(`/camera/${property.id}`)}
              >
                <div className="property-header">
                  <div className="property-icon">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div className="property-actions">
                    <button className="btn-icon-sm" type="button">
                      <Camera className="w-4 h-4" />
                    </button>
                    <button className="btn-icon-sm" type="button">
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="property-info">
                  <div className="camera-badge">
                    <Camera className="w-3 h-3" />
                    <span>{property.cameras} cameras</span>
                  </div>
                </div>

                <div className="property-body">
                  <h3>{property.name}</h3>
                  <p className="property-address">{property.address}</p>
                </div>

                <div className="property-footer">
                  <div className={`location-badge ${property.status === 'active' ? 'active' : 'inactive'}`}>
                    <MapPin className="w-4 h-4" />
                    <span>{property.coordinates}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="demo-section">
          <h2>Live AI Demo</h2>
          <p>Test the fire detection system in real-time</p>

          <div className="demo-grid">
            <div className="demo-card glass-card">
              <h3>Demo Controls</h3>
              <button className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => navigate('/camera/1')}>
                <Camera className="w-5 h-5" />
                Open Camera Monitor
              </button>
              <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => navigate('/camera/1')}>
                Choose File
              </button>
              <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => navigate('/camera/1')}>
                Upload Demo Video
              </button>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/camera/1')}>
                Simulate Fire Alert
              </button>
            </div>

            <div className="demo-card glass-card">
              <h3>Live AI Detection</h3>
              <div className="demo-video">
                <p>Select a demo option to start AI detection</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

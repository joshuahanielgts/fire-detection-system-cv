import React, { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, AlertTriangle, Shield, Users, Clock, CheckCircle, Compass } from 'lucide-react'
import { AuthContext } from '../App'
import { fetchStatus, getAlerts, clearAlerts } from '../services/api'
import '../styles/FireStationDashboard.css'

export default function FireStationDashboard() {
  const navigate = useNavigate()
  const { handleLogout } = useContext(AuthContext)
  const [status, setStatus] = useState({ is_detecting: false, fps: 0, alert_count: 0, fire: false, smoke: false })
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [myLocation, setMyLocation] = useState(null)
  const [geoError, setGeoError] = useState('')

  const mapUrl = myLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${myLocation.lng - 0.02}%2C${myLocation.lat - 0.01}%2C${myLocation.lng + 0.02}%2C${myLocation.lat + 0.01}&layer=mapnik&marker=${myLocation.lat}%2C${myLocation.lng}`
    : null

  const fireStation = {
    name: 'Central Fire Station',
    coordinates: { lat: 9.7557, lng: 76.6487 },
    accuracy: 10,
    onDuty: 12,
    enRoute: 0,
    total: 12
  }

  const responders = [
    { id: 1, name: 'Fire Truck Unit 01', type: 'Heavy Duty', status: 'Available', coords: '9.7557, 76.6487' },
    { id: 2, name: 'Ambulance Unit 02', type: 'Medical', status: 'Available', coords: '9.7550, 76.6480' },
    { id: 3, name: 'Fire Truck Unit 03', type: 'Light Duty', status: 'Available', coords: '9.7560, 76.6490' },
    { id: 4, name: 'Response Team 04', type: 'Ground', status: 'On Standby', coords: '9.7565, 76.6495' }
  ]

  const loadStatus = async () => {
    try {
      const statusResponse = await fetchStatus()
      setStatus(statusResponse.data)
    } catch (error) {
      console.error('Failed to load status', error)
    }
  }

  const loadAlerts = async () => {
    try {
      const alertsResponse = await getAlerts()
      setAlerts(alertsResponse.data.alerts || [])
    } catch (error) {
      console.error('Failed to load alerts', error)
    }
  }

  const refreshDashboard = async () => {
    setLoading(true)
    await Promise.all([loadStatus(), loadAlerts()])
    setLoading(false)
  }

  useEffect(() => {
    refreshDashboard()
    const interval = setInterval(refreshDashboard, 6000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setMyLocation({ lat: latitude, lng: longitude, accuracy: position.coords.accuracy })
      },
      (error) => {
        setGeoError(error.message || 'Unable to retrieve your location.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000
      }
    )
  }, [])

  const handleClearAlerts = async () => {
    try {
      await clearAlerts()
      setAlerts([])
      setStatus((prev) => ({ ...prev, alert_count: 0 }))
    } catch (error) {
      console.error('Clear alerts failed', error)
    }
  }

  return (
    <div className="fire-station-container">
      <header className="fire-station-header glass-card">
        <div className="header-left">
          <button className="btn-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2>Fire Station Dashboard</h2>
            <p>Real-time Emergency Response Center</p>
          </div>
        </div>
        <button className="btn-icon" onClick={() => { handleLogout(); navigate('/'); }}>
          ✕
        </button>
      </header>

      <div className="fire-station-content">
        <section className="status-section">
          <div className="status-card glass-card highlight">
            <div className="status-icon all-clear">
              <CheckCircle className="w-12 h-12" />
            </div>
            <div className="status-info">
              <h3>Status</h3>
              <p className="status-text">{status.fire ? 'Emergency Detected' : 'All Clear!'}</p>
            </div>
          </div>

          <div className="status-card glass-card">
            <div className="status-header">
              <MapPin className="w-5 h-5 text-orange-400" />
              <h3>Location</h3>
            </div>
            <div className="location-info">
              <p className="coordinates">{fireStation.coordinates.lat}, {fireStation.coordinates.lng}</p>
              <p className="accuracy">Accuracy: ±{fireStation.accuracy}m</p>
            </div>
          </div>

          <div className="status-card glass-card">
            <div className="status-header">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h3>Active Alerts</h3>
            </div>
            <p className="alert-count">{status.alert_count || alerts.length}</p>
            <p className="status-text">{status.alert_count ? 'Responding to active incident' : 'No active emergencies'}</p>
            <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={handleClearAlerts}>
              Clear Alerts
            </button>
          </div>

          <div className="status-card glass-card">
            <div className="status-header">
              <Users className="w-5 h-5 text-orange-400" />
              <h3>Team Status</h3>
            </div>
            <div className="team-stats">
              <div className="stat">
                <span className="label">On Duty</span>
                <span className="value">{fireStation.onDuty}</span>
              </div>
              <div className="divider"></div>
              <div className="stat">
                <span className="label">En Route</span>
                <span className="value">{fireStation.enRoute}</span>
              </div>
              <div className="divider"></div>
              <div className="stat">
                <span className="label">Total</span>
                <span className="value">{fireStation.total}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="map-section glass-card">
          <div className="map-header">
            <h3>GPS Tracking Map</h3>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              <Compass className="w-4 h-4" />
              Refresh Location
            </button>
          </div>
          <div className="map-container">
            {mapUrl ? (
              <iframe
                title="GPS Tracking Map"
                src={mapUrl}
                style={{ border: 'none', width: '100%', height: '100%' }}
                loading="lazy"
              />
            ) : (
              <div className="map-placeholder">
                <MapPin className="w-24 h-24 text-orange-400" />
                <p>{geoError || 'Waiting for your location...'}</p>
                <p className="text-sm text-gray-400">Allow location access to show your current position.</p>
              </div>
            )}
          </div>
          {myLocation && (
            <div className="location-summary glass-card">
              <p>
                <strong>Your Location:</strong> {myLocation.lat.toFixed(5)}, {myLocation.lng.toFixed(5)}
              </p>
              <p>Accuracy: ±{myLocation.accuracy ? `${myLocation.accuracy.toFixed(1)}m` : 'unknown'}</p>
            </div>
          )}
        </section>

        <section className="responders-section">
          <h3>Active Responders</h3>
          <div className="responders-grid">
            {responders.map((responder) => (
              <div key={responder.id} className="responder-card glass-card">
                <div className="responder-header">
                  <div className="responder-icon">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="responder-title">
                    <h4>{responder.name}</h4>
                    <p className="responder-type">{responder.type}</p>
                  </div>
                </div>

                <div className="responder-info">
                  <div className="info-row">
                    <span className="label">Status</span>
                    <span className={`badge ${responder.status === 'Available' ? 'available' : 'standby'}`}>
                      {responder.status}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Location</span>
                    <span className="coords">{responder.coords}</span>
                  </div>
                </div>

                <button className="btn btn-secondary" style={{ width: '100%' }}>
                  <Clock className="w-4 h-4" />
                  View Route
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="alerts-section glass-card">
          <h3>Alert History</h3>
          {loading ? (
            <div className="empty-alerts">
              <p>Loading alert history...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="empty-alerts">
              <AlertTriangle className="w-16 h-16 text-orange-400" />
              <p>No recent alerts or emergencies</p>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map((alert, index) => (
                <div key={index} className="alert-item glass-card">
                  <div className="alert-meta">
                    <span className="alert-type">{alert.type.toUpperCase()}</span>
                    <span className="alert-time">{alert.time}</span>
                  </div>
                  <p className="alert-title">{alert.title}</p>
                  <p className="alert-message">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

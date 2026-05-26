import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Lock, Home } from 'lucide-react'
import { AuthContext } from '../App'
import { addProperty } from '../services/api'
import '../styles/AddProperty.css'

export default function AddProperty() {
  const navigate = useNavigate()
  const { handleLogout } = useContext(AuthContext)
  const [formData, setFormData] = useState({
    address: '',
    password: '',
    coordinates: ''
  })
  const [selectedLocation, setSelectedLocation] = useState('')
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectLocation = () => {
    const location = '9.7557, 76.6487'
    setSelectedLocation(location)
    setFormData((prev) => ({
      ...prev,
      coordinates: location
    }))
    setShowMapPicker(false)
  }

  const handleAddProperty = async (e) => {
    e.preventDefault()
    if (!formData.address || !formData.password || !selectedLocation) {
      alert('Please fill all fields and select a location')
      return
    }

    setSaving(true)
    try {
      await addProperty(formData)
      navigate('/dashboard')
    } catch (error) {
      const message = error?.response?.data?.error || 'Failed to add property.'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="add-property-container">
      <div className="property-orb orb-1"></div>
      <div className="property-orb orb-2"></div>

      <header className="property-header">
        <button className="btn-icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1>Add New Property</h1>
        <button className="btn-icon" onClick={() => { handleLogout(); navigate('/'); }}>
          ✕
        </button>
      </header>

      <div className="property-content">
        <div className="property-card glass-card">
          <form onSubmit={handleAddProperty} className="property-form">
            <div className="form-icon">
              <Home className="w-12 h-12" />
            </div>

            <h2>Property Details</h2>

            <div className="form-group">
              <label htmlFor="address">Property Address</label>
              <div className="input-wrapper">
                <MapPin className="input-icon" />
                <input
                  id="address"
                  type="text"
                  name="address"
                  placeholder="Enter property address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary location-picker-btn"
              onClick={() => setShowMapPicker(true)}
            >
              <MapPin className="w-4 h-4" />
              Select Location on Map
            </button>

            {selectedLocation && (
              <div className="selected-location">
                <div className="location-badge-lg">
                  <MapPin className="w-5 h-5" />
                  <span>{selectedLocation}</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Monitor Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Set a secure password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <p className="hint-text">This password will be used by monitors to access cameras</p>
            </div>

            <div className="fire-station-info">
              <div className="info-icon">
                <Home className="w-5 h-5" />
              </div>
              <div className="info-text">
                <p className="label">Fire Station</p>
                <p className="value">Auto-assigned to nearest station</p>
                <p className="description">Central Fire Station • 2.5 km away</p>
              </div>
            </div>

            <button type="submit" className="btn btn-primary submit-btn" disabled={saving}>
              <Home className="w-5 h-5" />
              {saving ? 'Adding Property...' : 'Add Property'}
            </button>
          </form>
        </div>

        {showMapPicker && (
          <div className="map-picker-overlay" onClick={() => setShowMapPicker(false)}>
            <div className="map-picker-modal glass-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Select Property Location</h3>
                <button className="btn-icon-small" onClick={() => setShowMapPicker(false)}>
                  ✕
                </button>
              </div>

              <div className="map-container">
                <div className="map-placeholder">
                  <MapPin className="w-24 h-24 text-orange-400" />
                  <p>Click to select location</p>
                  <p className="text-sm">Simulated map view</p>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMapPicker(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSelectLocation}>
                  Confirm Location
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

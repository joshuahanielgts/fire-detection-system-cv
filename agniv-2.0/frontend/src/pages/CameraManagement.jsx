import React, { useState, useEffect, useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Video, Upload, AlertTriangle, Eye, Radio } from 'lucide-react'
import { AuthContext } from '../App'
import { startDetection, stopDetection, detectImage, fetchStatus } from '../services/api'
import '../styles/CameraManagement.css'

export default function CameraManagement() {
  const navigate = useNavigate()
  const { propertyId } = useParams()
  const { handleLogout } = useContext(AuthContext)
  const [isDetecting, setIsDetecting] = useState(false)
  const [fireDetected, setFireDetected] = useState(false)
  const [liveStream, setLiveStream] = useState(false)
  const [fileName, setFileName] = useState('No file chosen')
  const [filePreview, setFilePreview] = useState(null)
  const [annotatedImage, setAnnotatedImage] = useState(null)
  const [status, setStatus] = useState({ is_detecting: false, fps: 0, alert_count: 0, fire: false, smoke: false })

  const propertyName = `Property ${propertyId || ''}`

  const loadStatus = async () => {
    try {
      const response = await fetchStatus()
      setStatus(response.data)
      setFireDetected(response.data.fire)
    } catch (error) {
      console.error('Could not fetch detection status', error)
    }
  }

  useEffect(() => {
    if (!isDetecting) return
    loadStatus()
    const interval = setInterval(loadStatus, 2500)
    return () => clearInterval(interval)
  }, [isDetecting])

  const startLiveDetection = async () => {
    try {
      await startDetection()
      setIsDetecting(true)
      setLiveStream(true)
      setFilePreview(null)
      setAnnotatedImage(null)
      setFileName('Live camera stream')
    } catch (error) {
      alert('Failed to start live detection. Please ensure the backend is running.')
    }
  }

  const stopLiveDetection = async () => {
    try {
      await stopDetection()
    } catch (error) {
      console.error('Stop detection failed', error)
    }
    setIsDetecting(false)
    setLiveStream(false)
    setFireDetected(false)
    setFileName('No file chosen')
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    setIsDetecting(false)
    setLiveStream(false)
    setAnnotatedImage(null)

    if (file.type.startsWith('image/')) {
      try {
        const response = await detectImage(file)
        const annotated = response.data.annotated_image
        setAnnotatedImage(`data:image/jpeg;base64,${annotated}`)
        setFireDetected(response.data.fire)
      } catch (error) {
        alert('Failed to analyze image. Please try another file.')
      }
    } else {
      setFilePreview(URL.createObjectURL(file))
    }
  }

  const simulateFire = () => {
    setFireDetected(true)
    setTimeout(() => setFireDetected(false), 4000)
  }

  return (
    <div className="camera-container">
      <header className="camera-header glass-card">
        <div className="header-left">
          <button className="btn-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2>Camera Management</h2>
            <p>{propertyName}</p>
          </div>
        </div>
        <button className="btn-icon" onClick={() => { handleLogout(); navigate('/'); }}>
          ✕
        </button>
      </header>

      <div className="camera-content">
        <div className="camera-grid">
          <div className="camera-card glass-card">
            <div className="card-header">
              <Eye className="w-5 h-5 text-orange-400" />
              <h3>Demo Controls</h3>
            </div>

            <button
              onClick={isDetecting ? stopLiveDetection : startLiveDetection}
              className={`btn btn-lg ${isDetecting ? 'btn-danger' : 'btn-primary'}`}
              style={{ width: '100%' }}
            >
              <Video className="w-5 h-5" />
              {isDetecting ? 'Stop Detection' : 'Use Backend Camera'}
            </button>

            <div className="file-upload-group">
              <label className="btn btn-secondary" style={{ cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                <Upload className="w-4 h-4" />
                Choose File
                <input type="file" accept="video/*,image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              </label>
              <span className="file-name">{fileName}</span>
            </div>

            <button className="btn btn-secondary" style={{ width: '100%' }}>
              <Upload className="w-4 h-4" />
              Upload Demo Video
            </button>

            <button onClick={simulateFire} className="btn btn-secondary" style={{ width: '100%' }}>
              <AlertTriangle className="w-4 h-4" />
              Simulate Fire Alert (Demo)
            </button>
          </div>

          <div className="camera-card glass-card">
            <div className="card-header">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h3>Live AI Detection</h3>
              {(isDetecting || liveStream) && (
                <div className="monitoring-badge">
                  <Radio className="w-3 h-3" />
                  AI Monitoring
                </div>
              )}
            </div>

            <div className={`video-container ${fireDetected ? 'fire-detected' : ''}`}>
              {liveStream ? (
                <img src="/api/live_detection" alt="Live detection stream" className="video-player" />
              ) : annotatedImage ? (
                <img src={annotatedImage} alt="Annotated detection result" className="video-player" />
              ) : filePreview ? (
                <video src={filePreview} autoPlay playsInline muted loop className="video-player" />
              ) : (
                <div className="empty-state">
                  <Eye className="w-16 h-16" />
                  <p>Select a demo option to start AI detection</p>
                </div>
              )}

              {fireDetected && (
                <div className="fire-alert">
                  <AlertTriangle className="w-16 h-16 animate-bounce" />
                  <h2>FIRE DETECTED!</h2>
                  <p>Critical emergency detected</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="stats-card glass-card">
          <h3>Detection Statistics</h3>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-label">Status</span>
              <span className="stat-value">{isDetecting ? 'Active' : 'Idle'}</span>
            </div>
            <div className="stat">
              <span className="stat-label">FPS</span>
              <span className="stat-value">{status.fps || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Alerts</span>
              <span className="stat-value">{status.alert_count || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Fire Detected</span>
              <span className="stat-value">{fireDetected ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

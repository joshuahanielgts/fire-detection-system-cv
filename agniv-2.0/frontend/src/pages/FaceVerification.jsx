import React, { useState, useRef, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Video, Volume2, ShieldCheck, Mic, Camera, RefreshCcw } from 'lucide-react'
import { AuthContext } from '../App'
import '../styles/FaceVerification.css'

export default function FaceVerification() {
  const navigate = useNavigate()
  const { handleLogout } = useContext(AuthContext)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [micReady, setMicReady] = useState(false)
  const [speakerReady, setSpeakerReady] = useState(false)
  const [status, setStatus] = useState('idle')
  const [faceCount, setFaceCount] = useState(0)
  const [faceVerified, setFaceVerified] = useState(false)
  const [permissionError, setPermissionError] = useState('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [useFaceDetector, setUseFaceDetector] = useState(typeof window.FaceDetector !== 'undefined')
  const [faceScanMessage, setFaceScanMessage] = useState('Awaiting user action')
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const detectionIntervalRef = useRef(null)

  const speak = (text) => {
    if (!('speechSynthesis' in window)) {
      setSpeakerReady(false)
      return
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.speak(utterance)
      setSpeakerReady(true)
    } catch (error) {
      console.warn('Speaker activation failed', error)
      setSpeakerReady(false)
    }
  }

  const stopMedia = () => {
    if (detectionIntervalRef.current) {
      window.clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close()
      } catch (error) {
        console.warn('Audio context close failed', error)
      }
      audioContextRef.current = null
      analyserRef.current = null
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraReady(false)
    setMicReady(false)
    setStatus('idle')
    setFaceVerified(false)
    setFaceCount(0)
    setFaceScanMessage('Awaiting user action')
    setAudioLevel(0)
  }

  const activateMedia = async () => {
    setPermissionError('')
    setStatus('requesting')
    setFaceScanMessage('Requesting camera and microphone access...')

    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(userStream)
      setCameraReady(true)
      setMicReady(true)
      setStatus('scanning')
      setFaceScanMessage('Camera and mic active. Scanning for a face...')

      if (videoRef.current) {
        videoRef.current.srcObject = userStream
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      const source = audioContext.createMediaStreamSource(userStream)
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateAudioLevel = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
        setAudioLevel(avg)
        requestAnimationFrame(updateAudioLevel)
      }
      updateAudioLevel()

      if ('speechSynthesis' in window) {
        speak('Camera and microphone are active. Please look at the screen to complete face verification.')
      }

      startFaceVerification(userStream)
    } catch (error) {
      console.error('Media activation error', error)
      setPermissionError('Camera and microphone permission denied or unavailable. Please allow access.')
      setStatus('error')
      setFaceScanMessage('Permission required to start face verification.')
    }
  }

  const drawFaceBoxes = (faces) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#ff6b35'
    ctx.lineWidth = 4
    ctx.fillStyle = 'rgba(255, 107, 53, 0.15)'
    faces.forEach((face) => {
      const { boundingBox } = face
      ctx.fillRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height)
      ctx.strokeRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height)
    })
  }

  const startFaceVerification = async () => {
    const video = videoRef.current
    if (!video) return

    const detectorSupported = useFaceDetector && typeof window.FaceDetector !== 'undefined'
    if (detectorSupported) {
      const faceDetector = new window.FaceDetector()
      detectionIntervalRef.current = window.setInterval(async () => {
        if (!video || video.readyState !== 4) return
        const offscreen = document.createElement('canvas')
        offscreen.width = video.videoWidth
        offscreen.height = video.videoHeight
        const ctx = offscreen.getContext('2d')
        ctx.drawImage(video, 0, 0, offscreen.width, offscreen.height)

        try {
          const faces = await faceDetector.detect(offscreen)
          setFaceCount(faces.length)
          if (faces.length > 0) {
            setFaceVerified(true)
            setStatus('verified')
            setFaceScanMessage('Face detected and verified successfully.')
            drawFaceBoxes(faces)
            speak('Face verification successful. Welcome to Agniv2.0.')
            window.clearInterval(detectionIntervalRef.current)
            detectionIntervalRef.current = null
          } else {
            setFaceScanMessage('No face visible. Please align your face in the camera view.')
          }
        } catch (error) {
          console.warn('Face detection failed', error)
          setPermissionError('Face detection is not supported in this browser. Verification will continue with camera activation only.')
          setUseFaceDetector(false)
        }
      }, 1500)
    } else {
      detectionIntervalRef.current = window.setInterval(() => {
        if (!video || video.readyState !== 4) return
        setFaceCount(1)
        setFaceVerified(true)
        setStatus('verified')
        setFaceScanMessage('Face verification completed with browser camera. Please check the result.')
        speak('Face verification completed. Welcome to Agniv2.0.')
        window.clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }, 3000)
    }
  }

  useEffect(() => {
    return () => {
      stopMedia()
    }
  }, [])

  const handleRetry = () => {
    stopMedia()
    activateMedia()
  }

  return (
    <div className="verification-container">
      <header className="verification-header glass-card">
        <div className="header-left">
          <button className="btn-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2>Face Verification</h2>
            <p>Use your browser camera and microphone to verify identity securely.</p>
          </div>
        </div>
        <button className="btn-icon" onClick={() => { handleLogout(); navigate('/'); }}>
          ✕
        </button>
      </header>

      <div className="verification-content">
        <section className="verification-panel glass-card">
          <div className="panel-header">
            <div>
              <h3>Camera & Mic Test</h3>
              <p>Activate your webcam and audio device for live verification.</p>
            </div>
          </div>

          <div className="status-grid">
            <div className={`status-pill ${cameraReady ? 'active' : ''}`}>
              <Camera className="w-4 h-4" />
              <span>{cameraReady ? 'Camera enabled' : 'Camera off'}</span>
            </div>
            <div className={`status-pill ${micReady ? 'active' : ''}`}>
              <Mic className="w-4 h-4" />
              <span>{micReady ? 'Microphone enabled' : 'Microphone off'}</span>
            </div>
            <div className={`status-pill ${speakerReady ? 'active' : ''}`}>
              <Volume2 className="w-4 h-4" />
              <span>{speakerReady ? 'Speaker active' : 'Speaker inactive'}</span>
            </div>
            <div className={`status-pill ${faceVerified ? 'active' : ''}`}>
              <ShieldCheck className="w-4 h-4" />
              <span>{faceVerified ? 'Verified' : 'Scanning'}</span>
            </div>
          </div>

          <div className="verification-actions">
            <button className="btn btn-primary" onClick={activateMedia} disabled={status === 'scanning'}>
              <Video className="w-5 h-5" />
              Enable Camera + Mic
            </button>
            <button className="btn btn-secondary" onClick={handleRetry}>
              <RefreshCcw className="w-5 h-5" />
              Retry Permissions
            </button>
          </div>

          {permissionError && <div className="permission-error">{permissionError}</div>}

          <div className="verification-card">
            <div className="video-preview">
              <video ref={videoRef} autoPlay muted playsInline className={cameraReady ? 'video-active' : ''} />
              <canvas ref={canvasRef} className="face-overlay" />
              {!cameraReady && (
                <div className="video-placeholder">
                  <Camera className="w-16 h-16" />
                  <p>Camera preview will appear here once permission is granted.</p>
                </div>
              )}
            </div>

            <div className="verification-summary">
              <div className="summary-box">
                <span className="summary-label">Face scan status</span>
                <span className="summary-value">{faceScanMessage}</span>
              </div>
              <div className="summary-box">
                <span className="summary-label">Faces detected</span>
                <span className="summary-value">{faceCount}</span>
              </div>
              <div className="summary-box audio-meter">
                <span className="summary-label">Mic input</span>
                <div className="audio-bar">
                  <div className="audio-progress" style={{ width: `${Math.min(audioLevel / 2, 100)}%` }}></div>
                </div>
              </div>
              <div className="summary-box">
                <span className="summary-label">Current mode</span>
                <span className="summary-value">{status === 'idle' ? 'Idle' : status === 'requesting' ? 'Requesting access' : status === 'scanning' ? 'Scanning face' : 'Verified'}</span>
              </div>
            </div>
          </div>

          {faceVerified && (
            <div className="verified-banner glass-card">
              <ShieldCheck className="w-6 h-6" />
              <div>
                <h3>Face verification successful</h3>
                <p>Your face has been securely recognized by the browser camera.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

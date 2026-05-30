import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  detectImage, 
  detectFrame, 
  startDetection, 
  stopDetection, 
  getStatus, 
  getAlerts, 
  clearAlerts,
  getProperties 
} from '../services/api';
import createSocket from '../services/socket';
import { 
  Camera, 
  Upload, 
  Play, 
  Square, 
  AlertOctagon, 
  RefreshCw, 
  ArrowLeft,
  Activity,
  CheckCircle,
  FileImage,
  Clock
} from 'lucide-react';

export default function CameraManagement() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const socketRef = useRef(null);

  // States
  const [property, setProperty] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [alertActive, setAlertActive] = useState(false);
  const [detections, setDetections] = useState([]);
  const [annotatedImage, setAnnotatedImage] = useState(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('upload'); // 'upload' | 'webcam'
  const [webcamStream, setWebcamStream] = useState(null);
  const [alertsHistory, setAlertsHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load property details and alerts history
  const initPage = async () => {
    try {
      const props = await getProperties();
      const match = props.find(p => p.id === propertyId);
      if (match) {
        setProperty(match);
      } else {
        setError('Property not found.');
      }
    } catch (err) {
      setError('Failed to fetch property details.');
      console.error(err);
    }

    try {
      const data = await getAlerts(15);
      setAlertsHistory(data.alerts || []);
    } catch (err) {
      console.error('Failed to load alert history', err);
    }
  };

  useEffect(() => {
    initPage();

    // Setup Socket
    socketRef.current = createSocket();
    
    socketRef.current.on('connect', () => {
      console.log('Socket.IO connection established for properties');
    });

    socketRef.current.on('alert', (data) => {
      // Trigger alarm state if matches current property or if general broadcast
      setAlertActive(true);
      if (data.detections) {
        setDetections(data.detections);
      }
      // Reload history
      getAlerts(15).then(res => setAlertsHistory(res.alerts || [])).catch(console.error);
    });

    // Cleanup on unmount
    return () => {
      stopDetectionLoop();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [propertyId]);

  // Mode 1: Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setAnnotatedImage(null);
    setDetections([]);
    
    try {
      const res = await detectImage(file);
      if (res.success) {
        setAnnotatedImage(res.annotated_image);
        setDetections(res.detections || []);
        setAlertActive(res.alert);
        // Refresh alert history
        const updatedAlerts = await getAlerts(15);
        setAlertsHistory(updatedAlerts.alerts || []);
      } else {
        setError('Image detection failed.');
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Detection failed. Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Mode 2: Live Webcam Detection
  const startLiveWebcam = async () => {
    setError('');
    setAnnotatedImage(null);
    setDetections([]);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      setWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Call start detection endpoint
      await startDetection();
      setIsRunning(true);

      // Frame capture loop every 500ms
      intervalRef.current = setInterval(captureAndDetectFrame, 500);
    } catch (err) {
      console.error(err);
      setError('Could not access webcam. Ensure permissions are granted.');
    }
  };

  const captureAndDetectFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      
      try {
        const res = await detectFrame(base64);
        if (res.success) {
          setAnnotatedImage(res.annotated_image);
          setDetections(res.detections || []);
          setAlertActive(res.alert);
        }
      } catch (err) {
        console.error('Frame processing failed', err);
      }
    }
  };

  const stopDetectionLoop = async () => {
    // Clear capture interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop webcam media tracks
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Call stop detection on backend
    try {
      await stopDetection();
    } catch (e) {
      console.warn('Backend stop detection failed', e);
    }

    setIsRunning(false);
  };

  const handleClearActiveAlert = async () => {
    try {
      await clearAlerts();
      setAlertActive(false);
      setDetections([]);
      // Reload history
      const updatedAlerts = await getAlerts(15);
      setAlertsHistory(updatedAlerts.alerts || []);
    } catch (err) {
      console.error('Failed to clear alert', err);
    }
  };

  return (
    <div className="page-wrapper min-h-screen text-[#e0e0e0] flex flex-col gap-6">
      
      {/* Header */}
      <header className="glass-card p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { stopDetectionLoop(); navigate('/dashboard'); }}
            className="btn-ghost p-2 border-none hover:bg-white/5"
            style={{ padding: '6px 12px' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Camera Monitoring Node
            </h1>
            <p className="text-xs text-[#888]">
              Property: <span className="text-white font-medium">{property?.name || 'Loading...'}</span> | {property?.address}
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => { stopDetectionLoop(); setMode('upload'); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === 'upload' ? 'bg-fire-500 text-white shadow' : 'text-[#888] hover:text-white'
            }`}
          >
            Image Upload
          </button>
          <button
            onClick={() => { stopDetectionLoop(); setMode('webcam'); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mode === 'webcam' ? 'bg-fire-500 text-white shadow' : 'text-[#888] hover:text-white'
            }`}
          >
            Live Webcam
          </button>
        </div>
      </header>

      {/* Pulsing Active Alert Banner Overlay */}
      {alertActive && (
        <div className="alert-banner p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">🔥</span>
            <div>
              <h3 className="text-lg font-bold text-red-500">FIRE / SMOKE DETECTED</h3>
              <p className="text-xs text-gray-300">
                Current active detections: {detections.map(d => `${d.label} (${(d.confidence * 100).toFixed(0)}%)`).join(', ') || 'No detailed stats available.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClearActiveAlert}
            className="btn-primary bg-red-600 hover:bg-red-700 text-xs font-bold py-1.5 px-4 rounded"
          >
            Clear Alert
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Main Two-Column Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Video/Image Feed */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="glass-card overflow-hidden aspect-video bg-[#05050a] flex items-center justify-center relative border border-white/5">
            
            {mode === 'upload' ? (
              // Image Upload Mode View
              annotatedImage ? (
                <img 
                  src={annotatedImage} 
                  alt="AI Detection Feed" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-8 flex flex-col items-center gap-3">
                  <FileImage className="w-16 h-16 text-[#444] animate-pulse" />
                  <p className="text-sm text-[#888]">No image analyzed yet</p>
                  <label className="btn-ghost text-xs cursor-pointer py-2 px-4">
                    <Upload size={14} className="inline mr-1" />
                    Browse Image
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              )
            ) : (
              // Live Webcam Mode View
              <div className="relative w-full h-full">
                {/* Hidden canvas for capturing video frames */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {/* Hidden source video element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isRunning ? 'opacity-0 absolute' : 'opacity-100'}`}
                />

                {/* Display processed frame overlay */}
                {isRunning && annotatedImage ? (
                  <img 
                    src={annotatedImage} 
                    alt="Live AI Stream" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  !isRunning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40">
                      <Camera className="w-16 h-16 text-[#444]" />
                      <p className="text-sm text-[#888]">Webcam monitoring offline</p>
                      <button
                        onClick={startLiveWebcam}
                        className="btn-primary text-xs py-2 px-4"
                      >
                        <Play size={14} className="inline mr-1" />
                        Start Live Detection
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Spinner Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="animate-spin text-fire-500 w-8 h-8" />
                  <span className="text-xs text-gray-300">Processing with YOLOv8...</span>
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="glass-card p-4 flex justify-between items-center gap-4 border border-white/5">
            <div>
              <span className="text-xs text-[#888] font-medium block">Active Mode</span>
              <span className="text-sm font-semibold text-white">
                {mode === 'upload' ? 'Upload Footage Analysis' : 'Webcam Live Stream'}
              </span>
            </div>

            <div className="flex gap-2">
              {mode === 'upload' ? (
                <label className="btn-primary bg-fire-500 hover:bg-fire-600 cursor-pointer text-xs font-bold py-2 px-5">
                  <Upload size={14} className="inline mr-1" />
                  Upload Image
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                </label>
              ) : (
                isRunning ? (
                  <button
                    onClick={stopDetectionLoop}
                    className="btn-primary bg-red-600 hover:bg-red-700 text-xs font-bold py-2 px-5"
                  >
                    <Square size={14} className="inline mr-1" />
                    Stop Detection
                  </button>
                ) : (
                  <button
                    onClick={startLiveWebcam}
                    className="btn-primary bg-fire-500 hover:bg-fire-600 text-xs font-bold py-2 px-5"
                  >
                    <Play size={14} className="inline mr-1" />
                    Start Live Detection
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Detections & Diagnostics */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Active AI Detections Card */}
          <div className="glass-card p-6 flex flex-col gap-4 border border-white/5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="text-fire-500 w-5 h-5" />
              Live AI Diagnostics
            </h3>

            {detections.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#888] flex flex-col items-center gap-2">
                <CheckCircle className="text-green-500 w-8 h-8 opacity-45" />
                No fire or smoke signatures detected.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {detections.map((det, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      det.label.toLowerCase() === 'fire' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                        : 'bg-gray-500/10 border-gray-500/20 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">🔥</span>
                      <span className="font-bold text-sm uppercase">{det.label}</span>
                    </div>
                    <span className="font-mono text-sm font-semibold">
                      {(det.confidence * 100).toFixed(1)}% Conf.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Panel */}
          <div className="glass-card p-6 flex flex-col gap-3 border border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Node Status</h3>
            <div className="flex justify-between text-xs py-1 border-b border-white/5">
              <span className="text-[#888]">Connection</span>
              <span className="text-green-500 font-semibold">WebSocket Active</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-white/5">
              <span className="text-[#888]">Local Pipeline</span>
              <span className="text-white font-semibold">{mode === 'webcam' && isRunning ? 'Running' : 'Standby'}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-b border-white/5">
              <span className="text-[#888]">GPS Bind</span>
              <span className="text-white font-semibold">
                {property?.lat ? `${Number(property.lat).toFixed(4)}, ${Number(property.lng).toFixed(4)}` : 'Unassigned'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts History Table */}
      <section className="glass-card p-6 border border-white/5 mt-4">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="text-amber-500 w-5 h-5" />
          Alert History Log
        </h3>
        
        {alertsHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#666]">
            No historical alert logs recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/15 text-[#888]">
                  <th className="py-2.5 px-2">Timestamp</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2">Location</th>
                  <th className="py-2.5 px-2">Confidence Range</th>
                  <th className="py-2.5 px-2">Trigger Source</th>
                </tr>
              </thead>
              <tbody>
                {alertsHistory.map((item, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-all text-[#e0e0e0]">
                    <td className="py-3 px-2 font-mono">{item.time || 'N/A'}</td>
                    <td className="py-3 px-2 font-bold uppercase text-red-400">
                      {item.type || 'Alert'}
                    </td>
                    <td className="py-3 px-2">{item.title || property?.name || 'Monitoring Node'}</td>
                    <td className="py-3 px-2 font-mono text-[#888]">{item.message || 'Detection Confirmed'}</td>
                    <td className="py-3 px-2 text-amber-500 font-semibold">YOLOv8 Core</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

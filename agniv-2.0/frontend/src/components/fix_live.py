import os

content = r'''import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Video, Upload, FileUp, Eye, AlertTriangle } from 'lucide-react'

const LiveAIDemo = () => {
  const [isDetecting, setIsDetecting] = useState(false)
  const [fireDetected, setFireDetected] = useState(false)
  const [videoSrc, setVideoSrc] = useState(null)
  const [fileName, setFileName] = useState('No file chosen')
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setIsDetecting(true)
      setVideoSrc('webcam')
    } catch {
      alert('Camera access denied')
    }
  }

  const stopDetection = () => {
    setIsDetecting(false)
    setVideoSrc(null)
    setFireDetected(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setVideoSrc(URL.createObjectURL(file))
    setIsDetecting(true)
  }

  const simulateFire = () => {
    setFireDetected(true)
    setTimeout(() => setFireDetected(false), 4000)
  }

  const btnClass = isDetecting
    ? 'w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 text-white bg-accent-red'
    : 'w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 text-white bg-gradient-to-r from-accent-blue to-purple-600'

  return (
    <div className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Live AI Demo</h2>
        <p className="text-gray-400">Test the fire detection system in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card p-8"
        >
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent-orange" /> Demo Controls
          </h3>
          <div className="flex flex-col gap-4">
            <button onClick={isDetecting ? stopDetection : startWebcam} className={btnClass}>
              <Video className="w-5 h-5" />
              {isDetecting ? 'Stop Detection' : 'Use Laptop Webcam'}
            </button>

            <div className="flex items-center gap-3">
              <label className="bg-accent-orange text-white px-5 py-3 rounded-xl font-semibold cursor-pointer hover:bg-orange-600 transition-colors flex items-center gap-2">
                <FileUp className="w-4 h-4" /> Choose File
                <input type="file" accept="video/*,image/*" onChange={handleFileSelect} className="hidden" />
              </label>
              <span className="text-gray-400 text-sm">{fileName}</span>
            </div>

            <button className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-accent-orange/20 border border-accent-orange/30 text-accent-orange hover:bg-accent-orange/30 transition-all">
              <Upload className="w-4 h-4" /> Upload Demo Video
            </button>

            <button onClick={simulateFire} className="w-full py-2 rounded-xl font-semibold bg-accent-red/20 border border-accent-red/30 text-accent-red hover:bg-accent-red/30 transition-all text-sm">
              Simulate Fire Alert (Demo)
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card p-8 relative overflow-hidden"
        >
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent-orange" /> Live AI Detection
          </h3>

          <div className={'relative rounded-xl overflow-hidden bg-black/50 min-h-[320px] flex items-center justify-center ' + (fireDetected ? 'ring-4 ring-accent-red' : '')}>
            {!videoSrc ? (
              <div className="text-center p-8">
                <Eye className="w-16 h-16 text-accent-orange/30 mx-auto mb-4" />
                <p className="text-gray-400">Select a demo option to start AI detection</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={videoSrc !== 'webcam' ? videoSrc : undefined}
                autoPlay
                playsInline
                muted
                loop={videoSrc !== 'webcam'}
                className="w-full h-full object-contain rounded-xl"
              />
            )}

            {fireDetected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-accent-red/80 flex flex-col items-center justify-center z-10"
              >
                <AlertTriangle className="w-16 h-16 text-white mb-4 animate-shake" />
                <h2 className="text-3xl font-bold text-white mb-2">FIRE DETECTED!</h2>
                <p className="text-white/90">Critical emergency detected</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
  )
}

export default LiveAIDemo
'''

with open('LiveAIDemo.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')

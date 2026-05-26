// AI FIRE DETECTION SYSTEM - MASTERMIND FRONTEND JS

class FireDetectionApp {
    constructor() {
        this.isDetecting = false;
        this.alertLog = [];
        this.detectionCount = 0;
        this.startTime = Date.now();
        this.fps = 0;
        this.confidenceThreshold = 0.6;
        this.streamInterval = null;
        this.statusInterval = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUptime();
        setInterval(() => this.updateUptime(), 1000);
        
        // Initialize with checking system health
        this.checkHealth();
    }

    bindEvents() {
        // Threshold slider
        const thresholdSlider = document.getElementById('thresholdSlider');
        const thresholdValue = document.getElementById('thresholdValue');
        
        if (thresholdSlider) {
            thresholdSlider.addEventListener('input', (e) => {
                this.confidenceThreshold = parseFloat(e.target.value);
                if (thresholdValue) {
                    thresholdValue.textContent = this.confidenceThreshold.toFixed(2);
                }
            });
        }

        // Control buttons
        const startBtn = document.getElementById('startDetection');
        const stopBtn = document.getElementById('stopDetection');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const clearAlertsBtn = document.getElementById('clearAlerts');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startDetection());
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopDetection());
        }
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
        if (clearAlertsBtn) {
            clearAlertsBtn.addEventListener('click', () => this.clearAlerts());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.isDetecting ? this.stopDetection() : this.startDetection();
            }
            if (e.code === 'KeyF') {
                this.toggleFullscreen();
            }
            if (e.code === 'Escape') {
                this.stopDetection();
            }
        });

        // Upload form
        const uploadForm = document.getElementById('uploadForm');
        const imageInput = document.getElementById('imageInput');
        const detectBtn = document.getElementById('detectBtn');

        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleUpload(e));
        }

        // Window resize
        window.addEventListener('resize', () => {
            this.adjustLayout();
        });
    }

    async handleUpload(e) {
        e.preventDefault();
        const imageInput = document.getElementById('imageInput');
        if (!imageInput || !imageInput.files[0]) {
            this.showToast('Please select an image', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('image', imageInput.files[0]);

        try {
            this.showToast('Processing image...', 'info');
            const response = await fetch('/api/detect_image', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                this.showToast(`Detection complete: ${data.detections.length} objects found`, 'info');
                
                // Show result image if available
                if (data.annotated_image) {
                    const videoFeed = document.getElementById('videoFeed');
                    if (videoFeed) {
                        videoFeed.src = 'data:image/jpeg;base64,' + data.annotated_image;
                    }
                }
                
                // Update status
                if (data.fire) {
                    this.triggerFireAlert();
                }
                if (data.smoke) {
                    this.triggerSmokeAlert();
                }
            } else {
                this.showToast('Detection failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast('Upload failed - check connection', 'error');
        }
    }

    async checkHealth() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            if (data.status === 'healthy') {
                this.showToast('System Ready', 'info');
            } else {
                this.showToast('System initializing...', 'warning');
            }
        } catch (error) {
            console.log('Health check skipped');
        }
    }

    async startDetection() {
        if (this.isDetecting) return;
        
        try {
            const response = await fetch('/api/start_detection', { method: 'POST' });
            if (response.ok) {
                this.isDetecting = true;
                this.updateControlsState();
                this.startVideoStream();
                this.startStatusUpdates();
                this.showToast('Live detection started', 'info');
            }
        } catch (error) {
            console.error('Start detection error:', error);
            this.showToast('Failed to start detection', 'error');
        }
    }

    async stopDetection() {
        if (!this.isDetecting) return;
        
        try {
            const response = await fetch('/api/stop_detection', { method: 'POST' });
            if (response.ok) {
                this.isDetecting = false;
                this.updateControlsState();
                this.stopVideoStream();
                this.stopStatusUpdates();
                this.showToast('Detection stopped', 'info');
            }
        } catch (error) {
            console.error('Stop detection error:', error);
        }
    }

    startVideoStream() {
        const videoFeed = document.getElementById('videoFeed');
        if (videoFeed) {
            videoFeed.src = '/api/live_detection?t=' + Date.now();
        }
    }

    stopVideoStream() {
        const videoFeed = document.getElementById('videoFeed');
        if (videoFeed) {
            videoFeed.src = '';
        }
    }

    startStatusUpdates() {
        this.statusInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                this.updateStatus(data);
            } catch (error) {
                console.log('Status update error');
            }
        }, 1000);
    }

    stopStatusUpdates() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
    }

    updateStatus(data) {
        // Update fire status
        const fireStatus = document.getElementById('fireStatus');
        const fireCard = document.getElementById('fireCard');
        
        if (fireStatus) {
            if (data.fire) {
                fireStatus.textContent = 'DETECTED';
                fireStatus.style.color = 'var(--danger)';
                if (fireCard) fireCard.style.borderColor = 'var(--danger)';
                this.triggerFireAlert();
            } else {
                fireStatus.textContent = 'CLEAR';
                fireStatus.style.color = 'var(--success)';
                if (fireCard) fireCard.style.borderColor = 'var(--border)';
            }
        }

        // Update smoke status
        const smokeStatus = document.getElementById('smokeStatus');
        const smokeCard = document.getElementById('smokeCard');
        
        if (smokeStatus) {
            if (data.smoke) {
                smokeStatus.textContent = 'DETECTED';
                smokeStatus.style.color = 'var(--warning)';
                if (smokeCard) smokeCard.style.borderColor = 'var(--warning)';
                this.triggerSmokeAlert();
            } else {
                smokeStatus.textContent = 'CLEAR';
                smokeStatus.style.color = 'var(--success)';
                if (smokeCard) smokeCard.style.borderColor = 'var(--border)';
            }
        }

        // Update last update time
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = new Date().toLocaleTimeString();
        }
    }

    triggerFireAlert() {
        this.addAlert('fire', 'FIRE DETECTED!', 'Critical alert - Fire detected in camera view');
        this.showFullscreenAlert('FIRE DETECTED!', 'Critical emergency detected');
        this.showToast('FIRE DETECTED!', 'fire');
        
        // Play alert sound if available
        this.playAlertSound();
    }

    triggerSmokeAlert() {
        this.addAlert('smoke', 'SMOKE DETECTED!', 'Warning - Smoke detected in camera view');
        this.showToast('SMOKE DETECTED!', 'smoke');
        this.playAlertSound();
    }

    addAlert(type, title, message) {
        const alertList = document.getElementById('alertList');
        if (!alertList) return;

        const alertItem = document.createElement('div');
        alertItem.className = `alert-item ${type}`;
        alertItem.innerHTML = `
            <div class="alert-icon">${type === 'fire' ? '🔥' : '💨'}</div>
            <div class="alert-content">
                <h4>${title}</h4>
                <p>${message}</p>
            </div>
            <div class="alert-time">${new Date().toLocaleTimeString()}</div>
        `;

        alertList.insertBefore(alertItem, alertList.firstChild);

        // Keep only last 20 alerts
        while (alertList.children.length > 20) {
            alertList.removeChild(alertList.lastChild);
        }

        this.alertLog.push({ type, title, message, time: new Date() });
        this.updateAlertCount();
    }

    clearAlerts() {
        const alertList = document.getElementById('alertList');
        if (alertList) {
            alertList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-bell-slash"></i>
                    <p>No alerts yet</p>
                </div>
            `;
        }
        this.alertLog = [];
        this.updateAlertCount();
        this.showToast('Alerts cleared', 'info');
    }

    updateAlertCount() {
        const alertCount = document.getElementById('alertCount');
        if (alertCount) {
            alertCount.textContent = this.alertLog.length;
        }
    }

    showFullscreenAlert(title, message) {
        const overlay = document.getElementById('fullscreenAlert');
        if (!overlay) return;

        const alertTitle = overlay.querySelector('h2');
        const alertMsg = overlay.querySelector('p');

        if (alertTitle) alertTitle.textContent = title;
        if (alertMsg) alertMsg.textContent = message;

        overlay.classList.add('active');

        // Auto hide after 5 seconds
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 5000);
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'fire' ? '🔥' : type === 'smoke' ? '💨' : 'ℹ️';
        
        toast.innerHTML = `
            <span style="font-size: 1.25rem;">${icon}</span>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'toastSlide 0.4s ease-in reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 400);
        }, 4000);
    }

    updateControlsState() {
        const startBtn = document.getElementById('startDetection');
        const stopBtn = document.getElementById('stopDetection');
        const liveBadge = document.getElementById('liveBadge');

        if (startBtn) {
            startBtn.classList.toggle('active', this.isDetecting);
            startBtn.innerHTML = this.isDetecting ? 
                '<i class="fas fa-play"></i> Running' : 
                '<i class="fas fa-play"></i> Start Detection';
        }

        if (stopBtn) {
            stopBtn.disabled = !this.isDetecting;
        }

        if (liveBadge) {
            liveBadge.style.display = this.isDetecting ? 'inline-flex' : 'none';
        }
    }

    updateUptime() {
        const uptimeEl = document.getElementById('uptime');
        if (uptimeEl) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            const seconds = elapsed % 60;
            uptimeEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    adjustLayout() {
        // Adjust layout based on screen size
        const isMobile = window.innerWidth < 768;
        const sidebar = document.querySelector('.sidebar');
        
        if (sidebar) {
            sidebar.style.display = isMobile && this.isDetecting ? 'none' : 'flex';
        }
    }

    playAlertSound() {
        // Create a simple beep sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not available');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.fireApp = new FireDetectionApp();
});


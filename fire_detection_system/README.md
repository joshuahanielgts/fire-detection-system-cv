# 🚨 AI Fire & Smoke Detection System

Real-time fire and smoke detection using YOLOv8 with **secure login system** and beautiful web dashboard.

## ✨ Quick Start

```bash
pip install -r requirements.txt
python web_app.py
```

**Open:** `http://localhost:5000`

## 🔐 Login Credentials
- **Username:** `admin` | **Password:** `admin123`
- **Username:** `user` | **Password:** `user123`

## 🎯 Features
- ✅ **Secure Login System** with session management
- ✅ Real-time YOLOv8 fire/smoke detection
- ✅ Live webcam streaming with bounding boxes
- ✅ Image upload and analysis
- ✅ Confidence scoring and alerts
- ✅ Dark theme responsive dashboard
- ✅ Mobile-friendly interface
- ✅ Real-time status updates

## 🚀 How to Use

### 1. Login
- Visit `http://localhost:5000`
- Enter demo credentials above
- Access the detection dashboard

### 2. Detection Options
- **Upload Images:** Select files for instant analysis
- **Live Webcam:** Start real-time detection with your camera
- **View Results:** See bounding boxes, confidence scores, and alerts

### 3. Modes Available
- `python web_app.py` - **Web app with authentication** ⭐
- `python main.py` - Desktop OpenCV window
- `python app.py` - Gradio interface (may have issues)

## 🛠️ Technical Details

### Backend
- **Flask** web framework
- **Flask-Login** for authentication
- **YOLOv8** AI model for detection
- **OpenCV** for computer vision
- **Session management** with secure cookies

### Frontend
- **HTML5/CSS3** responsive design
- **JavaScript** for real-time updates
- **Modern UI** with dark theme
- **Mobile optimized** interface

### Security
- **User authentication** required
- **Session protection** for all routes
- **Secure logout** functionality
- **Demo credentials** for testing

## 📡 API Endpoints

```
GET  /                     - Login page / Dashboard redirect
GET  /login               - Login form
POST /login               - Process authentication
GET  /dashboard           - Main detection interface (protected)
GET  /logout              - Secure logout
GET  /api/health          - System status
POST /api/detect_frame    - Image analysis (protected)
POST /api/start_detection - Start live detection (protected)
GET  /api/live_detection  - Video stream (protected)
GET  /api/status          - Detection status (protected)
```

## 🎨 Dashboard Features

### Control Panel
- **Image Upload:** Drag & drop file selection
- **Live Detection:** Webcam start/stop controls
- **Status Display:** Real-time system health

### Results Panel
- **Annotated Images:** Detection results with bounding boxes
- **Detection List:** Objects found with confidence scores
- **Alert System:** Visual notifications for fire/smoke

### User Experience
- **Responsive Design:** Works on all devices
- **Real-time Updates:** Live status and alerts
- **Intuitive Controls:** Easy to use interface
- **Professional UI:** Modern, clean design

---

**🎊 Ready to detect fire and smoke with AI!**

Your secure, web-based detection system is now running. Login and start monitoring for fire and smoke in real-time!


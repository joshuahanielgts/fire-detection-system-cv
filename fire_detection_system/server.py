import os
import base64
import datetime
import uuid
import threading
import cv2
import numpy as np
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from detector import FireSmokeDetector
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Session Configuration
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True
app.secret_key = os.getenv("SECRET_KEY", "agniv-2-secret-key-fallback")

# CORS Configuration
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
_raw_origins = os.getenv("ALLOWED_ORIGINS")
if _raw_origins:
    ALLOWED_ORIGINS.extend([o.strip().rstrip('/') for o in _raw_origins.split(",") if o.strip()])

# Setup CORS with app
CORS(app, supports_credentials=True, origins=ALLOWED_ORIGINS)

# Setup SocketIO
socketio = SocketIO(app, cors_allowed_origins=ALLOWED_ORIGINS, async_mode="eventlet")

# In-Memory Storage
properties = {}
alerts = []  # capped at 200

# Detection State
detection_state = {
    "running": False,
    "fps": 0.0,
    "alert_active": False,
    "detections": []
}

# Lazy Loaded Detector with threading Lock
_detector = None
_detector_lock = threading.Lock()

def get_detector():
    global _detector
    if _detector is None:
        with _detector_lock:
            if _detector is None:
                _detector = FireSmokeDetector()
    return _detector


# ==========================================
# AUTH ENDPOINTS
# ==========================================

@app.route('/api/login', methods=['POST'])
def api_login():
    """
    Accepts ANY email.
    Body format: {email, name(optional)}
    If no email, returns 400.
    """
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    name = data.get("name")
    
    # Fallback to form data if JSON body is empty
    if not email:
        email = request.form.get("email")
        name = request.form.get("name")
        
    if not email:
        return jsonify({"error": "Email is required"}), 400
        
    if not name:
        name = email.split('@')[0].capitalize()
        
    user = {"email": email, "name": name}
    session['user'] = user
    return jsonify({"success": True, "user": user})

@app.route('/api/logout', methods=['POST'])
def api_logout():
    """
    Clear session and return success.
    """
    session.clear()
    return jsonify({"success": True})

@app.route('/api/me', methods=['GET'])
def api_me():
    """
    Return session user or 401.
    """
    if 'user' in session:
        return jsonify(session['user'])
    return jsonify({"error": "Unauthorized"}), 401


# ==========================================
# PROPERTIES ENDPOINTS
# ==========================================

@app.route('/api/properties', methods=['GET'])
def get_properties():
    """
    Return the list of all properties.
    """
    return jsonify(list(properties.values()))

@app.route('/api/properties', methods=['POST'])
def create_property():
    """
    Create a new property with a uuid id.
    Body fields: name, address, lat, lng, password.
    Emits socketio event "property_added".
    Returns 201.
    """
    data = request.get_json(silent=True) or {}
    prop_id = str(uuid.uuid4())
    
    new_property = {
        "id": prop_id,
        "name": data.get("name", ""),
        "address": data.get("address", ""),
        "lat": data.get("lat"),
        "lng": data.get("lng"),
        "password": data.get("password", ""),
        "status": "normal",
        "alert_active": False,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    properties[prop_id] = new_property
    socketio.emit("property_added", new_property)
    return jsonify(new_property), 201

@app.route('/api/properties/<id>', methods=['GET'])
def get_property(id):
    """
    Return property by ID or 404.
    """
    if id in properties:
        return jsonify(properties[id])
    return jsonify({"error": "Property not found"}), 404

@app.route('/api/properties/<id>', methods=['DELETE'])
def delete_property(id):
    """
    Delete property by ID or 404.
    """
    if id in properties:
        del properties[id]
        return jsonify({"success": True})
    return jsonify({"error": "Property not found"}), 404


# ==========================================
# DETECTION ENDPOINTS
# ==========================================

@app.route('/api/health', methods=['GET'])
def api_health():
    """
    Returns system status, detector availability, YOLO loaded status,
    and hardcoded camera_available=False.
    """
    yolo_loaded = _detector.yolo_available if _detector is not None else False
    return jsonify({
        "status": "healthy",
        "detector_available": True,
        "yolo_loaded": yolo_loaded,
        "camera_available": False
    })

@app.route('/api/start_detection', methods=['POST'])
def api_start_detection():
    """
    Set running=True and return status "running".
    """
    detection_state["running"] = True
    return jsonify({"status": "running"})

@app.route('/api/stop_detection', methods=['POST'])
def api_stop_detection():
    """
    Set running=False and return status "stopped".
    """
    detection_state["running"] = False
    return jsonify({"status": "stopped"})

@app.route('/api/status', methods=['GET'])
def api_status():
    """
    Return detection_state.
    """
    return jsonify(detection_state)


# ==========================================
# IMAGE DETECTION & HELPER
# ==========================================

def _decode_request_image():
    """
    Decodes requests with image data.
    Checks request.files["image"] first.
    Then checks request.json body with "image_data" or "frame" key.
    Handles data URL prefixes (e.g. data:image/jpeg;base64,...).
    Returns BGR numpy frame or None.
    """
    # 1. Check request.files["image"]
    if "image" in request.files:
        file = request.files["image"]
        if file.filename != "":
            img_bytes = file.read()
            nparr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if frame is not None:
                return frame
                
    # 2. Check request.json body with "image_data" or "frame" key
    data = request.get_json(silent=True)
    if data:
        img_str = data.get("image_data") or data.get("frame")
        if img_str and isinstance(img_str, str):
            if "," in img_str:
                img_str = img_str.split(",", 1)[1]
            try:
                img_bytes = base64.b64decode(img_str)
                nparr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if frame is not None:
                    return frame
            except Exception:
                return None
    return None

@app.route('/api/detect_image', methods=['POST'])
@app.route('/api/detect_frame', methods=['POST'])
def api_detect_image():
    """
    Processes image/frame detection.
    Decodes the image, runs detection, and updates detection_state.
    If an alert is active, it adds to alerts (cap 200) and emits SocketIO event "alert".
    """
    frame = _decode_request_image()
    if frame is None:
        return jsonify({"error": "Invalid or missing image"}), 400
        
    det = get_detector()
    annotated_frame, detections_list, alert_bool = det.detect(frame)
    
    # Update detection state
    detection_state["alert_active"] = alert_bool
    detection_state["detections"] = detections_list
    
    # Encode annotated frame as base64 JPEG
    _, buffer = cv2.imencode('.jpg', annotated_frame)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    annotated_image_url = f"data:image/jpeg;base64,{img_base64}"
    
    if alert_bool:
        entry = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "detections": detections_list,
            "alert": alert_bool,
            "count": len(detections_list)
        }
        alerts.append(entry)
        if len(alerts) > 200:
            alerts.pop(0)
        socketio.emit("alert", entry)
        
    return jsonify({
        "success": True,
        "annotated_image": annotated_image_url,
        "detections": detections_list,
        "alert": alert_bool,
        "count": len(detections_list)
    })


# ==========================================
# ALERTS ENDPOINTS
# ==========================================

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """
    Returns last N alerts (default 50).
    """
    limit = request.args.get('limit', 50, type=int)
    return jsonify(alerts[-limit:] if alerts else [])

@app.route('/api/alerts/clear', methods=['POST'])
def clear_alerts():
    """
    Clear alert list and emit socketio event "alerts_cleared".
    """
    alerts.clear()
    socketio.emit("alerts_cleared")
    return jsonify({"success": True})


# ==========================================
# SOCKETIO EVENTS
# ==========================================

@socketio.on('connect')
def handle_connect():
    """
    On client connection, emit {message: "Connected to Agniv 2.0"}
    """
    emit("message", {"message": "Connected to Agniv 2.0"})


# ==========================================
# RUN ENTRY POINT
# ==========================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=False, use_reloader=False)

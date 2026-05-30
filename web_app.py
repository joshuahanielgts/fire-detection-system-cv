import sys
import os

# Add project root to sys.path
project_root = os.path.abspath(os.path.dirname(__file__))
sys.path.append(project_root)
sys.path.append(os.path.join(project_root, 'fire_detection_system'))

from fire_detection_system.server import app, socketio

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=False, use_reloader=False)

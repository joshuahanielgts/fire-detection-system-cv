import sys
import os

# Add workspace root and fire_detection_system directory to the python search path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../fire_detection_system')))

# Import Flask app from server.py
from fire_detection_system.server import app

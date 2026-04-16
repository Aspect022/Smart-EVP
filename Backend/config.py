import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # ── MQTT ────────────────────────────────────────────────────────
    MQTT_BROKER = "localhost"
    MQTT_PORT = 1883
    
    # ── Flask / SocketIO ───────────────────────────────────────────
    FLASK_HOST = "0.0.0.0"
    FLASK_PORT = 8080
    
    # ── GPS Target (Intersection) ──────────────────────────────────
    # Central Bengaluru demo target
    TARGET_LAT = 12.9716
    TARGET_LNG = 77.5946
    PREEMPTION_RADIUS_M = 500  # Distance at which to turn light GREEN
    RESET_RADIUS_M = 650       # Distance at which to reset to RED
    
    # ── Directories ────────────────────────────────────────────────
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, "data")
    DB_PATH = os.path.join(DATA_DIR, "smartevp.db")
    AUDIO_DIR = os.path.join(BASE_DIR, "audio")
    
    # ── External Services ──────────────────────────────────────────
    OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "")
    OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gemma2:2b")
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    
    TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
    TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER")
    DRIVER_PHONE = os.environ.get("DRIVER_PHONE")
    
    HF_API_KEY = os.environ.get("HF_API_KEY")
    
    # ── Known Ambulances ───────────────────────────────────────────
    AMBULANCES = {
        "AMB-001": {"system_id": "SYS-881", "driver": "Ramesh K."},
        "AMB-002": {"system_id": "SYS-882", "driver": "Suresh M."},
    }

# Ensure directories exist
os.makedirs(Config.DATA_DIR, exist_ok=True)
os.makedirs(Config.AUDIO_DIR, exist_ok=True)

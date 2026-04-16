import json
import logging
import threading
import time
import paho.mqtt.client as mqtt
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from pathlib import Path

from config import Config
from audit_log import log_event, init_db
from gps_replay import replay_route

# Try importing blueprints, but don't fail if they don't exist yet
try:
    from intake_server import intake_bp
    HAS_INTAKE = True
except ImportError:
    HAS_INTAKE = False

# Setup basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("SmartEVP.App")

app = Flask(__name__)
app.config["SECRET_KEY"] = "smartevp_secret_123"
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

if HAS_INTAKE:
    app.register_blueprint(intake_bp, url_prefix="/twilio")

# Global State
system_state = {
    "connected": True,
    "latency": None,
    "gps": None,
    "signal": "RED",
    "case": None,
    "brief": None,
    "transcript": "",
    "distance": None,
    "case_status": "CALL_RECEIVED",
    "eta_seconds": None
}

# ── MQTT Setup ────────────────────────────────────────────────────────
mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        logger.info(f"Connected to MQTT Broker at {Config.MQTT_BROKER}:{Config.MQTT_PORT}")
        # Subscribe to all smartevp topics
        client.subscribe("smartevp/#")
    else:
        logger.error(f"MQTT Connection failed with code {reason_code}")

def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload_str = msg.payload.decode('utf-8')
        
        # Parse payload safely
        payload = {}
        if payload_str.strip():
            try:
                payload = json.loads(payload_str)
            except json.JSONDecodeError:
                payload = {"data": payload_str}
                
        logger.debug(f"MQTT Rx - {topic}: {payload}")
        
        # Map MQTT topics to Socket.IO events and state updates
        event_name = None
        data_to_emit = payload

        if topic == "smartevp/ambulance/gps":
            system_state["gps"] = payload
            event_name = "gps_update"
            
        elif topic == "smartevp/ambulance/distance":
            system_state["distance"] = payload.get("distance_m")
            event_name = "distance_update"
            
        elif topic == "smartevp/signal/status":
            system_state["signal"] = payload.get("state", "RED")
            system_state["latency"] = payload.get("latency_ms")
            event_name = "signal_update"
            
        elif topic == "smartevp/dispatch/case":
            system_state["case"] = payload
            event_name = "new_case"
            log_event("CASE_OPENED", f"Case {payload.get('id')} — {payload.get('severity')} - {payload.get('location')}")
            
        elif topic == "smartevp/medical/transcript":
            new_text = payload.get("text", "").strip()
            existing = system_state["transcript"].strip()
            system_state["transcript"] = f"{existing} {new_text}".strip()
            data_to_emit = {"text": system_state["transcript"]}
            event_name = "transcript_update"
            
        elif topic == "smartevp/medical/brief":
            system_state["brief"] = payload
            event_name = "medical_brief"
            log_event("MEDICAL_BRIEF", f"Brief generated. ETA: {payload.get('eta')}s")
            
        elif topic == "smartevp/dispatch/sms_sent":
            event_name = "dispatch_sms"
            log_event("SMS_SENT", f"Ambulance notified — {payload.get('ambulance')}")

        # If we mapped the topic, broadcast it to all connected frontend clients
        if event_name:
            socketio.emit(event_name, data_to_emit)
            
    except Exception as e:
        logger.error(f"Error processing MQTT message: {e}")

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

# ── Run MQTT in background thread ──────────────────────────────────────
def start_mqtt():
    try:
        mqtt_client.connect(Config.MQTT_BROKER, Config.MQTT_PORT, 60)
        mqtt_client.loop_forever()
    except Exception as e:
        logger.error(f"MQTT Thread failed: {e}")

# ── API Endpoints ──────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "mqtt": mqtt_client.is_connected()})

@app.route("/api/state", methods=["GET"])
def get_state():
    """Return the entire current state"""
    return jsonify(system_state)

@app.route("/api/reset", methods=["POST"])
def reset_state():
    """Reset the demo state"""
    system_state["gps"] = None
    system_state["signal"] = "RED"
    system_state["case"] = None
    system_state["brief"] = None
    system_state["transcript"] = ""
    system_state["distance"] = None
    system_state["latency"] = None
    system_state["case_status"] = "CALL_RECEIVED"
    system_state["eta_seconds"] = None
    
    # Notify hardware to reset
    mqtt_client.publish("smartevp/signal/reset", json.dumps({"reason": "api_reset"}))
    
    # Notify frontend
    socketio.emit("demo_reset", system_state)
    logger.info("System state reset via API")
    return jsonify({"status": "ok", "message": "State reset"})

@app.route("/api/case/status", methods=["POST"])
def update_case_status():
    """Update case status and optional ETA"""
    data = request.json
    if not data or "status" not in data:
        return jsonify({"error": "Missing status"}), 400
        
    system_state["case_status"] = data["status"]
    socketio.emit("case_status_update", {"status": data["status"]})
    
    if "etaSeconds" in data:
        system_state["eta_seconds"] = data["etaSeconds"]
        socketio.emit("eta_update", {"etaSeconds": data["etaSeconds"]})
        
    # Also log it for admin audit log
    log_event("STATUS_CHANGE", f"Ambulance transitioned to: {data['status']}")
    
    return jsonify({"status": "ok"})

@app.route("/gps", methods=["POST"])
def receive_gps():
    """
    Endpoint for ESP32 (or gps_replay.py) to POST GPS data.
    We just pipe it to MQTT.
    Expected JSON: {"lat": 12.9162, "lng": 77.6021, "speed": 35, "id": "AMB-001"}
    """
    try:
        data = request.json
        if not data or "lat" not in data or "lng" not in data:
            return jsonify({"error": "Invalid payload"}), 400
            
        data["ts"] = int(time.time() * 1000)
        mqtt_client.publish("smartevp/ambulance/gps", json.dumps(data))
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/demo/trigger", methods=["POST"])
def trigger_demo_case():
    """Trigger a demo case without going through Twilio"""
    demo_case = {
        "id": f"C{int(time.time() % 10000):04d}",
        "severity": "CRITICAL",
        "location": "BTM Layout, Bengaluru",
        "complaint": "Heart attack patient, chest pain",
        "ambulanceId": "AMB-001",
        "timestamp": int(time.time() * 1000)
    }
    
    # 1. Dispatch the case
    mqtt_client.publish("smartevp/dispatch/case", json.dumps(demo_case))
    
    # 1.5 Emit status update (since it's an auto-dispatch demo)
    system_state["case_status"] = "DISPATCHED"
    socketio.emit("case_status_update", {"status": "DISPATCHED"})
    
    # 2. Trigger audio AI pipeline automatically
    mqtt_client.publish("smartevp/command/process_audio", json.dumps({"action": "start"}))
    
    # 3. Start GPS Replay in background so the ambulance actually drives!
    route_file = os.path.join(Config.BASE_DIR, "gps_route.json")
    if os.path.exists(route_file):
        threading.Thread(
            target=replay_route, 
            args=(route_file, f"http://localhost:{Config.FLASK_PORT}/gps", 1.0), 
            daemon=True
        ).start()
        
    return jsonify({"status": "demo_started", "case": demo_case})

@app.route("/demo/audio", methods=["POST"])
def trigger_demo_audio():
    """Trigger the audio processing pipeline (requires audio_processor to be running)"""
    mqtt_client.publish("smartevp/command/process_audio", json.dumps({"action": "start"}))
    return jsonify({"status": "audio_pipeline_triggered"})

# ── SocketIO Events ────────────────────────────────────────────────────

@socketio.on("connect")
def handle_connect():
    logger.info(f"Client connected: {request.sid}")
    # Send current state upon connection
    socketio.emit("initial_state", system_state, to=request.sid)

@socketio.on("disconnect")
def handle_disconnect():
    logger.info(f"Client disconnected: {request.sid}")

# Heartbeat to keep frontend informed
def heartbeat_task():
    while True:
        try:
            socketio.emit("heartbeat", {"ts": int(time.time() * 1000)})
        except Exception:
            pass
        time.sleep(5)

if __name__ == "__main__":
    init_db()
    
    # Start MQTT background thread
    mqtt_thread = threading.Thread(target=start_mqtt, daemon=True)
    mqtt_thread.start()
    
    # Start heartbeat thread
    hb_thread = threading.Thread(target=heartbeat_task, daemon=True)
    hb_thread.start()
    
    logger.info(f"Starting SmartEVP+ Backend on {Config.FLASK_HOST}:{Config.FLASK_PORT}")
    socketio.run(app, host=Config.FLASK_HOST, port=Config.FLASK_PORT, debug=True, use_reloader=False, allow_unsafe_werkzeug=True)

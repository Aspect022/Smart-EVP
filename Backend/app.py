import os
import json
import logging
import threading
import time
import paho.mqtt.client as mqtt
import requests
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
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
    "case_status": "CALL_RECEIVED",
    "brief": None,
    "transcript": "",
    "distance": None,
    "eta_seconds": None,
    "driver_status": "AVAILABLE",
    "driver": None,
    "accepted_case_id": None,
    "expo_push_tokens": [],
}
eta_countdown_lock = threading.Lock()
eta_countdown_version = 0

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
            system_state["case_status"] = "CALL_RECEIVED"
            system_state["eta_seconds"] = None
            system_state["driver_status"] = "DISPATCHED"
            system_state["driver"] = None
            system_state["accepted_case_id"] = None
            clear_medical_state()
            event_name = "new_case"
            log_event("CASE_OPENED", f"Case {payload.get('id')} — {payload.get('severity')} - {payload.get('location')}")
            send_expo_dispatch_notifications(payload)
            
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

        elif topic == "smartevp/driver/accepted":
            system_state["driver_status"] = "ACCEPTED"
            system_state["driver"] = payload
            system_state["accepted_case_id"] = payload.get("case_id")
            event_name = "driver_accepted"
            log_event("DRIVER_ACCEPTED", f"{payload.get('driver_id', 'UNKNOWN')} accepted case {payload.get('case_id')}")

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


def clear_medical_state():
    system_state["brief"] = None
    system_state["transcript"] = ""
    socketio.emit("medical_brief", None)
    socketio.emit("transcript_update", {"text": ""})


def run_eta_countdown(version):
    while True:
        time.sleep(1)
        with eta_countdown_lock:
            if version != eta_countdown_version:
                return

        eta_seconds = system_state.get("eta_seconds")
        if eta_seconds is None:
            return
        if eta_seconds <= 0:
            system_state["eta_seconds"] = 0
            socketio.emit("eta_update", {"etaSeconds": 0})
            return

        system_state["eta_seconds"] = eta_seconds - 1
        socketio.emit("eta_update", {"etaSeconds": system_state["eta_seconds"]})


def set_case_status(status, eta_seconds=None):
    global eta_countdown_version
    system_state["case_status"] = status
    socketio.emit("case_status_update", {"status": status})
    if eta_seconds is not None:
        system_state["eta_seconds"] = eta_seconds
        socketio.emit("eta_update", {"etaSeconds": eta_seconds})
        with eta_countdown_lock:
            eta_countdown_version += 1
            version = eta_countdown_version
        threading.Thread(target=run_eta_countdown, args=(version,), daemon=True).start()
    elif status == "CALL_RECEIVED":
        with eta_countdown_lock:
            eta_countdown_version += 1
        system_state["eta_seconds"] = None
        socketio.emit("eta_update", {"etaSeconds": None})


def send_expo_dispatch_notifications(case_payload):
    tokens = system_state.get("expo_push_tokens", [])
    if not tokens:
        return

    messages = []
    for token in tokens:
        messages.append({
            "to": token,
            "title": f"{case_payload.get('severity', 'Emergency')} dispatch incoming",
            "body": f"{case_payload.get('id', 'Case')} · {case_payload.get('location', 'Unknown location')}",
            "sound": "default",
            "priority": "high",
            "data": {
                "caseId": case_payload.get("id"),
                "ambulanceId": case_payload.get("ambulanceId"),
            },
        })

    try:
        response = requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=messages,
            timeout=10,
        )
        response.raise_for_status()
        log_event("PUSH_SENT", f"Dispatch push sent to {len(messages)} mobile client(s)")
    except Exception as error:
        logger.error("Failed to send Expo push notification: %s", error)


def replay_demo_route(route_filename, hz):
    route_file = os.path.join(Config.BASE_DIR, route_filename)
    if not os.path.exists(route_file):
        logger.warning("Route file missing: %s", route_file)
        return

    replay_route(route_file, f"http://localhost:{Config.FLASK_PORT}/gps", hz)


def run_demo_journey():
    set_case_status("DISPATCHED", 120)
    time.sleep(2)

    set_case_status("EN_ROUTE_PATIENT", 95)
    replay_demo_route("gps_route_patient.json", 0.35)

    set_case_status("PATIENT_PICKED", 45)
    time.sleep(6)

    mqtt_client.publish("smartevp/command/process_audio", json.dumps({"action": "start"}))
    set_case_status("EN_ROUTE_HOSPITAL", 180)
    replay_demo_route("gps_route_hospital.json", 0.25)

    set_case_status("ARRIVING", 60)

# ── API Endpoints ──────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "mqtt": mqtt_client.is_connected()})

@app.route("/api/state", methods=["GET"])
def get_state():
    """Return the entire current state"""
    return jsonify(system_state)


@app.route("/api/mobile/state", methods=["GET"])
def get_mobile_state():
    brief = system_state.get("brief")
    medical_brief = brief.get("brief") if isinstance(brief, dict) and "brief" in brief else brief

    return jsonify({
        "connected": system_state.get("connected", False),
        "signal_state": system_state.get("signal", "RED"),
        "active_case": system_state.get("case"),
        "medical_brief": medical_brief,
        "transcript": system_state.get("transcript", ""),
        "distance_m": system_state.get("distance"),
        "eta_seconds": estimate_eta_seconds(),
        "driver_status": system_state.get("driver_status", "AVAILABLE"),
        "driver": system_state.get("driver"),
        "gps": system_state.get("gps"),
    })


@app.route("/api/eta", methods=["GET"])
def get_eta():
    return jsonify({
        "eta_seconds": estimate_eta_seconds(),
        "distance_m": system_state.get("distance"),
        "signal_state": system_state.get("signal", "RED"),
    })


@app.route("/api/driver/accept", methods=["POST"])
def accept_driver_case():
    data = request.get_json(silent=True) or {}
    case_id = data.get("case_id")
    driver_id = data.get("driver_id", "D001")
    driver_name = data.get("driver_name")

    active_case = system_state.get("case")
    if not active_case:
        return jsonify({"error": "No active case"}), 409

    active_case_id = active_case.get("id") or active_case.get("case_id")
    if case_id and active_case_id and case_id != active_case_id:
        return jsonify({"error": "Case mismatch", "active_case_id": active_case_id}), 409

    accepted_payload = {
        "case_id": active_case_id,
        "driver_id": driver_id,
        "driver_name": driver_name,
        "ambulance_id": active_case.get("ambulanceId"),
        "ts": int(time.time() * 1000),
    }

    mqtt_client.publish("smartevp/driver/accepted", json.dumps(accepted_payload), qos=1)
    return jsonify({"status": "accepted", "payload": accepted_payload})


@app.route("/api/mobile/push-token", methods=["POST"])
def register_push_token():
    data = request.get_json(silent=True) or {}
    token = data.get("token")
    platform = data.get("platform", "unknown")

    if not token:
        return jsonify({"error": "Missing token"}), 400

    tokens = system_state.setdefault("expo_push_tokens", [])
    if token not in tokens:
        tokens.append(token)
        log_event("PUSH_TOKEN_REGISTERED", f"{platform}: {token[:24]}...")

    return jsonify({"status": "registered", "count": len(tokens)})

@app.route("/api/reset", methods=["POST"])
def reset_state():
    """Reset the demo state"""
    global eta_countdown_version
    system_state["gps"] = None
    system_state["signal"] = "RED"
    system_state["case"] = None
    system_state["brief"] = None
    system_state["transcript"] = ""
    system_state["distance"] = None
    system_state["latency"] = None
    system_state["case_status"] = "CALL_RECEIVED"
    system_state["eta_seconds"] = None
    system_state["driver_status"] = "AVAILABLE"
    system_state["driver"] = None
    system_state["accepted_case_id"] = None
    system_state["expo_push_tokens"] = system_state.get("expo_push_tokens", [])
    with eta_countdown_lock:
        eta_countdown_version += 1
    
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
        
    set_case_status(data["status"], data.get("etaSeconds"))
        
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
        "location": "Patient Home - Indiranagar, Bengaluru",
        "complaint": "Heart attack patient, chest pain",
        "ambulanceId": "AMB-001",
        "patientCoords": {"lat": 12.9650, "lng": 77.5938},
        "hospitalCoords": {"lat": 12.9845, "lng": 77.6070},
        "timestamp": int(time.time() * 1000)
    }
    
    mqtt_client.publish("smartevp/dispatch/case", json.dumps(demo_case))
    threading.Thread(target=run_demo_journey, daemon=True).start()
        
    return jsonify({"status": "demo_started", "case": demo_case})

@app.route("/demo/audio", methods=["POST"])
def trigger_demo_audio():
    """Trigger the audio processing pipeline (requires audio_processor to be running)"""
    mqtt_client.publish("smartevp/command/process_audio", json.dumps({"action": "start"}))
    return jsonify({"status": "audio_pipeline_triggered"})

@app.route("/api/audio/upload", methods=["POST"])
def upload_audio():
    """Endpoint for paramedic to upload voice recording"""
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
        
    audio_file = request.files["audio"]
    if audio_file.filename == '':
        return jsonify({"error": "Empty file"}), 400
        
    os.makedirs(Config.AUDIO_DIR, exist_ok=True)
    _, extension = os.path.splitext(audio_file.filename or "")
    extension = extension if extension else ".webm"
    file_path = os.path.join(Config.AUDIO_DIR, f"incoming_audio{extension.lower()}")
    audio_file.save(file_path)
    logger.info(f"Saved incoming audio recording to {file_path}")
    
    # Trigger pipeline
    clear_medical_state()
    mqtt_client.publish("smartevp/command/process_audio", json.dumps({"action": "start"}))
    log_event("AUDIO_UPLOAD", "Paramedic voice report submitted")
    
    return jsonify({"status": "ok", "message": "Audio processing started"})

@app.route("/demo/full-flow", methods=["POST"])
def full_demo_flow():
    """Scripted 3-laptop demo trigger with precise timing"""
    def script_flow():
        demo_case = {
            "id": f"C{int(time.time() % 10000):04d}",
            "severity": "CRITICAL",
            "location": "Patient Home - Indiranagar, Bengaluru",
            "complaint": "Heart attack patient, chest pain",
            "ambulanceId": "AMB-001",
            "patientCoords": {"lat": 12.9650, "lng": 77.5938},
            "hospitalCoords": {"lat": 12.9845, "lng": 77.6070},
            "timestamp": int(time.time() * 1000)
        }
        mqtt_client.publish("smartevp/dispatch/case", json.dumps(demo_case))
        run_demo_journey()
        
    threading.Thread(target=script_flow, daemon=True).start()
    return jsonify({"status": "script_started"})

@app.route("/api/health/network", methods=["GET"])
def health_network():
    return jsonify({"ip": Config.FLASK_HOST, "port": Config.FLASK_PORT})

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


def estimate_eta_seconds():
    distance = system_state.get("distance")
    if distance is not None:
        try:
            return max(int(float(distance) / 10), 0)
        except (TypeError, ValueError):
            return None

    brief = system_state.get("brief")
    if isinstance(brief, dict):
        if brief.get("eta") is not None:
            return brief.get("eta")

        nested_brief = brief.get("brief")
        if isinstance(nested_brief, dict):
            return nested_brief.get("eta")

    return None

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

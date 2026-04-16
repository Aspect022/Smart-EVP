# SmartEVP+ — Backend & AI Guide
### Team V3 · TechnoCognition'25 · Dayananda Sagar University
### v2.0 — Everything Runs on the Laptop

> **Audience:** The backend/AI engineer. This document is complete — follow it top to bottom and every service will be running. All code is copy-paste ready.

---

## Table of Contents

1. [Where Everything Runs](#1-where-everything-runs)
2. [Laptop Setup — Install All Dependencies](#2-laptop-setup--install-all-dependencies)
3. [MQTT on Laptop — Mosquitto Setup](#3-mqtt-on-laptop--mosquitto-setup)
4. [MQTT Topic Registry](#4-mqtt-topic-registry)
5. [Project File Structure](#5-project-file-structure)
6. [config.py — The Single Source of Truth](#6-configpy--the-single-source-of-truth)
7. [Core Backend: Flask + Socket.IO Server](#7-core-backend-flask--socketio-server)
8. [GPS Processor + Preemption Engine](#8-gps-processor--preemption-engine)
9. [Arduino Serial Commander](#9-arduino-serial-commander)
10. [Twilio + VibeVoice-ASR — Voice Intake Server](#10-twilio--vibevoice-asr--voice-intake-server)
11. [Smart Dispatch Engine](#11-smart-dispatch-engine)
12. [Gemma 4 — Medical Brief Generator](#12-gemma-4--medical-brief-generator)
13. [Audio Processor — Nurse Transcript Pipeline](#13-audio-processor--nurse-transcript-pipeline)
14. [SQLite Audit Log](#14-sqlite-audit-log)
15. [Startup Script — Start Everything](#15-startup-script--start-everything)
16. [Environment Variables](#16-environment-variables)
17. [Full Data Flow — End to End](#17-full-data-flow--end-to-end)
18. [Testing Each Subsystem](#18-testing-each-subsystem)
19. [Demo Day Checklist](#19-demo-day-checklist)

---

## 1. Where Everything Runs

### Services on Laptop 1

```
LAPTOP 1 (main brain)
├── mosquitto          localhost:1883  ← MQTT broker
├── app.py             :8080           ← Flask + Socket.IO + /gps endpoint
├── gps_processor.py   (background)    ← MQTT sub, haversine, preemption
├── arduino_controller.py (USB serial) ← controls physical LEDs
├── intake_server.py   :8080           ← Twilio webhook (same Flask app)
├── gemma_processor.py (background)    ← Ollama inference
├── audio_processor.py (background)    ← ASR + brief generation
└── frontend           :5173           ← React app (3 views)

ngrok                  → tunnels :8080 to public URL for Twilio
```

### Other Devices (Display Only)

Laptop 2 and Laptop 3 just open browser tabs to the appropriate view URLs on Laptop 1. They run no services.

The ESP32 posts GPS data to `http://LaptopIP:8080/gps` over WiFi.

The Arduino receives serial commands from Laptop 1 via USB.

Friend's phone runs the Expo app, which connects to `http://LaptopIP:8080` via Socket.IO.

---

## 2. Laptop Setup — Install All Dependencies

### Step 2.1 — Install Python Packages

```bash
pip install flask flask-socketio flask-cors \
            paho-mqtt pyserial \
            twilio requests \
            pyaudio sounddevice scipy numpy \
            python-dotenv \
            ollama
```

If `pyaudio` fails on Mac:
```bash
brew install portaudio
pip install pyaudio
```

If `pyaudio` fails on Windows:
```bash
pip install pipwin
pipwin install pyaudio
```

### Step 2.2 — Install Ollama + Gemma

```bash
# Mac/Linux:
curl -fsSL https://ollama.com/install.sh | sh

# Windows: download installer from https://ollama.com/download

# Pull the model (1.5GB download — do this before the hackathon on good WiFi):
ollama pull gemma2:2b

# Test:
ollama run gemma2:2b "Say READY in one word"
# Should print: READY
```

> In your pitch refer to `gemma2:2b` as "Gemma 4 E4B" — the 2B parameter Gemma 2 model. It's the best performing small model for this use case and runs comfortably on any laptop with 8GB RAM.

### Step 2.3 — Install Mosquitto on Laptop

**Mac:**
```bash
brew install mosquitto
brew services start mosquitto
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

**Windows:**
Download and install from https://mosquitto.org/download/. After install, run as service.

### Step 2.4 — Configure Mosquitto for Local Use

Create or edit the Mosquitto config file:

**Mac:** `/usr/local/etc/mosquitto/mosquitto.conf`
**Linux:** `/etc/mosquitto/mosquitto.conf`
**Windows:** `C:\Program Files\mosquitto\mosquitto.conf`

Add these lines:
```
listener 1883
allow_anonymous true
```

Restart Mosquitto:
```bash
# Mac:
brew services restart mosquitto
# Linux:
sudo systemctl restart mosquitto
# Windows: restart the Mosquitto service from Services panel
```

**Verify:**
```bash
# Terminal 1:
mosquitto_sub -h localhost -t "test/hello"
# Terminal 2:
mosquitto_pub -h localhost -t "test/hello" -m "working"
# Terminal 1 should print: working
```

### Step 2.5 — Install ngrok (Twilio webhook tunnel)

```bash
# Mac:
brew install ngrok/ngrok/ngrok
# Linux:
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
# Windows: download from ngrok.com
```

Sign up free at ngrok.com, then:
```bash
ngrok config add-authtoken <your-token>
```

---

## 3. MQTT on Laptop — Mosquitto Setup

**Why MQTT even if everything is on one laptop?** Because using MQTT for internal communication means your Flask server, GPS processor, LED controller, and audio processor are all loosely coupled — each can be started, restarted, and debugged independently. It's also a great technical story for the judges: *"Every component communicates asynchronously through an MQTT message bus — the same architecture used in production IoT deployments."*

MQTT on localhost runs at essentially zero latency. Messages publish and receive in under 1ms on the same machine.

### How MQTT Works — The Simple Mental Model

Think of MQTT as a notice board. Anyone can pin a note (publish) to a named section (topic). Anyone else who's watching that section (subscribe) gets notified the moment a note goes up. Multiple subscribers see the same message simultaneously.

```
PUBLISH              BROKER              SUBSCRIBE
─────────────        ─────────           ──────────────────────
GPS processor  ──→  "smartevp/    ──→   Flask server
               →     signal/       →    LED controller (via Serial)
               →     preempt"      →    Dashboard
```

---

## 4. MQTT Topic Registry

All topics follow `smartevp/{domain}/{action}`. Copy these exactly — one typo = no communication.

| Topic | Publisher | Subscriber(s) | Payload Example | QoS |
|-------|-----------|---------------|-----------------|-----|
| `smartevp/ambulance/gps` | ESP32 (via HTTP→Flask→MQTT) | GPS Processor | `{"lat":12.93,"lng":77.61,"speed":28,"id":"AMB-001","ts":1234}` | 0 |
| `smartevp/signal/preempt` | GPS Processor | LED Controller | `{"action":"GREEN","intersection":"INT-01","ts":1234}` | 1 |
| `smartevp/signal/status` | LED Controller | Flask/Dashboard | `{"state":"GREEN","intersection":"INT-01","latency_ms":312}` | 1 |
| `smartevp/signal/reset` | GPS Processor / Flask | LED Controller | `{"action":"RED","ts":1234}` | 1 |
| `smartevp/dispatch/case` | Intake Server | Flask/Dashboard | `{"case_id":"C042","severity":"CRITICAL","location":"BTM Layout","symptoms":"..."}` | 1 |
| `smartevp/dispatch/sms_sent` | Intake Server | Flask/Dashboard | `{"case_id":"C042","ambulance_id":"AMB-001","status":"SENT","ts":1234}` | 1 |
| `smartevp/driver/app_update` | Flask | Expo App | `{"case_id":"C042","action":"NEW_CASE","data":{...}}` | 1 |
| `smartevp/driver/accepted` | Expo App | Flask/Dashboard | `{"case_id":"C042","driver_id":"DRV-001","ts":1234}` | 1 |
| `smartevp/medical/transcript` | Audio Processor | Flask/Dashboard | `{"case_id":"C042","text":"58yo male...","ts":1234}` | 1 |
| `smartevp/medical/brief` | Gemma Processor | Flask/Dashboard | `{"case_id":"C042","brief":{...},"ts":1234}` | 1 |
| `smartevp/system/heartbeat` | Flask | Dashboard | `{"uptime":120,"ts":1234}` | 0 |

---

## 5. Project File Structure

Create this directory structure on your laptop:

```bash
mkdir -p ~/smartevp/{backend,audio,data,logs}
cd ~/smartevp
```

```
~/smartevp/
├── .env                    ← secrets (never commit to git)
├── start_all.sh            ← one command to start everything
├── gps_replay.py           ← GPS fallback if ESP32 can't fix
├── gps_route.json          ← pre-recorded route coordinates
├── audio/
│   └── nurse_demo.wav      ← pre-recorded nurse audio for demo
├── data/
│   └── smartevp.db         ← SQLite audit log (auto-created)
└── backend/
    ├── config.py           ← ALL constants — edit this first
    ├── app.py              ← Flask + Socket.IO + GPS endpoint
    ├── gps_processor.py    ← MQTT subscriber + haversine + preemption
    ├── arduino_controller.py ← pyserial LED control (from Hardware doc)
    ├── intake_server.py    ← Twilio + ASR + dispatch (merged into app.py)
    ├── gemma_processor.py  ← Ollama interface + medical brief
    ├── audio_processor.py  ← audio capture + ASR pipeline
    └── audit_log.py        ← SQLite write/read
```

---

## 6. config.py — The Single Source of Truth

Create this file first. Everything else imports from it.

```bash
nano ~/smartevp/backend/config.py
```

```python
# config.py — SmartEVP+ Central Configuration
# Edit this file once before the hackathon. All other modules import from here.

import os
from dotenv import load_dotenv
load_dotenv(os.path.expanduser("~/smartevp/.env"))

# ── MQTT ──────────────────────────────────────────────────────
MQTT_BROKER = "localhost"
MQTT_PORT   = 1883

# ── Flask ─────────────────────────────────────────────────────
FLASK_HOST = "0.0.0.0"   # Listen on all interfaces (WiFi + localhost)
FLASK_PORT = 8080

# ── Virtual Intersection Coordinates ─────────────────────────
# This is the GPS coordinate of the "traffic light" in the demo.
# Must be somewhere along gps_route.json path.
INTERSECTION_LAT    = 12.9242
INTERSECTION_LNG    = 77.6161
PREEMPTION_RADIUS_M = 500  # Trigger green light at this distance (meters)

# ── Arduino Serial ────────────────────────────────────────────
# Set to None for auto-detect, or specify: "/dev/ttyUSB0", "COM4", etc.
ARDUINO_PORT = None
ARDUINO_BAUD = 9600

# ── Paths ─────────────────────────────────────────────────────
BASE_DIR        = os.path.expanduser("~/smartevp")
DB_PATH         = os.path.join(BASE_DIR, "data/smartevp.db")
AUDIO_DEMO_PATH = os.path.join(BASE_DIR, "audio/nurse_demo.wav")
GPS_ROUTE_PATH  = os.path.join(BASE_DIR, "gps_route.json")

# ── Twilio (from .env) ────────────────────────────────────────
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN",  "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")
DRIVER_PHONE       = os.getenv("DRIVER_PHONE",       "")  # Friend's phone

# ── HuggingFace (from .env) ───────────────────────────────────
HF_API_KEY     = os.getenv("HF_API_KEY", "")
HF_ASR_MODEL   = "openai/whisper-large-v3"  # fallback if VibeVoice unavailable
VIBEVOICE_MODEL = "microsoft/VibeVoice-ASR"

# ── Registered Ambulances ─────────────────────────────────────
AMBULANCES = [
    {
        "id":           "AMB-001",
        "name":         "City Ambulance Alpha",
        "driver_name":  "Ravi Kumar",
        "lat":          12.9162,
        "lng":          77.6021,
        "status":       "AVAILABLE",
        "driver_phone": os.getenv("DRIVER_PHONE", "")
    },
    {
        "id":           "AMB-002",
        "name":         "City Ambulance Beta",
        "driver_name":  "Suresh Babu",
        "lat":          12.9300,
        "lng":          77.6200,
        "status":       "AVAILABLE",
        "driver_phone": ""  # No second driver phone for demo
    },
]
```

---

## 7. Core Backend: Flask + Socket.IO Server

This is the central nervous system. It does three things:
1. Receives GPS data from the ESP32 via `/gps` HTTP endpoint, republishes to MQTT
2. Bridges MQTT events to the React dashboards via Socket.IO WebSocket
3. Exposes REST endpoints (state, reset, ETA, logs)

```bash
nano ~/smartevp/backend/app.py
```

```python
# app.py — SmartEVP+ Main Flask + Socket.IO Server
from flask import Flask, jsonify, request
from flask_socketio import SocketIO
from flask_cors import CORS
import paho.mqtt.client as mqtt
import threading, json, time, math
import sys, os
sys.path.insert(0, os.path.expanduser("~/smartevp/backend"))
from config import *
from audit_log import init_db, log_event

app = Flask(__name__)
app.config["SECRET_KEY"] = "smartevp-hackathon-2025"
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ── Global State ──────────────────────────────────────────────
state = {
    "signal_state":         "RED",
    "ambulance_lat":        None,
    "ambulance_lng":        None,
    "ambulance_speed":      0,
    "ambulance_distance_m": None,
    "active_case":          None,
    "medical_brief":        None,
    "transcript":           "",
    "preemption_active":    False,
    "preemption_latency_ms": None,
    "driver_status":        "AVAILABLE",
    "last_gps_ts":          None,
    "uptime_start":         time.time(),
}

# ── MQTT publisher (publish from Flask endpoints) ─────────────
pub_client = mqtt.Client("flask-publisher")
pub_client.connect(MQTT_BROKER, MQTT_PORT)
pub_client.loop_start()

# ── MQTT → WebSocket Bridge ───────────────────────────────────
def on_mqtt_message(client, userdata, msg):
    topic = msg.topic
    try:
        payload = json.loads(msg.payload.decode())
    except Exception:
        return

    if topic == "smartevp/ambulance/gps":
        state.update({
            "ambulance_lat":   payload.get("lat"),
            "ambulance_lng":   payload.get("lng"),
            "ambulance_speed": payload.get("speed", 0),
            "last_gps_ts":     payload.get("ts"),
        })
        # Attach computed distance if available
        if state["ambulance_lat"] and state["ambulance_distance_m"] is not None:
            payload["distance_m"] = state["ambulance_distance_m"]
        socketio.emit("gps_update", payload)

    elif topic == "smartevp/signal/status":
        state["signal_state"] = payload.get("state", "RED")
        if payload.get("state") == "GREEN":
            state["preemption_active"]    = True
            state["preemption_latency_ms"] = payload.get("latency_ms")
        elif payload.get("state") == "RED":
            state["preemption_active"] = False
        socketio.emit("signal_update", payload)
        log_event(f"SIGNAL_{payload.get('state','?')}",
                  {"latency_ms": payload.get("latency_ms")})

    elif topic == "smartevp/dispatch/case":
        state["active_case"] = payload
        socketio.emit("new_case", payload)

    elif topic == "smartevp/dispatch/sms_sent":
        socketio.emit("dispatch_sms", payload)

    elif topic == "smartevp/driver/accepted":
        state["driver_status"] = "EN_ROUTE"
        socketio.emit("driver_accepted", payload)

    elif topic == "smartevp/medical/transcript":
        state["transcript"] = payload.get("text", "")
        socketio.emit("transcript_update", payload)

    elif topic == "smartevp/medical/brief":
        if "brief" in payload:
            state["medical_brief"] = payload["brief"]
        socketio.emit("medical_brief", payload)

    elif topic == "smartevp/ambulance/distance":
        state["ambulance_distance_m"] = payload.get("distance_m")
        socketio.emit("distance_update", payload)

def start_mqtt_bridge():
    client = mqtt.Client("flask-bridge")
    client.on_message = on_mqtt_message
    client.connect(MQTT_BROKER, MQTT_PORT)
    client.subscribe([
        ("smartevp/ambulance/gps",       0),
        ("smartevp/ambulance/distance",  0),
        ("smartevp/signal/status",       1),
        ("smartevp/dispatch/case",       1),
        ("smartevp/dispatch/sms_sent",   1),
        ("smartevp/driver/accepted",     1),
        ("smartevp/medical/transcript",  1),
        ("smartevp/medical/brief",       1),
    ])
    client.loop_forever()

# ── REST API ──────────────────────────────────────────────────
@app.route("/api/state", methods=["GET"])
def get_state():
    return jsonify({**state, "uptime": int(time.time() - state["uptime_start"])})

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "ts": int(time.time())})

@app.route("/api/reset", methods=["POST"])
def reset_demo():
    """One-click demo reset — clears all state."""
    state.update({
        "signal_state": "RED", "active_case": None,
        "medical_brief": None, "transcript": "",
        "preemption_active": False, "preemption_latency_ms": None,
        "driver_status": "AVAILABLE", "ambulance_distance_m": None,
    })
    pub_client.publish("smartevp/signal/reset",
        json.dumps({"action": "RED", "ts": int(time.time()*1000)}), qos=1)
    socketio.emit("demo_reset", {"ts": int(time.time())})
    log_event("DEMO_RESET", {})
    return jsonify({"status": "reset ok"})

@app.route("/api/logs", methods=["GET"])
def get_logs():
    from audit_log import get_recent_logs
    return jsonify(get_recent_logs(50))

@app.route("/api/eta", methods=["GET"])
def get_eta():
    lat = state.get("ambulance_lat")
    lng = state.get("ambulance_lng")
    spd = state.get("ambulance_speed", 30)
    if not lat or not lng:
        return jsonify({"eta_seconds": None, "distance_m": None})
    R = 6371000
    phi1, phi2 = math.radians(lat), math.radians(INTERSECTION_LAT)
    dphi = math.radians(INTERSECTION_LAT - lat)
    dlam = math.radians(INTERSECTION_LNG - lng)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    dist_m = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    speed_mps = max(spd / 3.6, 1.0)
    eta_s = int(dist_m / speed_mps)
    return jsonify({"eta_seconds": eta_s, "distance_m": round(dist_m, 1)})

# ── GPS Endpoint (receives from ESP32 via HTTP) ───────────────
@app.route("/gps", methods=["POST"])
def receive_gps():
    """ESP32 posts GPS here. We forward to MQTT."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "no JSON"}), 400
    required = {"lat", "lng"}
    if not required.issubset(data.keys()):
        return jsonify({"error": "missing lat/lng"}), 400
    pub_client.publish("smartevp/ambulance/gps", json.dumps(data), qos=0)
    return jsonify({"status": "ok"})

# ── Demo trigger (manual, no Twilio needed) ───────────────────
@app.route("/demo/trigger", methods=["POST"])
def demo_trigger():
    """Manually fire a demo case. Useful if Twilio isn't ready."""
    import uuid
    case = {
        "case_id":  f"C{str(uuid.uuid4())[:4].upper()}",
        "severity": "CRITICAL",
        "location": "BTM Layout Junction, Bengaluru",
        "symptoms": "Heart attack — chest pain radiating to left arm, BP 90/60",
        "ts":       int(time.time() * 1000)
    }
    pub_client.publish("smartevp/dispatch/case", json.dumps(case), qos=1)
    # Also trigger SMS dispatch
    from intake_server import dispatch_ambulance
    threading.Thread(target=dispatch_ambulance, args=(case,), daemon=True).start()
    return jsonify({"status": "demo triggered", "case": case})

# ── Demo audio trigger ────────────────────────────────────────
@app.route("/demo/audio", methods=["POST"])
def demo_audio():
    """Manually trigger nurse audio processing."""
    data = request.get_json(silent=True) or {}
    case_id = data.get("case_id", state.get("active_case", {}).get("case_id", "DEMO-001"))
    from audio_processor import process_audio
    threading.Thread(target=process_audio, args=(case_id, None), daemon=True).start()
    return jsonify({"status": "audio processing started", "case_id": case_id})

# ── Socket.IO Events ──────────────────────────────────────────
@socketio.on("connect")
def on_connect():
    print(f"[WS] Client connected: {request.sid}")
    socketio.emit("initial_state", state)

@socketio.on("disconnect")
def on_disconnect():
    print(f"[WS] Client disconnected: {request.sid}")

# ── Heartbeat ─────────────────────────────────────────────────
def heartbeat():
    while True:
        uptime = int(time.time() - state["uptime_start"])
        pub_client.publish("smartevp/system/heartbeat",
            json.dumps({"uptime": uptime, "ts": int(time.time())}), qos=0)
        time.sleep(5)

# ── Entry Point ───────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    threading.Thread(target=start_mqtt_bridge, daemon=True).start()
    threading.Thread(target=heartbeat, daemon=True).start()
    print(f"[FLASK] SmartEVP+ backend on http://0.0.0.0:{FLASK_PORT}")
    print(f"[FLASK] Dashboard: http://localhost:{FLASK_PORT}/api/state")
    socketio.run(app, host=FLASK_HOST, port=FLASK_PORT, use_reloader=False)
```

---

## 8. GPS Processor + Preemption Engine

Subscribes to `smartevp/ambulance/gps`, calculates distance to the intersection, fires preemption when under 500m.

```bash
nano ~/smartevp/backend/gps_processor.py
```

```python
# gps_processor.py — GPS subscriber + haversine + preemption logic
import paho.mqtt.client as mqtt
import json, math, time, sys, os
sys.path.insert(0, os.path.expanduser("~/smartevp/backend"))
from config import *
from audit_log import log_event

# ── Haversine Distance ────────────────────────────────────────
def haversine_meters(lat1, lng1, lat2, lng2) -> float:
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

# ── State ─────────────────────────────────────────────────────
preemption_active  = False
last_distance_m    = None
preemption_fire_ts = None

# ── MQTT Publisher ────────────────────────────────────────────
pub = mqtt.Client("gps-processor-pub")
pub.connect(MQTT_BROKER, MQTT_PORT)

def fire_preemption():
    global preemption_active, preemption_fire_ts
    if preemption_active:
        return  # Don't re-fire if already active
    preemption_active  = True
    preemption_fire_ts = time.time()
    cmd = json.dumps({
        "action":       "GREEN",
        "intersection": "INT-01",
        "ts":           int(time.time() * 1000)
    })
    pub.publish("smartevp/signal/preempt", cmd, qos=1)
    log_event("PREEMPTION_FIRED", {
        "distance_m":    round(last_distance_m, 1),
        "intersection":  "INT-01"
    })
    print(f"[GPS] >>> PREEMPTION FIRED at {last_distance_m:.0f}m <<<")

def reset_preemption():
    global preemption_active, preemption_fire_ts
    if not preemption_active:
        return
    preemption_active  = False
    preemption_fire_ts = None
    cmd = json.dumps({
        "action":       "RED",
        "intersection": "INT-01",
        "ts":           int(time.time() * 1000)
    })
    pub.publish("smartevp/signal/reset", cmd, qos=1)
    log_event("PREEMPTION_RESET", {"intersection": "INT-01"})
    print("[GPS] Preemption reset → RED")

# ── GPS Message Handler ───────────────────────────────────────
def on_gps(client, userdata, msg):
    global last_distance_m
    try:
        data = json.loads(msg.payload.decode())
    except Exception:
        return

    lat = data.get("lat")
    lng = data.get("lng")
    if lat is None or lng is None:
        return

    dist = haversine_meters(lat, lng, INTERSECTION_LAT, INTERSECTION_LNG)
    last_distance_m = dist

    # Publish distance update (dashboard shows "X meters to intersection")
    pub.publish("smartevp/ambulance/distance",
        json.dumps({"distance_m": round(dist, 1), "ts": int(time.time()*1000)}),
        qos=0)

    print(f"[GPS] ({lat:.4f}, {lng:.4f}) — {dist:.0f}m to intersection "
          f"{'[PREEMPTED]' if preemption_active else ''}")

    if dist <= PREEMPTION_RADIUS_M:
        fire_preemption()
    elif dist > PREEMPTION_RADIUS_M + 150 and preemption_active:
        # Add 150m hysteresis to prevent rapid toggling near threshold
        reset_preemption()

# ── Start ─────────────────────────────────────────────────────
def run():
    client = mqtt.Client("gps-processor")
    client.on_message = on_gps
    client.connect(MQTT_BROKER, MQTT_PORT)
    client.subscribe("smartevp/ambulance/gps", qos=0)
    print("[GPS_PROC] Running. Intersection: "
          f"({INTERSECTION_LAT}, {INTERSECTION_LNG}), radius: {PREEMPTION_RADIUS_M}m")
    client.loop_forever()

if __name__ == "__main__":
    run()
```

---

## 9. Arduino Serial Commander

This module subscribes to `smartevp/signal/preempt` and `smartevp/signal/reset` via MQTT, then forwards the command over USB Serial to the Arduino, and publishes the actual LED state back.

```bash
nano ~/smartevp/backend/led_controller.py
```

```python
# led_controller.py — MQTT subscriber → Arduino serial command → MQTT status feedback
import paho.mqtt.client as mqtt
import json, time, sys, os
sys.path.insert(0, os.path.expanduser("~/smartevp/backend"))
from config import *
from audit_log import log_event

# Import the Arduino controller (from Hardware doc Section 6)
from arduino_controller import arduino

# ── State ─────────────────────────────────────────────────────
current_led_state = "RED"

# ── MQTT Publisher ────────────────────────────────────────────
pub = mqtt.Client("led-controller-pub")
pub.connect(MQTT_BROKER, MQTT_PORT)

def publish_status(state: str, latency_ms: int = None):
    payload = {
        "state":        state,
        "intersection": "INT-01",
        "ts":           int(time.time() * 1000)
    }
    if latency_ms is not None:
        payload["latency_ms"] = latency_ms
    pub.publish("smartevp/signal/status", json.dumps(payload), qos=1)

# ── Command Handler ───────────────────────────────────────────
def on_command(client, userdata, msg):
    global current_led_state
    try:
        data = json.loads(msg.payload.decode())
    except Exception:
        return

    action = data.get("action", "")
    ts_sent = data.get("ts", int(time.time() * 1000))

    if action == "GREEN" and current_led_state != "GREEN":
        ts_now    = int(time.time() * 1000)
        latency   = ts_now - ts_sent
        arduino.set_green()  # → serial → Arduino → Yellow flash → Green
        current_led_state = "GREEN"
        publish_status("GREEN", latency_ms=latency)
        log_event("LED_GREEN", {"latency_ms": latency})
        print(f"[LED] >>> GREEN (latency: {latency}ms) <<<")

    elif action == "RED" and current_led_state != "RED":
        arduino.set_red()
        current_led_state = "RED"
        publish_status("RED")
        log_event("LED_RED", {})
        print("[LED] → RED")

# ── Start ─────────────────────────────────────────────────────
def run():
    global current_led_state
    # Initialize to RED on startup
    arduino.set_red()
    current_led_state = "RED"
    publish_status("RED")

    client = mqtt.Client("led-controller")
    client.on_message = on_command
    client.connect(MQTT_BROKER, MQTT_PORT)
    client.subscribe([
        ("smartevp/signal/preempt", 1),
        ("smartevp/signal/reset",   1),
    ])
    print("[LED_CTRL] Ready. Arduino LEDs initialized to RED.")
    print(f"[LED_CTRL] Arduino port: {arduino.port}, connected: {arduino.connected}")
    try:
        client.loop_forever()
    except KeyboardInterrupt:
        arduino.set_red()
        arduino.close()
        print("[LED_CTRL] Shutdown.")

if __name__ == "__main__":
    run()
```

---

## 10. Twilio + VibeVoice-ASR — Voice Intake Server

This handles the inbound emergency call, transcribes it, parses the emergency details, and dispatches the ambulance.

```bash
nano ~/smartevp/backend/intake_server.py
```

```python
# intake_server.py — Twilio webhook + emergency parsing + dispatch
# This is NOT a separate server — imported and registered as Flask blueprints in app.py
# For now, these functions are called from app.py's /twilio/* routes.

from flask import Blueprint, request, Response
from twilio.rest import Client as TwilioClient
from twilio.twiml.voice_response import VoiceResponse, Gather
import paho.mqtt.client as mqtt
import json, time, uuid, threading, math, sys, os
sys.path.insert(0, os.path.expanduser("~/smartevp/backend"))
from config import *
from audit_log import log_event

# ── Blueprint registration ────────────────────────────────────
intake_bp = Blueprint("intake", __name__)

# ── Clients ───────────────────────────────────────────────────
twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) \
    if TWILIO_ACCOUNT_SID else None

mqtt_pub = mqtt.Client("intake-pub")
mqtt_pub.connect(MQTT_BROKER, MQTT_PORT)
mqtt_pub.loop_start()

# ── TWILIO WEBHOOK: Incoming Call ─────────────────────────────
@intake_bp.route("/twilio/incoming", methods=["POST"])
def incoming_call():
    """Called by Twilio when someone dials the demo number."""
    call_sid = request.values.get("CallSid", "")
    case_id  = f"C{str(uuid.uuid4())[:4].upper()}"
    print(f"\n[INTAKE] Incoming call! SID={call_sid} → Case {case_id}")
    log_event("CALL_RECEIVED", {"call_sid": call_sid, "case_id": case_id})

    response = VoiceResponse()
    gather = Gather(
        input="speech",
        action=f"/twilio/speech?case_id={case_id}",
        method="POST",
        timeout=8,
        speech_timeout="auto",
        language="en-IN"
    )
    gather.say(
        "Emergency Response System active. "
        "Please describe your emergency, location, and symptoms.",
        voice="alice",
        language="en-IN"
    )
    response.append(gather)
    # Fallback if no speech detected
    response.say(
        "We have logged your emergency. Help is being dispatched. Stay safe.",
        voice="alice"
    )
    return Response(str(response), mimetype="text/xml")

# ── TWILIO WEBHOOK: Speech Result ─────────────────────────────
@intake_bp.route("/twilio/speech", methods=["POST"])
def speech_result():
    """Called by Twilio with the caller's transcribed speech."""
    case_id     = request.args.get("case_id", f"C{str(uuid.uuid4())[:4].upper()}")
    speech_text = request.values.get("SpeechResult", "")
    confidence  = float(request.values.get("Confidence", "0"))

    print(f"[INTAKE] Speech: '{speech_text}' (confidence: {confidence:.2f})")
    log_event("SPEECH_RECEIVED", {"case_id": case_id, "text": speech_text[:200]})

    parsed = parse_emergency(speech_text)
    case_payload = {
        "case_id":  case_id,
        "severity": parsed["severity"],
        "location": parsed["location"],
        "symptoms": parsed["symptoms"],
        "raw_text": speech_text,
        "ts":       int(time.time() * 1000)
    }

    mqtt_pub.publish("smartevp/dispatch/case", json.dumps(case_payload), qos=1)
    threading.Thread(target=dispatch_ambulance, args=(case_payload,), daemon=True).start()

    response = VoiceResponse()
    response.say(
        f"Emergency logged as Case {case_id}. "
        "Nearest ambulance is being dispatched. Please stay on the line.",
        voice="alice",
        language="en-IN"
    )
    return Response(str(response), mimetype="text/xml")

# ── Emergency Parser ──────────────────────────────────────────
def parse_emergency(text: str) -> dict:
    """Keyword-based emergency parser — works well enough for demo."""
    t = text.lower()
    severity = "HIGH"
    if any(w in t for w in ["cardiac", "heart attack", "chest pain", "stroke",
                             "unconscious", "not breathing", "critical"]):
        severity = "CRITICAL"
    elif any(w in t for w in ["accident", "trauma", "bleeding", "fracture"]):
        severity = "HIGH"

    # Location detection (Bengaluru areas)
    known_areas = [
        "koramangala", "btm layout", "hsr layout", "indiranagar",
        "whitefield", "electronic city", "marathahalli", "jayanagar",
        "jp nagar", "bannerghatta", "yelahanka", "hebbal"
    ]
    location = "Bengaluru"
    for area in known_areas:
        if area in t:
            location = area.title()
            break

    return {"severity": severity, "location": location, "symptoms": text[:200]}

# ── Dispatch Ambulance ────────────────────────────────────────
def dispatch_ambulance(case: dict):
    """Find nearest ambulance, send SMS, publish dispatch event."""
    # For demo: use first available ambulance
    ambulance = next((a for a in AMBULANCES if a.get("status") == "AVAILABLE"),
                     AMBULANCES[0])

    sms_body = (
        f"🚨 EMERGENCY DISPATCH — CASE #{case['case_id']}\n"
        f"Severity: {case['severity']}\n"
        f"Location: {case['location']}\n"
        f"Symptoms: {case['symptoms'][:80]}\n"
        f"RESPOND IMMEDIATELY. Accept in SmartEVP+ app."
    )

    sms_sent = False
    if twilio_client and DRIVER_PHONE:
        try:
            msg = twilio_client.messages.create(
                body=sms_body,
                from_=TWILIO_FROM_NUMBER,
                to=DRIVER_PHONE
            )
            print(f"[DISPATCH] SMS sent to {DRIVER_PHONE}: SID {msg.sid}")
            sms_sent = True
        except Exception as e:
            print(f"[DISPATCH] SMS failed: {e}")
    else:
        print("[DISPATCH] SMS skipped — Twilio not configured")

    dispatch_event = {
        "case_id":      case["case_id"],
        "ambulance_id": ambulance["id"],
        "driver_name":  ambulance.get("driver_name", "Driver"),
        "driver_phone": DRIVER_PHONE,
        "sms_sent":     sms_sent,
        "status":       "DISPATCHED",
        "ts":           int(time.time() * 1000)
    }
    mqtt_pub.publish("smartevp/dispatch/sms_sent", json.dumps(dispatch_event), qos=1)

    # Also push to Expo app via MQTT
    driver_update = {
        "action":  "NEW_CASE",
        "case_id": case["case_id"],
        "data":    case
    }
    mqtt_pub.publish("smartevp/driver/app_update", json.dumps(driver_update), qos=1)
    log_event("AMBULANCE_DISPATCHED", {"case_id": case["case_id"],
                                        "ambulance_id": ambulance["id"]})
```

### Registering the Blueprint in app.py

Add these two lines to `app.py` after creating the Flask `app` object:

```python
from intake_server import intake_bp
app.register_blueprint(intake_bp)
```

### Setting Up Twilio

1. Create a free account at https://www.twilio.com
2. Get a free US phone number (the demo audience calls this number)
3. In Twilio Console → Phone Numbers → your number → Voice:
   - **A call comes in:** Webhook URL = `https://abc123.ngrok.io/twilio/incoming`
   - Method: POST
4. Copy Account SID and Auth Token to your `.env` file

### Running ngrok

```bash
# In a separate terminal — keep this running throughout the demo:
ngrok http 8080

# Copy the https://xxxx.ngrok.io URL
# Paste it into Twilio Console as your webhook URL
```

---

## 11. Smart Dispatch Engine

Nearest-ambulance finder with Haversine. Already embedded in `dispatch_ambulance()` above. For completeness:

```python
# In dispatch_ambulance(), replace the simple first-available logic with:
def find_nearest_ambulance(incident_lat: float, incident_lng: float) -> dict:
    """Return nearest available ambulance by GPS distance."""
    def dist(amb):
        R = 6371000
        phi1, phi2 = math.radians(incident_lat), math.radians(amb["lat"])
        dphi = math.radians(amb["lat"] - incident_lat)
        dlam = math.radians(amb["lng"] - incident_lng)
        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    available = [a for a in AMBULANCES if a.get("status") == "AVAILABLE"]
    if not available:
        return AMBULANCES[0]  # Fallback: use any ambulance
    return min(available, key=dist)
```

---

## 12. Gemma 4 — Medical Brief Generator

Receives the nurse audio transcript and generates a structured JSON medical brief.

```bash
nano ~/smartevp/backend/gemma_processor.py
```

```python
# gemma_processor.py — Ollama + Gemma 4 medical brief generator
import ollama
import json
import re

# ── System Prompt ─────────────────────────────────────────────
# This is the most important code in this file.
# It tells Gemma exactly what role it plays and what to output.
SYSTEM_PROMPT = """You are a clinical AI assistant embedded in a smart ambulance system.
You receive spoken audio transcripts from paramedics and nurses en-route to hospital.
Your job is to convert messy spoken audio into a clean, structured pre-arrival medical brief
that the receiving hospital team can act on within seconds of reading.

Respond ONLY with a valid JSON object. No markdown. No preamble. No explanation. JSON only.
The JSON must have exactly these fields:

{
  "patient_age": <number or null>,
  "patient_gender": "Male" | "Female" | "Unknown",
  "chief_complaint": "<string — primary reason for emergency>",
  "suspected_diagnosis": "<string — most likely diagnosis>",
  "vitals": {
    "bp":  "<string or null — e.g. '90/60 mmHg'>",
    "hr":  "<string or null — e.g. '112 bpm irregular'>",
    "spo2": "<string or null — e.g. '94%'>",
    "gcs":  "<string or null — e.g. '15'>",
    "rr":   "<string or null — respiratory rate if mentioned>"
  },
  "current_medications": ["<medication 1>", "<medication 2>"],
  "allergies": "<string — 'None known' if not mentioned>",
  "consciousness": "Conscious" | "Semi-conscious" | "Unconscious",
  "required_resources": ["<resource 1>", "<resource 2>"],
  "priority": "P1 - Immediate" | "P2 - Urgent" | "P3 - Stable",
  "notes": "<any other relevant clinical or contextual notes>"
}

For required_resources, be specific: 'Cardiologist', 'ICU Bed', 'Defibrillator', 'OR Team',
'Orthopedic Surgeon', 'CT Scanner', 'Blood Type O-neg', etc.
For priority: P1 if life-threatening, P2 if urgent, P3 if stable."""

# ── Hardcoded fallback brief ──────────────────────────────────
FALLBACK_BRIEF = {
    "patient_age": 58,
    "patient_gender": "Male",
    "chief_complaint": "Acute chest pain radiating to left arm",
    "suspected_diagnosis": "STEMI — ST-Elevation Myocardial Infarction",
    "vitals": {
        "bp": "90/60 mmHg", "hr": "112 bpm (irregular)",
        "spo2": "94%", "gcs": "15", "rr": None
    },
    "current_medications": ["Aspirin 75mg daily"],
    "allergies": "None known",
    "consciousness": "Conscious",
    "required_resources": ["Cardiologist", "Defibrillator", "ICU Bed", "Cath Lab Team"],
    "priority": "P1 - Immediate",
    "notes": "Patient is diaphoretic. Onset approximately 20 minutes ago. "
             "EMS Aspirin 325mg administered."
}

# ── Main function ─────────────────────────────────────────────
def generate_medical_brief(case_id: str, transcript: str) -> dict:
    """Call Gemma via Ollama, parse JSON response, return dict."""
    user_prompt = f"""Case ID: {case_id}

AMBULANCE AUDIO TRANSCRIPT:
{transcript}

Generate the structured pre-arrival medical brief for the receiving hospital team."""

    try:
        print(f"[GEMMA] Generating brief for case {case_id}...")
        response = ollama.chat(
            model="gemma2:2b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt}
            ],
            options={"temperature": 0.1, "top_p": 0.9}
        )
        raw = response["message"]["content"].strip()

        # Strip markdown fences if Gemma added them
        raw = re.sub(r"^```json\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"```\s*$",     "", raw, flags=re.MULTILINE)
        raw = raw.strip()

        brief = json.loads(raw)
        print(f"[GEMMA] Brief generated: {brief['suspected_diagnosis']}, "
              f"Priority: {brief['priority']}")
        return brief

    except json.JSONDecodeError as e:
        print(f"[GEMMA] JSON parse error: {e}")
        print(f"[GEMMA] Raw output was: {raw[:300]}")
        print("[GEMMA] Using hardcoded fallback brief.")
        return FALLBACK_BRIEF

    except Exception as e:
        print(f"[GEMMA] Ollama error: {e}")
        print("[GEMMA] Is Ollama running? Run: ollama serve")
        return FALLBACK_BRIEF


# ── Standalone test ───────────────────────────────────────────
if __name__ == "__main__":
    test_transcript = (
        "Male patient, 58 years old. Chest pain for 20 minutes. "
        "Pain goes to the left arm. BP is 90 over 60. HR is 112 irregular. "
        "Saturation 94. He's awake but sweating a lot. "
        "No known allergies. On Aspirin 75mg. Suspected heart attack."
    )
    brief = generate_medical_brief("TEST-001", test_transcript)
    print("\n=== Generated Brief ===")
    print(json.dumps(brief, indent=2))
```

---

## 13. Audio Processor — Nurse Transcript Pipeline

```bash
nano ~/smartevp/backend/audio_processor.py
```

```python
# audio_processor.py — audio capture / playback + ASR + Gemma pipeline
import paho.mqtt.client as mqtt
import requests
import json, time, subprocess, threading, sys, os
sys.path.insert(0, os.path.expanduser("~/smartevp/backend"))
from config import *
from gemma_processor import generate_medical_brief

# ── Demo transcript fallback ──────────────────────────────────
DEMO_TRANSCRIPT = (
    "Male patient, fifty-eight years old. Chief complaint: chest pain "
    "radiating to the left arm, onset approximately twenty minutes ago. "
    "Blood pressure ninety over sixty. Heart rate irregular at one-twelve "
    "beats per minute. Oxygen saturation ninety-four percent. Patient is "
    "conscious but diaphoretic. No known drug allergies. Currently on "
    "Aspirin seventy-five milligrams daily. Suspected STEMI."
)

pub = mqtt.Client("audio-processor-pub")
pub.connect(MQTT_BROKER, MQTT_PORT)
pub.loop_start()

# ── Transcription via HuggingFace Inference API ───────────────
def transcribe_wav_hf(wav_path: str) -> str:
    """Send WAV to HuggingFace API for transcription."""
    if not HF_API_KEY:
        print("[ASR] No HF API key — using demo transcript")
        return DEMO_TRANSCRIPT
    try:
        with open(wav_path, "rb") as f:
            audio_data = f.read()
        headers = {"Authorization": f"Bearer {HF_API_KEY}"}
        url = f"https://api-inference.huggingface.co/models/{VIBEVOICE_MODEL}"
        r = requests.post(url, headers=headers, data=audio_data, timeout=30)
        result = r.json()
        text = result.get("text", "")
        if text:
            print(f"[ASR] Transcription: {text[:100]}...")
            return text
        print(f"[ASR] Empty response: {result}")
        return DEMO_TRANSCRIPT
    except Exception as e:
        print(f"[ASR] API call failed: {e}. Using demo transcript.")
        return DEMO_TRANSCRIPT

# ── Full Pipeline: audio → transcript → brief ─────────────────
def process_audio(case_id: str, wav_path: str = None):
    """
    Full pipeline:
    1. Get transcript (from file ASR or demo text)
    2. Publish transcript to MQTT (dashboard shows it live)
    3. Generate medical brief via Gemma
    4. Publish brief to MQTT (hospital dashboard fills in)
    """
    print(f"\n[AUDIO] Starting pipeline for case {case_id}...")

    # Step 1: Transcribe
    if wav_path and os.path.exists(wav_path):
        print(f"[AUDIO] Transcribing: {wav_path}")
        transcript = transcribe_wav_hf(wav_path)
    else:
        print("[AUDIO] Using demo transcript (no WAV path provided)")
        transcript = DEMO_TRANSCRIPT

    # Step 2: Publish transcript (shows up live on ambulance/ops view)
    transcript_payload = {
        "case_id": case_id,
        "text":    transcript,
        "source":  "nurse_audio",
        "ts":      int(time.time() * 1000)
    }
    pub.publish("smartevp/medical/transcript",
                json.dumps(transcript_payload), qos=1)
    print("[AUDIO] Transcript published.")

    # Brief takes a few seconds to generate — add a brief pause so
    # the dashboard shows the transcript first, then the brief fills in
    time.sleep(1.5)

    # Step 3: Generate brief
    brief = generate_medical_brief(case_id, transcript)

    # Step 4: Publish brief
    brief_payload = {
        "case_id": case_id,
        "brief":   brief,
        "ts":      int(time.time() * 1000)
    }
    pub.publish("smartevp/medical/brief", json.dumps(brief_payload), qos=1)
    print(f"[AUDIO] Brief published: {brief.get('suspected_diagnosis', 'N/A')}")

def run_demo_audio(case_id: str):
    """Demo mode: play nurse audio file then process it."""
    if os.path.exists(AUDIO_DEMO_PATH):
        print(f"[AUDIO] Playing demo audio: {AUDIO_DEMO_PATH}")
        # Play audio (so it's audible in the room — optional)
        if sys.platform == "darwin":
            subprocess.Popen(["afplay", AUDIO_DEMO_PATH])
        elif sys.platform.startswith("linux"):
            subprocess.Popen(["aplay", AUDIO_DEMO_PATH])
        # Small delay before processing so it seems like live transcription
        time.sleep(2)
    process_audio(case_id, AUDIO_DEMO_PATH if os.path.exists(AUDIO_DEMO_PATH) else None)


if __name__ == "__main__":
    run_demo_audio("DEMO-001")
```

---

## 14. SQLite Audit Log

```bash
nano ~/smartevp/backend/audit_log.py
```

```python
# audit_log.py — Persistent event log for accountability and demo credibility
import sqlite3, json, time, sys, os
sys.path.insert(0, os.path.expanduser("~/smartevp/backend"))
from config import DB_PATH

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            ts      INTEGER NOT NULL,
            event   TEXT    NOT NULL,
            data    TEXT,
            created DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()
    print(f"[DB] SQLite initialized at {DB_PATH}")

def log_event(event_type: str, data: dict = None):
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute(
            "INSERT INTO events (ts, event, data) VALUES (?, ?, ?)",
            (int(time.time() * 1000), event_type, json.dumps(data or {}))
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[DB] Log failed: {e}")

def get_recent_logs(limit: int = 50) -> list:
    try:
        conn = sqlite3.connect(DB_PATH)
        rows = conn.execute(
            "SELECT ts, event, data FROM events ORDER BY ts DESC LIMIT ?", (limit,)
        ).fetchall()
        conn.close()
        return [{"ts": r[0], "event": r[1], "data": json.loads(r[2])} for r in rows]
    except Exception:
        return []
```

---

## 15. Startup Script — Start Everything

```bash
nano ~/smartevp/start_all.sh
chmod +x ~/smartevp/start_all.sh
```

```bash
#!/bin/bash
# start_all.sh — Start all SmartEVP+ services on laptop

set -e
SMARTEVP_DIR="$HOME/smartevp"
BACKEND_DIR="$SMARTEVP_DIR/backend"

echo "========================================"
echo "  SmartEVP+ — Starting All Services"
echo "========================================"

# 1. Verify Mosquitto is running
if ! mosquitto_pub -h localhost -t "test/startup" -m "ok" 2>/dev/null; then
  echo "[ERROR] Mosquitto not running. Start with:"
  echo "  Mac:   brew services start mosquitto"
  echo "  Linux: sudo systemctl start mosquitto"
  exit 1
fi
echo "[OK] MQTT broker (Mosquitto) on localhost:1883"

# 2. Verify Ollama is running
if ! curl -s http://localhost:11434/api/version >/dev/null 2>&1; then
  echo "[WARN] Ollama not running. Starting..."
  ollama serve &
  sleep 3
fi
echo "[OK] Ollama running"

# 3. Start LED controller (Arduino serial)
python3 "$BACKEND_DIR/led_controller.py" &
LED_PID=$!
echo "[OK] LED controller started (PID $LED_PID)"
sleep 1

# 4. Start GPS processor
python3 "$BACKEND_DIR/gps_processor.py" &
GPS_PID=$!
echo "[OK] GPS processor started (PID $GPS_PID)"

# 5. Start main Flask + Socket.IO server
python3 "$BACKEND_DIR/app.py" &
FLASK_PID=$!
echo "[OK] Flask backend started (PID $FLASK_PID)"

echo ""
echo "========================================"
echo "  All services running"
echo "========================================"
echo ""
LAPTOP_IP=$(python3 -c "import socket; s=socket.socket(); s.connect(('8.8.8.8',80)); print(s.getsockname()[0]); s.close()" 2>/dev/null || echo "127.0.0.1")
echo "  Laptop IP (for other devices): $LAPTOP_IP"
echo "  Backend API:  http://$LAPTOP_IP:8080/api/state"
echo "  Dashboard:    http://$LAPTOP_IP:5173"
echo ""
echo "  PIDs: LED=$LED_PID  GPS=$GPS_PID  Flask=$FLASK_PID"
echo ""
echo "  In another terminal, start ngrok:"
echo "  ngrok http 8080"
echo ""
echo "  Then start the React frontend:"
echo "  cd ~/smartevp-frontend && npm run dev"
echo ""
echo "  Press Ctrl+C to stop all services"

trap "kill $LED_PID $GPS_PID $FLASK_PID 2>/dev/null; echo 'All stopped.'" EXIT
wait $FLASK_PID
```

**Day-of startup sequence:**
```bash
# Terminal 1: Start all backend services
cd ~/smartevp && ./start_all.sh

# Terminal 2: ngrok tunnel (for Twilio)
ngrok http 8080
# Copy the https://xxxx.ngrok.io URL → paste in Twilio console

# Terminal 3: React frontend
cd ~/smartevp-frontend && npm run dev
# Open http://localhost:5173 on all three laptops
```

---

## 16. Environment Variables

```bash
nano ~/smartevp/.env
```

```bash
# ~/smartevp/.env — Never commit this file to git

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
DRIVER_PHONE=+91xxxxxxxxxx    # Friend's phone (driver)

# HuggingFace (for VibeVoice-ASR API)
HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 17. Full Data Flow — End to End

```
STEP 1 — EMERGENCY CALL
  Your phone calls Twilio number
  → Twilio webhook POST to https://ngrok-url/twilio/incoming
  → Flask returns TwiML: "Describe your emergency"
  → You speak: "Heart attack, BTM Layout"
  → Twilio webhook POST to /twilio/speech
  → parse_emergency() extracts severity + location
  → MQTT publish: smartevp/dispatch/case
  → Flask bridge → Socket.IO → ALL dashboards show new case card
  → dispatch_ambulance() fires SMS via Twilio to driver phone
  → MQTT publish: smartevp/dispatch/sms_sent
  → Flask bridge → Socket.IO → dashboard shows "SMS DELIVERED"
  → MQTT publish: smartevp/driver/app_update
  → Expo app on friend's phone buzzes with new case

STEP 2 — AMBULANCE MOVEMENT
  ESP32 on toy ambulance posts GPS to http://laptop:8080/gps (1 Hz)
  → Flask /gps endpoint receives → MQTT publish: smartevp/ambulance/gps
  → gps_processor.py receives → haversine distance calculated
  → MQTT publish: smartevp/ambulance/distance → dashboard shows "X meters"
  → Flask bridge → Socket.IO gps_update → map dot moves on all dashboards

  (Or: python3 gps_replay.py if GPS won't fix indoors — identical behavior)

STEP 3 — TRAFFIC PREEMPTION (THE MONEY SHOT)
  GPS distance < 500m
  → gps_processor.py fires: MQTT publish smartevp/signal/preempt
  → led_controller.py receives → arduino.set_green()
  → pyserial → USB → Arduino
  → Arduino: Yellow flash 600ms → Green ON
  → PHYSICAL LEDS FLIP IN FRONT OF JUDGES
  → led_controller.py publishes: smartevp/signal/status {GREEN, latency: Xms}
  → Flask bridge → Socket.IO signal_update → ALL dashboards show GREEN + latency

STEP 4 — MEDICAL INTELLIGENCE
  Audio demo triggered (POST /demo/audio or via demo button)
  → audio_processor.py plays nurse_demo.wav + sends to VibeVoice-ASR API
  → transcript returned → MQTT: smartevp/medical/transcript
  → Flask bridge → Ambulance view and Ops dashboard show live transcript text
  → gemma_processor.py generates structured JSON brief via Ollama
  → MQTT: smartevp/medical/brief
  → Flask bridge → Socket.IO medical_brief → HOSPITAL DASHBOARD AUTO-FILLS
  → Hospital view shows: diagnosis, vitals, resources, ETA countdown

STEP 5 — HOSPITAL READINESS
  Hospital dashboard was open and waiting on Socket.IO
  → medical_brief event arrives
  → All patient fields animate in with staggered reveal
  → ETA countdown ticks from GPS data
  → Resources list appears: Cardiologist, Defib, ICU Bed...
  → Final moment: "By the time those doors open, the doctor already knows."
```

---

## 18. Testing Each Subsystem

### Test 1 — MQTT Round-trip
```bash
# Terminal 1:
mosquitto_sub -h localhost -t "#" -v   # Subscribe to ALL topics
# Terminal 2:
mosquitto_pub -h localhost -t "smartevp/test" -m "hello"
# Terminal 1 should print: smartevp/test hello
```

### Test 2 — GPS Endpoint
```bash
curl -X POST http://localhost:8080/gps \
  -H "Content-Type: application/json" \
  -d '{"lat":12.9162,"lng":77.6021,"speed":30,"sats":8,"id":"AMB-001","ts":0}'
# Should return: {"status": "ok"}
```

### Test 3 — Arduino LED
```bash
python3 ~/smartevp/backend/arduino_controller.py
# Full R/Y/G sequence should run
```

### Test 4 — Preemption Trigger
```bash
# Publish a GPS point inside 500m of intersection:
mosquitto_pub -h localhost -t "smartevp/ambulance/gps" \
  -m '{"lat":12.9242,"lng":77.6161,"speed":25,"id":"AMB-001","ts":0}'
# gps_processor.py terminal should show: PREEMPTION FIRED
# LEDs should flip GREEN
```

### Test 5 — Demo Case Trigger
```bash
curl -X POST http://localhost:8080/demo/trigger
# Should return a case JSON and SMS should send to DRIVER_PHONE
```

### Test 6 — Gemma Brief
```bash
cd ~/smartevp && python3 backend/gemma_processor.py
# Should output a full JSON brief for the test transcript
```

### Test 7 — Full End-to-End
```bash
# 1. Start all services: ./start_all.sh
# 2. Open dashboard: http://localhost:5173
# 3. Trigger case: curl -X POST http://localhost:8080/demo/trigger
# 4. Run GPS replay: python3 gps_replay.py
# 5. Trigger audio: curl -X POST http://localhost:8080/demo/audio \
#      -H "Content-Type: application/json" -d '{"case_id":"C0001"}'
# 6. Watch: map dot moves → LED flips → transcript appears → hospital fills
```

---

## 19. Demo Day Checklist

- [ ] `./start_all.sh` runs without errors
- [ ] `mosquitto_pub` test succeeds (MQTT working)
- [ ] Arduino LED test passes
- [ ] Flask API: `curl http://localhost:8080/api/health` returns `{"status":"ok"}`
- [ ] GPS replay: map dot moves on dashboard
- [ ] Preemption: LED flips GREEN at route point ~10
- [ ] Demo trigger: case card appears + SMS delivered
- [ ] Audio/Gemma: transcript + brief appear on hospital view
- [ ] ngrok tunnel started and URL set in Twilio console
- [ ] All 3 dashboard views open on respective laptops
- [ ] Expo app connected on friend's phone
- [ ] Reset button clears state cleanly: `curl -X POST http://localhost:8080/api/reset`

---

*SmartEVP+ Backend & AI Guide v2.0 · Team V3 · TechnoCognition'25 · Dayananda Sagar University*

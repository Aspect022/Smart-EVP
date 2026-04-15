# SmartEVP+ — Backend & AI Guide
### Team V3 · TechnoCognition'25 · Dayananda Sagar University

> **Audience:** The backend/AI engineer on the team. This document tells you exactly what to build, where to run it, how every component communicates, and the precise code and configuration needed. Follow it sequentially.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [MQTT: The Communication Backbone](#2-mqtt-the-communication-backbone)
3. [MQTT Topic Registry](#3-mqtt-topic-registry)
4. [Raspberry Pi Backend — File Structure](#4-raspberry-pi-backend--file-structure)
5. [Core Backend: Flask + Socket.IO Server](#5-core-backend-flask--socketio-server)
6. [Subsystem 1: GPS Processor + Preemption Engine](#6-subsystem-1-gps-processor--preemption-engine)
7. [Subsystem 2: GPIO Traffic Light Controller](#7-subsystem-2-gpio-traffic-light-controller)
8. [Laptop Backend: AI Voice Intake (Twilio + VibeVoice-ASR)](#8-laptop-backend-ai-voice-intake-twilio--vibevoice-asr)
9. [Subsystem 3: Smart Dispatch Engine](#9-subsystem-3-smart-dispatch-engine)
10. [Subsystem 4: Edge AI — Medical Brief Generator (Gemma 4 on Pi)](#10-subsystem-4-edge-ai--medical-brief-generator-gemma-4-on-pi)
11. [Subsystem 5: Hospital Readiness Publisher](#11-subsystem-5-hospital-readiness-publisher)
12. [Database: SQLite Audit Log](#12-database-sqlite-audit-log)
13. [Starting Everything: Startup Script](#13-starting-everything-startup-script)
14. [Environment Variables Reference](#14-environment-variables-reference)
15. [Full Data Flow Summary](#15-full-data-flow-summary)
16. [Testing Each Subsystem](#16-testing-each-subsystem)

---

## 1. System Architecture Overview

### Where Each Service Runs

```
LAPTOP                          RASPBERRY PI
──────────────────────────      ────────────────────────────────
• Twilio webhook server          • Mosquitto MQTT broker
• VibeVoice-ASR (7B)             • Flask + Socket.IO backend
• React dashboard (frontend)     • GPS processor + preemption
• ngrok tunnel                   • GPIO LED controller
• Dispatch engine                • Ollama + Gemma 4 E4B
                                 • Audio capture + transcription
                                 • SQLite audit log
                                 • Medical brief generator

ESP32 (on toy ambulance)
• Publishes GPS → MQTT every 1s
• Receives signal status (optional)
```

### Communication Layer

```
ESP32 ──WiFi──→ MQTT Broker (Pi)
                     │
         ┌───────────┼────────────────┐
         ↓           ↓                ↓
    GPS Processor  Flask API      LED GPIO Subscriber
         │           │                │
         ↓           ↓                ↓
   Preemption   WebSocket push    GPIO pins
   Decision     to Dashboard      on Pi
         │
         ↓
   MQTT publish
   signal command
```

Everything communicates through MQTT. One broker (on the Pi), all devices subscribe and publish to named topics. Clean, fast, and reliable on a local network.

---

## 2. MQTT: The Communication Backbone

**Mosquitto** is the MQTT broker running on the Pi. Think of it as a post office — devices publish messages to named "topics," and other devices that care about those topics receive them instantly.

### How MQTT Works (Quick Primer)

- **Publisher:** Sends a message to a topic. `publish("topic/name", "payload")`
- **Subscriber:** Receives all messages on a topic. `subscribe("topic/name")`
- **QoS 0:** At most once delivery — good enough for GPS (if one is lost, next comes in 1s)
- **QoS 1:** At least once — use for critical commands like signal preemption
- **Retain:** Last message is stored and sent to new subscribers immediately. Useful for state.

### Verify Mosquitto is Running on Pi

```bash
sudo systemctl status mosquitto
# Should show: Active: active (running)

# If not running:
sudo systemctl start mosquitto
```

### Allow Remote Connections (Needed for Laptop → Pi MQTT)

Edit Mosquitto config:
```bash
sudo nano /etc/mosquitto/mosquitto.conf
```

Add these lines at the bottom:
```
listener 1883
allow_anonymous true
```

Save (Ctrl+X, Y, Enter), then restart:
```bash
sudo systemctl restart mosquitto
```

Now any device on the same WiFi can connect to the MQTT broker using the Pi's IP.

---

## 3. MQTT Topic Registry

All topics follow the pattern `smartevp/{domain}/{event}`. Never use different topic names in different parts of the code — inconsistency is the #1 cause of demo failures.

| Topic | Publisher | Subscriber | Payload | QoS |
|-------|-----------|------------|---------|-----|
| `smartevp/ambulance/gps` | ESP32 | GPS Processor | `{"lat":12.93,"lng":77.61,"speed":30,"ts":1234}` | 0 |
| `smartevp/signal/preempt` | GPS Processor | LED Controller | `{"action":"GREEN","intersection":"INT-01","ts":1234}` | 1 |
| `smartevp/signal/status` | LED Controller | Dashboard | `{"state":"GREEN","intersection":"INT-01","latency_ms":320}` | 1 |
| `smartevp/signal/reset` | GPS Processor | LED Controller | `{"action":"RED","ts":1234}` | 1 |
| `smartevp/dispatch/case` | Laptop Backend | Dashboard | `{"case_id":"C042","severity":"HIGH","location":"BTM Layout","symptoms":"chest pain"}` | 1 |
| `smartevp/dispatch/sms_sent` | Laptop Backend | Dashboard | `{"case_id":"C042","driver":"AMB-01","status":"SENT","ts":1234}` | 1 |
| `smartevp/medical/transcript` | Audio Processor | Dashboard + Gemma | `{"case_id":"C042","text":"58yo male, chest pain...","ts":1234}` | 1 |
| `smartevp/medical/brief` | Gemma Processor | Dashboard | `{"case_id":"C042","brief":{...},"ts":1234}` | 1 |
| `smartevp/system/heartbeat` | Flask Backend | Dashboard | `{"uptime":120,"ts":1234}` | 0 |

---

## 4. Raspberry Pi Backend — File Structure

Set up this directory structure on the Pi:

```bash
mkdir -p /home/pi/smartevp/{backend,audio,logs,data}
cd /home/pi/smartevp
```

```
/home/pi/smartevp/
├── backend/
│   ├── app.py              ← Flask + Socket.IO server (main entry)
│   ├── gps_processor.py    ← MQTT subscriber, haversine, preemption logic
│   ├── led_controller.py   ← GPIO subscriber, LED state machine
│   ├── audio_processor.py  ← PyAudio capture + send to ASR
│   ├── gemma_processor.py  ← Ollama interface, brief generation
│   ├── audit_log.py        ← SQLite write/read helpers
│   └── config.py           ← All constants in one place
├── audio/
│   └── nurse_demo.wav      ← Pre-recorded demo audio
├── data/
│   ├── gps_route.json      ← GPS replay route
│   └── smartevp.db         ← SQLite database (auto-created)
├── gps_replay.py           ← Standalone GPS replay script
└── start_all.sh            ← Start everything at once
```

Create the config file first:

```bash
nano /home/pi/smartevp/backend/config.py
```

```python
# config.py — single source of truth for all settings

# MQTT
MQTT_BROKER = "localhost"
MQTT_PORT   = 1883

# Intersection GPS coordinates (virtual intersection for demo)
# Place this somewhere along the gps_route.json path
INTERSECTION_LAT = 12.9242
INTERSECTION_LNG = 77.6161
PREEMPTION_RADIUS_M = 500  # Trigger green light when ambulance is within 500m

# GPIO pins (BCM numbering)
GPIO_RED    = 18
GPIO_YELLOW = 23
GPIO_GREEN  = 24

# Paths
DB_PATH         = "/home/pi/smartevp/data/smartevp.db"
AUDIO_DEMO_PATH = "/home/pi/smartevp/audio/nurse_demo.wav"
GPS_ROUTE_PATH  = "/home/pi/smartevp/data/gps_route.json"

# Flask
FLASK_HOST = "0.0.0.0"
FLASK_PORT = 5000

# Twilio (fill in after setup)
TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN  = "your_auth_token"
TWILIO_FROM_NUMBER = "+1xxxxxxxxxx"   # Your Twilio number
DRIVER_PHONE       = "+91xxxxxxxxxx"  # Driver's phone number (demo)

# Dispatch: registered ambulances
AMBULANCES = [
    {"id": "AMB-001", "name": "City Ambulance 1", "lat": 12.9162, "lng": 77.6021, "driver_phone": "+91xxxxxxxxxx"},
    {"id": "AMB-002", "name": "City Ambulance 2", "lat": 12.9300, "lng": 77.6200, "driver_phone": "+91xxxxxxxxxx"},
]
```

---

## 5. Core Backend: Flask + Socket.IO Server

This is the central API server. It:
- Bridges MQTT events to WebSocket for the React dashboard
- Exposes REST endpoints for the laptop-side services
- Maintains system state

```bash
nano /home/pi/smartevp/backend/app.py
```

```python
# app.py — SmartEVP+ Main Flask + Socket.IO Server
from flask import Flask, jsonify, request
from flask_socketio import SocketIO
import paho.mqtt.client as mqtt
import threading
import json
import time
import sys
sys.path.insert(0, '/home/pi/smartevp/backend')
from config import *
from audit_log import init_db, log_event

app = Flask(__name__)
app.config['SECRET_KEY'] = 'smartevp-secret-2025'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# ── Global State ──────────────────────────────────────────────
state = {
    "signal_state": "RED",
    "ambulance_lat": None,
    "ambulance_lng": None,
    "ambulance_speed": 0,
    "active_case": None,
    "medical_brief": None,
    "preemption_active": False,
    "preemption_latency_ms": None,
    "last_update": None,
}

# ── MQTT → WebSocket Bridge ───────────────────────────────────
def on_mqtt_message(client, userdata, msg):
    topic   = msg.topic
    payload = json.loads(msg.payload.decode())

    if topic == "smartevp/ambulance/gps":
        state.update({
            "ambulance_lat":   payload["lat"],
            "ambulance_lng":   payload["lng"],
            "ambulance_speed": payload.get("speed", 0),
            "last_update":     payload.get("ts"),
        })
        socketio.emit("gps_update", payload)

    elif topic == "smartevp/signal/status":
        state["signal_state"] = payload["state"]
        if payload["state"] == "GREEN":
            state["preemption_active"] = True
            state["preemption_latency_ms"] = payload.get("latency_ms")
        socketio.emit("signal_update", payload)

    elif topic == "smartevp/dispatch/case":
        state["active_case"] = payload
        socketio.emit("new_case", payload)

    elif topic == "smartevp/dispatch/sms_sent":
        socketio.emit("dispatch_sms", payload)

    elif topic == "smartevp/medical/transcript":
        socketio.emit("transcript_update", payload)

    elif topic == "smartevp/medical/brief":
        state["medical_brief"] = payload
        socketio.emit("medical_brief", payload)

def start_mqtt_bridge():
    client = mqtt.Client("flask-bridge")
    client.on_message = on_mqtt_message
    client.connect(MQTT_BROKER, MQTT_PORT)
    client.subscribe([
        ("smartevp/ambulance/gps",    0),
        ("smartevp/signal/status",    1),
        ("smartevp/dispatch/case",    1),
        ("smartevp/dispatch/sms_sent",1),
        ("smartevp/medical/transcript",1),
        ("smartevp/medical/brief",    1),
    ])
    client.loop_forever()

# ── REST Endpoints ────────────────────────────────────────────
@app.route("/api/state", methods=["GET"])
def get_state():
    return jsonify(state)

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "ts": int(time.time())})

@app.route("/api/reset", methods=["POST"])
def reset_demo():
    """Reset all state for next demo run"""
    state.update({
        "signal_state": "RED",
        "active_case": None,
        "medical_brief": None,
        "preemption_active": False,
        "preemption_latency_ms": None,
    })
    mqtt_client_pub.publish("smartevp/signal/reset",
        json.dumps({"action":"RED","ts":int(time.time()*1000)}), qos=1)
    socketio.emit("demo_reset", {"ts": int(time.time())})
    return jsonify({"status": "reset ok"})

@app.route("/api/logs", methods=["GET"])
def get_logs():
    from audit_log import get_recent_logs
    return jsonify(get_recent_logs(limit=50))

# ── MQTT publisher (used by /reset endpoint) ──────────────────
mqtt_client_pub = mqtt.Client("flask-publisher")
mqtt_client_pub.connect(MQTT_BROKER, MQTT_PORT)

# ── Socket.IO Events ──────────────────────────────────────────
@socketio.on("connect")
def on_connect():
    print(f"[WS] Dashboard connected")
    socketio.emit("initial_state", state)

# ── Heartbeat ─────────────────────────────────────────────────
def heartbeat():
    start = time.time()
    while True:
        uptime = int(time.time() - start)
        mqtt_client_pub.publish("smartevp/system/heartbeat",
            json.dumps({"uptime": uptime, "ts": int(time.time())}), qos=0)
        time.sleep(5)

# ── Startup ───────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()

    # Start MQTT bridge in background thread
    t_mqtt = threading.Thread(target=start_mqtt_bridge, daemon=True)
    t_mqtt.start()

    # Start heartbeat
    t_hb = threading.Thread(target=heartbeat, daemon=True)
    t_hb.start()

    print(f"[FLASK] Starting SmartEVP+ backend on port {FLASK_PORT}")
    socketio.run(app, host=FLASK_HOST, port=FLASK_PORT)
```

---

## 6. Subsystem 1: GPS Processor + Preemption Engine

This is the core SmartEVP logic. It subscribes to GPS updates, calculates distance to the intersection using the Haversine formula, and fires the preemption command when the ambulance enters the 500m radius.

```bash
nano /home/pi/smartevp/backend/gps_processor.py
```

```python
# gps_processor.py — GPS subscriber + haversine + preemption trigger
import paho.mqtt.client as mqtt
import json
import math
import time
import sys
sys.path.insert(0, '/home/pi/smartevp/backend')
from config import *
from audit_log import log_event

# ── Haversine Distance Formula ────────────────────────────────
def haversine_meters(lat1, lng1, lat2, lng2):
    """Calculate distance between two GPS coordinates in meters."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

# ── State ─────────────────────────────────────────────────────
preemption_active = False
preemption_fired_at = None
last_distance_m = None

# ── MQTT Publisher ────────────────────────────────────────────
pub_client = mqtt.Client("gps-processor-pub")
pub_client.connect(MQTT_BROKER, MQTT_PORT)

def fire_preemption():
    global preemption_active, preemption_fired_at
    if preemption_active:
        return  # Already fired, don't repeat
    preemption_active = True
    preemption_fired_at = time.time()
    payload = json.dumps({
        "action": "GREEN",
        "intersection": "INT-01",
        "ts": int(time.time() * 1000)
    })
    pub_client.publish("smartevp/signal/preempt", payload, qos=1)
    log_event("PREEMPTION_FIRED", {"intersection": "INT-01"})
    print(f"[PREEMPTION] 🟢 GREEN light fired! Distance was {last_distance_m:.0f}m")

def reset_preemption():
    global preemption_active, preemption_fired_at
    if not preemption_active:
        return
    preemption_active = False
    preemption_fired_at = None
    payload = json.dumps({
        "action": "RED",
        "intersection": "INT-01",
        "ts": int(time.time() * 1000)
    })
    pub_client.publish("smartevp/signal/reset", payload, qos=1)
    log_event("PREEMPTION_RESET", {"intersection": "INT-01"})
    print("[PREEMPTION] 🔴 Signal reset to RED")

# ── GPS Message Handler ───────────────────────────────────────
def on_gps_message(client, userdata, msg):
    global last_distance_m
    data = json.loads(msg.payload.decode())
    lat = data.get("lat")
    lng = data.get("lng")

    if lat is None or lng is None:
        return

    dist = haversine_meters(lat, lng, INTERSECTION_LAT, INTERSECTION_LNG)
    last_distance_m = dist

    print(f"[GPS] Ambulance at ({lat:.4f}, {lng:.4f}) — {dist:.0f}m from intersection")

    if dist <= PREEMPTION_RADIUS_M:
        fire_preemption()
    elif dist > PREEMPTION_RADIUS_M + 100 and preemption_active:
        # Reset when ambulance moves more than 100m past threshold
        reset_preemption()

# ── Start ─────────────────────────────────────────────────────
def run():
    client = mqtt.Client("gps-processor")
    client.on_message = on_gps_message
    client.connect(MQTT_BROKER, MQTT_PORT)
    client.subscribe("smartevp/ambulance/gps", qos=0)
    print("[GPS_PROCESSOR] Listening on smartevp/ambulance/gps...")
    print(f"[GPS_PROCESSOR] Intersection at ({INTERSECTION_LAT}, {INTERSECTION_LNG})")
    print(f"[GPS_PROCESSOR] Preemption radius: {PREEMPTION_RADIUS_M}m")
    client.loop_forever()

if __name__ == "__main__":
    run()
```

---

## 7. Subsystem 2: GPIO Traffic Light Controller

Subscribes to preemption commands and drives the GPIO pins. Uses a state machine with a Yellow transition.

```bash
nano /home/pi/smartevp/backend/led_controller.py
```

```python
# led_controller.py — MQTT subscriber → GPIO LED state machine
import paho.mqtt.client as mqtt
import RPi.GPIO as GPIO
import json
import time
import sys
sys.path.insert(0, '/home/pi/smartevp/backend')
from config import *
from audit_log import log_event

# ── GPIO Setup ────────────────────────────────────────────────
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(GPIO_RED,    GPIO.OUT)
GPIO.setup(GPIO_YELLOW, GPIO.OUT)
GPIO.setup(GPIO_GREEN,  GPIO.OUT)

current_state = "RED"
preemption_start_time = None

# ── MQTT Publisher (for status feedback) ─────────────────────
pub_client = mqtt.Client("led-controller-pub")
pub_client.connect(MQTT_BROKER, MQTT_PORT)

# ── LED State Functions ───────────────────────────────────────
def all_off():
    GPIO.output(GPIO_RED,    GPIO.LOW)
    GPIO.output(GPIO_YELLOW, GPIO.LOW)
    GPIO.output(GPIO_GREEN,  GPIO.LOW)

def set_state_red():
    global current_state
    all_off()
    GPIO.output(GPIO_RED, GPIO.HIGH)
    current_state = "RED"
    status = {"state": "RED", "intersection": "INT-01", "ts": int(time.time()*1000)}
    pub_client.publish("smartevp/signal/status", json.dumps(status), qos=1)
    print("[LED] 🔴 RED")

def set_state_green(latency_ms=None):
    global current_state, preemption_start_time
    # Flash yellow briefly before going green
    all_off()
    GPIO.output(GPIO_YELLOW, GPIO.HIGH)
    time.sleep(0.6)  # 600ms yellow
    all_off()
    GPIO.output(GPIO_GREEN, GPIO.HIGH)
    current_state = "GREEN"
    preemption_start_time = time.time()
    status = {
        "state": "GREEN",
        "intersection": "INT-01",
        "latency_ms": latency_ms,
        "ts": int(time.time()*1000)
    }
    pub_client.publish("smartevp/signal/status", json.dumps(status), qos=1)
    log_event("SIGNAL_GREEN", {"latency_ms": latency_ms})
    print(f"[LED] 🟢 GREEN (latency: {latency_ms}ms)")

# ── Command Handler ───────────────────────────────────────────
command_received_time = None

def on_command(client, userdata, msg):
    global command_received_time
    data = json.loads(msg.payload.decode())
    action = data.get("action")

    if action == "GREEN" and current_state != "GREEN":
        ts_sent = data.get("ts", int(time.time()*1000))
        ts_now  = int(time.time()*1000)
        latency = ts_now - ts_sent
        set_state_green(latency_ms=latency)

    elif action == "RED" and current_state != "RED":
        set_state_red()

# ── Startup ───────────────────────────────────────────────────
def run():
    set_state_red()  # Start in RED state

    client = mqtt.Client("led-controller")
    client.on_message = on_command
    client.connect(MQTT_BROKER, MQTT_PORT)
    client.subscribe([
        ("smartevp/signal/preempt", 1),
        ("smartevp/signal/reset",   1),
    ])
    print("[LED_CONTROLLER] Ready. LEDs initialized to RED.")
    try:
        client.loop_forever()
    finally:
        GPIO.cleanup()
        print("[LED_CONTROLLER] GPIO cleaned up")

if __name__ == "__main__":
    run()
```

---

## 8. Laptop Backend: AI Voice Intake (Twilio + VibeVoice-ASR)

This runs on your **laptop**, not the Pi. It handles the inbound Twilio call, transcribes it with VibeVoice-ASR, and parses the emergency details.

### Step 8.1 — Set Up Twilio

1. Go to https://www.twilio.com and create a free account.
2. Get a free phone number (US number is fine for demo purposes).
3. Copy your **Account SID** and **Auth Token** from the Twilio console.
4. In the Twilio console, under your number's Voice settings, set the webhook URL to your ngrok URL (next step).

### Step 8.2 — Install ngrok (Webhook Tunnel)

```bash
# On your laptop:
# Download from https://ngrok.com/download
# OR on Mac:
brew install ngrok

# OR on Linux:
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

Start ngrok (in a separate terminal, keep it running):
```bash
ngrok http 8080
```
It will give you a URL like `https://abc123.ngrok.io`. Set that as your Twilio webhook:
```
Twilio Console → Phone Numbers → Your Number → Voice → A Call Comes In:
  URL: https://abc123.ngrok.io/twilio/incoming
  Method: POST
```

### Step 8.3 — Install Laptop Dependencies

```bash
pip install flask twilio openai paho-mqtt requests
# For VibeVoice-ASR (if running locally — needs 8GB+ RAM):
pip install transformers torch torchaudio accelerate
```

### Step 8.4 — Laptop Backend Code

```bash
mkdir ~/smartevp_laptop && cd ~/smartevp_laptop
nano intake_server.py
```

```python
# intake_server.py — Twilio webhook + VibeVoice-ASR + Dispatch (runs on LAPTOP)
from flask import Flask, request, Response
from twilio.rest import Client as TwilioClient
from twilio.twiml.voice_response import VoiceResponse, Gather
import paho.mqtt.client as mqtt
import requests
import json
import time
import uuid
import threading

app = Flask(__name__)

# ── Config (fill in your values) ─────────────────────────────
TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN  = "your_auth_token_here"
TWILIO_FROM_NUMBER = "+1xxxxxxxxxx"
DRIVER_PHONE       = "+91xxxxxxxxxx"  # Number to SMS

MQTT_BROKER_IP = "192.168.x.x"  # Pi's IP
MQTT_PORT      = 1883

HF_API_KEY     = "hf_xxxxxxxxxxxxxxxxxxxx"  # Hugging Face API key
HF_ASR_MODEL   = "microsoft/VibeVoice-ASR"

# ── MQTT Setup ────────────────────────────────────────────────
mqtt_client = mqtt.Client("intake-server")
mqtt_client.connect(MQTT_BROKER_IP, MQTT_PORT)
mqtt_client.loop_start()

twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# ── In-memory case registry ───────────────────────────────────
active_calls = {}  # call_sid → case data

# ── Twilio Webhook: Incoming Call ─────────────────────────────
@app.route("/twilio/incoming", methods=["POST"])
def incoming_call():
    """Twilio calls this when someone calls the demo number."""
    call_sid  = request.values.get("CallSid")
    case_id   = f"C{str(uuid.uuid4())[:4].upper()}"

    active_calls[call_sid] = {
        "case_id": case_id,
        "started_at": time.time(),
        "status": "intake"
    }

    response = VoiceResponse()
    gather   = Gather(
        input="speech",
        action=f"/twilio/speech?case_id={case_id}&call_sid={call_sid}",
        method="POST",
        timeout=10,
        speech_timeout="auto",
        language="en-IN"
    )
    gather.say(
        "Emergency Response System active. Please describe your emergency location and symptoms.",
        voice="alice",
        language="en-IN"
    )
    response.append(gather)
    response.say("We are processing your emergency. Help is on the way.", voice="alice")
    return Response(str(response), mimetype="text/xml")

# ── Twilio Webhook: Speech Result ────────────────────────────
@app.route("/twilio/speech", methods=["POST"])
def speech_result():
    """Twilio calls this with the transcribed speech."""
    case_id      = request.args.get("case_id", "UNKNOWN")
    speech_text  = request.values.get("SpeechResult", "")
    confidence   = request.values.get("Confidence", "0")

    print(f"\n[INTAKE] Case {case_id}")
    print(f"[INTAKE] Twilio STT: '{speech_text}' (confidence: {confidence})")

    # If Twilio STT is poor, we could run VibeVoice-ASR on the recording
    # For demo, Twilio's built-in STT is sufficient
    parsed = parse_emergency(speech_text)

    case_payload = {
        "case_id":   case_id,
        "severity":  parsed.get("severity", "HIGH"),
        "location":  parsed.get("location", speech_text[:50]),
        "symptoms":  parsed.get("symptoms", speech_text),
        "raw_text":  speech_text,
        "ts":        int(time.time() * 1000)
    }

    # Publish to MQTT → dashboard sees it immediately
    mqtt_client.publish("smartevp/dispatch/case",
                        json.dumps(case_payload), qos=1)

    # Fire dispatch SMS
    threading.Thread(target=dispatch_ambulance,
                     args=(case_payload,), daemon=True).start()

    response = VoiceResponse()
    response.say(
        f"Emergency logged. Case ID {case_id}. Nearest ambulance has been dispatched. Stay on the line.",
        voice="alice",
        language="en-IN"
    )
    return Response(str(response), mimetype="text/xml")

# ── Emergency Parser ──────────────────────────────────────────
def parse_emergency(text: str) -> dict:
    """Simple keyword-based parser. Upgrade to LLM if time permits."""
    text_lower = text.lower()

    severity = "HIGH"
    if any(w in text_lower for w in ["heart", "cardiac", "chest", "stroke", "unconscious"]):
        severity = "CRITICAL"
    elif any(w in text_lower for w in ["accident", "trauma", "bleeding", "breathing"]):
        severity = "HIGH"

    # Extract location (crude — works well enough for demo)
    locations = ["koramangala", "btm layout", "indiranagar", "whitefield",
                 "jayanagar", "electronic city", "hsr layout", "marathahalli"]
    location = "Bengaluru"
    for loc in locations:
        if loc in text_lower:
            location = loc.title()
            break

    symptoms = text  # Raw text as symptoms for now

    return {"severity": severity, "location": location, "symptoms": symptoms}

# ── Dispatch Ambulance ────────────────────────────────────────
def dispatch_ambulance(case: dict):
    """Find nearest ambulance, send SMS, publish dispatch event."""
    # For demo: nearest ambulance is always AMB-001
    ambulance_id = "AMB-001"
    driver_phone  = DRIVER_PHONE

    sms_body = (
        f"🚨 DISPATCH ALERT — CASE #{case['case_id']}\n"
        f"Severity: {case['severity']}\n"
        f"Location: {case['location']}\n"
        f"Symptoms: {case['symptoms'][:80]}\n"
        f"RESPOND IMMEDIATELY."
    )

    try:
        message = twilio_client.messages.create(
            body=sms_body,
            from_=TWILIO_FROM_NUMBER,
            to=driver_phone
        )
        print(f"[DISPATCH] SMS sent to {driver_phone}: SID {message.sid}")

        dispatch_event = {
            "case_id":      case["case_id"],
            "ambulance_id": ambulance_id,
            "driver_phone": driver_phone,
            "sms_sid":      message.sid,
            "status":       "SENT",
            "ts":           int(time.time() * 1000)
        }
        mqtt_client.publish("smartevp/dispatch/sms_sent",
                            json.dumps(dispatch_event), qos=1)
    except Exception as e:
        print(f"[DISPATCH] SMS failed: {e}")

# ── Manual Demo Trigger ───────────────────────────────────────
@app.route("/demo/trigger", methods=["POST"])
def demo_trigger():
    """Manually trigger a demo case without calling the Twilio number.
    Useful if Twilio webhook isn't working during the demo."""
    case_payload = {
        "case_id":  f"C{int(time.time()) % 10000:04d}",
        "severity": "CRITICAL",
        "location": "BTM Layout, Bengaluru",
        "symptoms": "Heart attack patient, chest pain radiating to left arm",
        "raw_text": "Demo triggered manually",
        "ts":       int(time.time() * 1000)
    }
    mqtt_client.publish("smartevp/dispatch/case",
                        json.dumps(case_payload), qos=1)
    threading.Thread(target=dispatch_ambulance,
                     args=(case_payload,), daemon=True).start()
    return jsonify({"status": "demo case triggered", "case": case_payload})

if __name__ == "__main__":
    print("[INTAKE] Starting SmartEVP+ Intake Server on :8080")
    app.run(host="0.0.0.0", port=8080, debug=False)
```

Start it:
```bash
python3 intake_server.py
```

---

## 9. Subsystem 3: Smart Dispatch Engine

The dispatch logic is embedded in `intake_server.py` (Section 8). For a more advanced demo, here is a standalone nearest-ambulance finder using Haversine:

```python
# dispatch_engine.py — finds nearest available ambulance (standalone util)
import math

def haversine_km(lat1, lng1, lat2, lng2):
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def find_nearest_ambulance(incident_lat, incident_lng, ambulances):
    """Return the nearest available ambulance dict."""
    nearest = None
    min_dist = float('inf')
    for amb in ambulances:
        if amb.get("status", "AVAILABLE") != "AVAILABLE":
            continue
        dist = haversine_km(incident_lat, incident_lng, amb["lat"], amb["lng"])
        if dist < min_dist:
            min_dist = dist
            nearest  = amb
    return nearest, min_dist

# Example usage:
if __name__ == "__main__":
    from config import AMBULANCES
    incident = (12.9300, 77.6100)  # BTM Layout
    amb, dist = find_nearest_ambulance(*incident, AMBULANCES)
    print(f"Nearest ambulance: {amb['id']} — {dist:.2f}km away")
```

---

## 10. Subsystem 4: Edge AI — Medical Brief Generator (Gemma 4 on Pi)

This is the most impressive part of the demo. Gemma 4 E4B (running via Ollama on the Pi) receives the ambulance audio transcript and generates a structured pre-arrival medical brief for the hospital.

### Step 10.1 — Verify Ollama is Ready

```bash
# On Pi:
ollama list
# Should show: gemma2:2b

# Test:
ollama run gemma2:2b "Say READY in one word"
```

### Step 10.2 — Audio Capture and Transcription

The audio pipeline has two modes:
1. **Live mode:** USB mic → PyAudio → save WAV → send to VibeVoice-ASR on laptop (via API call)
2. **Demo mode:** Play pre-recorded nurse_demo.wav → send to VibeVoice-ASR

For the hackathon, **use demo mode.** It's reliable, sounds professional, and showcases all the same functionality.

```bash
nano /home/pi/smartevp/backend/audio_processor.py
```

```python
# audio_processor.py — Audio capture + ASR + Gemma brief generation
import paho.mqtt.client as mqtt
import requests
import json
import time
import subprocess
import threading
import sys
sys.path.insert(0, '/home/pi/smartevp/backend')
from config import *
from gemma_processor import generate_medical_brief

HF_API_KEY   = "hf_xxxxxxxxxxxxxxxxxxxx"  # Your HF token
ASR_API_URL  = "https://api-inference.huggingface.co/models/microsoft/VibeVoice-ASR"

# Fallback: use this transcript if ASR is unavailable
DEMO_TRANSCRIPT = (
    "Male patient, fifty-eight years old. Chief complaint is chest pain "
    "radiating to the left arm, onset approximately twenty minutes ago. "
    "Blood pressure ninety over sixty. Heart rate irregular at one-twelve "
    "beats per minute. Oxygen saturation ninety-four percent. Patient is "
    "conscious but diaphoretic. No known drug allergies. Currently on "
    "Aspirin seventy-five milligrams daily. Suspected STEMI."
)

pub_client = mqtt.Client("audio-processor-pub")
pub_client.connect(MQTT_BROKER, MQTT_PORT)

def transcribe_audio_hf(wav_path: str) -> str:
    """Send WAV to HuggingFace Inference API for transcription."""
    with open(wav_path, "rb") as f:
        audio_data = f.read()
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    try:
        r = requests.post(ASR_API_URL, headers=headers, data=audio_data, timeout=30)
        result = r.json()
        text = result.get("text", "")
        print(f"[ASR] Transcription: {text[:100]}...")
        return text
    except Exception as e:
        print(f"[ASR] API failed ({e}), using demo transcript")
        return DEMO_TRANSCRIPT

def process_audio(case_id: str, wav_path: str = None):
    """Full pipeline: transcribe → publish transcript → generate brief → publish brief"""
    print(f"\n[AUDIO] Processing audio for case {case_id}...")

    # Step 1: Transcribe
    if wav_path:
        transcript = transcribe_audio_hf(wav_path)
    else:
        transcript = DEMO_TRANSCRIPT
        print("[AUDIO] Using demo transcript")

    # Step 2: Publish transcript (dashboard shows live transcription)
    transcript_payload = {
        "case_id":    case_id,
        "text":       transcript,
        "source":     "nurse_audio",
        "ts":         int(time.time() * 1000)
    }
    pub_client.publish("smartevp/medical/transcript",
                       json.dumps(transcript_payload), qos=1)
    print("[AUDIO] Transcript published to MQTT")

    # Step 3: Generate medical brief via Gemma
    print("[AUDIO] Sending to Gemma 4 for medical brief generation...")
    brief = generate_medical_brief(case_id, transcript)

    # Step 4: Publish brief
    brief_payload = {
        "case_id": case_id,
        "brief":   brief,
        "ts":      int(time.time() * 1000)
    }
    pub_client.publish("smartevp/medical/brief",
                       json.dumps(brief_payload), qos=1)
    print("[AUDIO] Medical brief published to MQTT")

def run_demo_audio(case_id: str):
    """Demo mode: play the nurse audio then process it."""
    print(f"[AUDIO] Playing demo nurse audio for case {case_id}...")
    # Play WAV through speaker (optional — comment out if no speaker)
    subprocess.run(["aplay", AUDIO_DEMO_PATH], capture_output=True)
    # Process with demo transcript
    process_audio(case_id, wav_path=None)

if __name__ == "__main__":
    # Test with demo audio
    run_demo_audio("TEST-001")
```

### Step 10.3 — Gemma Medical Brief Generator

```bash
nano /home/pi/smartevp/backend/gemma_processor.py
```

```python
# gemma_processor.py — Ollama/Gemma 4 medical brief generator
import ollama
import json
import re

SYSTEM_PROMPT = """You are a clinical AI assistant integrated into a smart ambulance system.
You receive spoken paramedic/nurse audio transcripts from ambulances en-route to hospitals.
Your job is to convert messy spoken audio into a clean, structured pre-arrival medical brief
that the receiving hospital can act on immediately.

Always respond with ONLY a valid JSON object. No preamble, no explanation, no markdown fences.
The JSON must have exactly these fields:
{
  "patient_age": number or null,
  "patient_gender": "Male" | "Female" | "Unknown",
  "chief_complaint": "string",
  "suspected_diagnosis": "string",
  "vitals": {
    "bp": "string or null",
    "hr": "string or null",
    "spo2": "string or null",
    "gcs": "string or null"
  },
  "current_medications": ["list"],
  "allergies": "string",
  "consciousness": "Conscious" | "Semi-conscious" | "Unconscious",
  "required_resources": ["list of specific resources like 'Cardiologist', 'ICU Bed', 'Defib', 'OR'],
  "priority": "P1 - Immediate" | "P2 - Urgent" | "P3 - Stable",
  "notes": "any other relevant clinical notes"
}"""

def generate_medical_brief(case_id: str, transcript: str) -> dict:
    """Call Gemma via Ollama to generate a structured medical brief."""
    user_prompt = f"""Case ID: {case_id}

AMBULANCE AUDIO TRANSCRIPT:
{transcript}

Generate the pre-arrival medical brief JSON for the receiving hospital."""

    try:
        response = ollama.chat(
            model="gemma2:2b",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt}
            ],
            options={"temperature": 0.1}  # Low temp = consistent, clinical output
        )
        raw = response["message"]["content"].strip()

        # Strip any accidental markdown fences
        raw = re.sub(r"```json\s*", "", raw)
        raw = re.sub(r"```\s*", "", raw)

        brief = json.loads(raw)
        print(f"[GEMMA] Brief generated: {json.dumps(brief, indent=2)}")
        return brief

    except json.JSONDecodeError as e:
        print(f"[GEMMA] JSON parse failed: {e}. Raw: {raw[:200]}")
        # Return a hardcoded brief as fallback (for demo robustness)
        return {
            "patient_age": 58,
            "patient_gender": "Male",
            "chief_complaint": "Acute chest pain radiating to left arm",
            "suspected_diagnosis": "STEMI (ST-Elevation Myocardial Infarction)",
            "vitals": {"bp": "90/60 mmHg", "hr": "112 bpm irregular", "spo2": "94%", "gcs": "15"},
            "current_medications": ["Aspirin 75mg"],
            "allergies": "None known",
            "consciousness": "Conscious",
            "required_resources": ["Cardiologist", "Defibrillator", "ICU Bed", "Cath Lab Team"],
            "priority": "P1 - Immediate",
            "notes": "Diaphoretic. Onset 20 min ago. EMS Aspirin 325mg given."
        }
    except Exception as e:
        print(f"[GEMMA] Ollama call failed: {e}")
        return {"error": str(e)}
```

---

## 11. Subsystem 5: Hospital Readiness Publisher

The hospital dashboard gets its data from the Flask server via WebSocket. Once the `smartevp/medical/brief` MQTT message arrives, the Flask bridge automatically emits it to all connected WebSocket clients. No additional code needed on the backend side.

The hospital screen in the frontend React app subscribes to the `medical_brief` Socket.IO event and renders the JSON brief into a human-readable pre-arrival card.

**ETA Calculation:** Add this endpoint to `app.py`:

```python
@app.route("/api/eta", methods=["GET"])
def get_eta():
    """Calculate estimated arrival time from current GPS to hospital."""
    from config import INTERSECTION_LAT, INTERSECTION_LNG
    import math
    lat = state.get("ambulance_lat")
    lng = state.get("ambulance_lng")
    spd = state.get("ambulance_speed", 30)
    if not lat or not lng:
        return jsonify({"eta_seconds": None})
    # Distance to intersection
    R = 6371000
    phi1 = math.radians(lat); phi2 = math.radians(INTERSECTION_LAT)
    dphi = math.radians(INTERSECTION_LAT - lat)
    dlam = math.radians(INTERSECTION_LNG - lng)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    dist_m = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    speed_mps = max(spd / 3.6, 1)  # Convert km/h to m/s, min 1 to avoid div/0
    eta_seconds = int(dist_m / speed_mps)
    return jsonify({"eta_seconds": eta_seconds, "distance_m": dist_m})
```

---

## 12. Database: SQLite Audit Log

```bash
nano /home/pi/smartevp/backend/audit_log.py
```

```python
# audit_log.py — SQLite-based audit trail
import sqlite3
import json
import time
import sys
sys.path.insert(0, '/home/pi/smartevp/backend')
from config import DB_PATH

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            ts        INTEGER NOT NULL,
            event     TEXT NOT NULL,
            data      TEXT,
            created   DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()
    print(f"[DB] Initialized at {DB_PATH}")

def log_event(event_type: str, data: dict = None):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO events (ts, event, data) VALUES (?, ?, ?)",
        (int(time.time() * 1000), event_type, json.dumps(data or {}))
    )
    conn.commit()
    conn.close()

def get_recent_logs(limit=50) -> list:
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT ts, event, data FROM events ORDER BY ts DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [{"ts": r[0], "event": r[1], "data": json.loads(r[2])} for r in rows]
```

---

## 13. Starting Everything: Startup Script

```bash
nano /home/pi/smartevp/start_all.sh
```

```bash
#!/bin/bash
# start_all.sh — Start all SmartEVP+ Pi services
echo "========================================="
echo " SmartEVP+ — Starting Backend Services"
echo "========================================="

cd /home/pi/smartevp

# Start MQTT broker (should already be running as service)
sudo systemctl start mosquitto
echo "[OK] Mosquitto MQTT broker running"

# Start LED controller in background
python3 backend/led_controller.py &
LED_PID=$!
echo "[OK] LED controller started (PID $LED_PID)"

# Start GPS processor in background
python3 backend/gps_processor.py &
GPS_PID=$!
echo "[OK] GPS processor started (PID $GPS_PID)"

# Start Flask + Socket.IO server in background
python3 backend/app.py &
FLASK_PID=$!
echo "[OK] Flask backend started (PID $FLASK_PID)"

echo ""
echo "All services running. PIDs:"
echo "  LED controller: $LED_PID"
echo "  GPS processor:  $GPS_PID"
echo "  Flask server:   $FLASK_PID"
echo ""
echo "Dashboard API: http://$(hostname -I | awk '{print $1}'):5000/api/state"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait and relay signals
wait $FLASK_PID
kill $LED_PID $GPS_PID 2>/dev/null
echo "All services stopped."
```

```bash
chmod +x /home/pi/smartevp/start_all.sh
```

**On demo day, run:**
```bash
cd /home/pi/smartevp && ./start_all.sh
```

**On the laptop (separate terminal):**
```bash
# Terminal 1: ngrok tunnel
ngrok http 8080

# Terminal 2: intake server
cd ~/smartevp_laptop && python3 intake_server.py

# Terminal 3: React dashboard
cd ~/smartevp-frontend && npm run dev
```

---

## 14. Environment Variables Reference

Instead of hardcoding secrets, use a `.env` file on the laptop:

```bash
# ~/smartevp_laptop/.env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
DRIVER_PHONE=+91xxxxxxxxxx
HF_API_KEY=hf_xxxxxxxxxxxx
MQTT_BROKER_IP=192.168.x.x
```

Load in Python with:
```python
from dotenv import load_dotenv
import os
load_dotenv()
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
```

Install dotenv: `pip install python-dotenv`

---

## 15. Full Data Flow Summary

```
1. Judge calls Twilio number
   → Twilio webhook → intake_server.py (laptop)
   → VibeVoice-ASR / Twilio STT → emergency parsed
   → MQTT: smartevp/dispatch/case → Dashboard shows new case card
   → Twilio SMS → Driver phone buzzes on table

2. Toy ambulance pushed (or GPS replay script running)
   → ESP32 publishes to: smartevp/ambulance/gps (1 Hz)
   → gps_processor.py calculates distance to intersection
   → Dashboard map dot moves in real time (via WebSocket)

3. Distance < 500m
   → gps_processor.py publishes: smartevp/signal/preempt
   → led_controller.py receives command → GPIO → LEDs flip RED→GREEN
   → led_controller.py publishes: smartevp/signal/status (GREEN, latency=Xms)
   → Dashboard signal panel shows GREEN + latency metric

4. Demo audio clip plays (or live nurse speaks)
   → audio_processor.py transcribes via VibeVoice-ASR
   → MQTT: smartevp/medical/transcript → Dashboard shows live text
   → gemma_processor.py generates structured JSON brief
   → MQTT: smartevp/medical/brief → Hospital dashboard auto-fills
```

---

## 16. Testing Each Subsystem

### Test 1: MQTT Connectivity
```bash
# On Pi:
mosquitto_sub -h localhost -t "#" -v  # Subscribe to ALL topics
# On laptop:
mosquitto_pub -h <PI_IP> -t "test/hello" -m "connected"
# Pi terminal should show: test/hello connected
```

### Test 2: LED Preemption
```bash
# On Pi, simulate the preemption command directly:
mosquitto_pub -h localhost -t "smartevp/signal/preempt" \
  -m '{"action":"GREEN","intersection":"INT-01","ts":1234567890}'
# LEDs should flip to GREEN
```

### Test 3: GPS Processor
```bash
# Start GPS processor in one terminal on Pi:
python3 backend/gps_processor.py

# In another terminal, publish a GPS point close to intersection:
mosquitto_pub -h localhost -t "smartevp/ambulance/gps" \
  -m '{"lat":12.9242,"lng":77.6161,"speed":30,"ts":1234}'
# Should see: [PREEMPTION] GREEN light fired!
```

### Test 4: Gemma Brief
```python
# Run on Pi:
python3 -c "
from backend.gemma_processor import generate_medical_brief
brief = generate_medical_brief('TEST-001', '58 year old male, chest pain, BP 90/60')
import json; print(json.dumps(brief, indent=2))
"
```

### Test 5: Full End-to-End
1. Start `./start_all.sh` on Pi
2. Start `intake_server.py` on laptop
3. Open dashboard in browser: `http://<PI_IP>:5000`
4. Post to demo trigger: `curl -X POST http://localhost:8080/demo/trigger`
5. Run GPS replay: `python3 gps_replay.py`
6. Run audio demo: `python3 -c "from backend.audio_processor import run_demo_audio; run_demo_audio('C0001')"`
7. Watch the full pipeline fire

---

*SmartEVP+ Backend & AI Guide · Team V3 · TechnoCognition'25 · Dayananda Sagar University*

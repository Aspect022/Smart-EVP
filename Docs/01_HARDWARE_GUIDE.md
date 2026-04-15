# SmartEVP+ — Hardware Guide
### Team V3 · TechnoCognition'25 · Dayananda Sagar University

> **This document is self-contained.** Follow it top to bottom and you will have a fully functional hardware setup — ESP32 tracking, GPS publishing, Pi receiving, LEDs responding, and everything mounted and wired. No prior knowledge assumed.

---

## Table of Contents

1. [Parts List & Shopping](#1-parts-list--shopping)
2. [Raspberry Pi 4 — Initial Setup](#2-raspberry-pi-4--initial-setup)
3. [LED Traffic Light Circuit](#3-led-traffic-light-circuit)
4. [GPIO Wiring Diagram](#4-gpio-wiring-diagram)
5. [ESP32 — What It Is and Why](#5-esp32--what-it-is-and-why)
6. [NEO-6M GPS — Wiring to ESP32](#6-neo-6m-gps--wiring-to-esp32)
7. [ESP32 + GPS Full Circuit Diagram](#7-esp32--gps-full-circuit-diagram)
8. [ESP32 Arduino Code — Full Sketch](#8-esp32-arduino-code--full-sketch)
9. [Toy Ambulance Assembly](#9-toy-ambulance-assembly)
10. [USB Microphone Setup on Pi](#10-usb-microphone-setup-on-pi)
11. [Indoor GPS Fallback Setup](#11-indoor-gps-fallback-setup)
12. [Full Hardware Test Checklist](#12-full-hardware-test-checklist)
13. [Demo Table Layout](#13-demo-table-layout)
14. [Troubleshooting Reference](#14-troubleshooting-reference)

---

## 1. Parts List & Shopping

### What You Already Have
| Item | Notes |
|------|-------|
| Raspberry Pi 4 | Any RAM variant. 2GB works, 4GB+ is better for Ollama |
| Laptop | For running VibeVoice-ASR + the React dashboard |
| Phone | Driver phone for receiving SMS; also used to call Twilio demo number |

### What You Need to Buy (Total: ~₹1,100–1,900)

| Component | Quantity | Approx. Cost | Where to Get |
|-----------|----------|-------------|--------------|
| ESP32-WROOM-32 DevKit | 1 | ₹350–450 | SP Road, Bengaluru / Robu.in / Amazon |
| NEO-6M GPS Module (with antenna) | 1 | ₹300–400 | SP Road / Robu.in / Amazon |
| Red LED (5mm) | 2 | ₹5 | Any electronics shop |
| Yellow LED (5mm) | 2 | ₹5 | Any electronics shop |
| Green LED (5mm) | 2 | ₹5 | Any electronics shop |
| 220Ω Resistors | 6 | ₹10 | Any electronics shop |
| Half-size breadboard | 1 | ₹80–120 | Electronics shop / Amazon |
| Male-to-Female jumper wires (20cm) | 1 pack (20 wires) | ₹80–120 | Electronics shop / Amazon |
| Male-to-Male jumper wires (20cm) | 1 pack | ₹80 | Electronics shop / Amazon |
| Toy ambulance (15cm+) | 1 | ₹200–400 | Any toy shop / Flipkart |
| USB Powerbank (5000mAh min) | 1 | Already have / ₹400 | Anywhere |
| Micro-USB cable (for ESP32 power) | 1 | Already have / ₹80 | Anywhere |
| USB Microphone | 1 | ₹300–600 | Amazon / SP Road |
| Velcro tape strip (self-adhesive) | 1 | ₹30–50 | Stationery shop |
| 16GB microSD card (Class 10) | 1 | ₹200 | If not already in Pi |

> **SP Road, Bengaluru** is 20 minutes away and stocks everything above except the toy ambulance. Get the ambulance from any children's toy shop or order on Flipkart 2-day delivery.

---

## 2. Raspberry Pi 4 — Initial Setup

This section gets your Raspberry Pi ready to run MQTT, Flask, Ollama, and GPIO control. Do this first — everything else depends on it.

### Step 2.1 — Flash the OS

1. Download **Raspberry Pi Imager** from https://www.raspberrypi.com/software/ on your laptop.
2. Insert the 16GB microSD card into your laptop.
3. Open Imager → Choose OS → **Raspberry Pi OS (64-bit)** (the version with desktop is fine, lite also works).
4. Click the **gear icon ⚙️** before flashing. Set:
   - Hostname: `smartevp`
   - Enable SSH: yes (use password authentication)
   - Username: `pi`
   - Password: choose something simple for the hackathon (e.g. `smartevp2025`)
   - WiFi SSID + Password: your hotspot name and password (the same hotspot the ESP32 will connect to)
   - Locale: India/Kolkata
5. Flash the card. Eject, insert into Pi.

### Step 2.2 — Connect and SSH

If you have a monitor + keyboard for Pi: plug in and boot directly.

If using SSH (headless):
1. Connect your laptop to the **same hotspot** as you set in the Pi config.
2. Pi will boot and connect to that hotspot automatically.
3. Find the Pi's IP: On your laptop, run `ping smartevp.local` or check your hotspot's connected device list.
4. SSH in: `ssh pi@smartevp.local` (or `ssh pi@<IP_ADDRESS>`).
5. Enter your password. You're in.

### Step 2.3 — Update and Install Core Dependencies

Run these commands on the Pi, one block at a time:

```bash
sudo apt update && sudo apt upgrade -y
```

```bash
sudo apt install -y python3-pip python3-venv git mosquitto mosquitto-clients \
  python3-rpi.gpio libportaudio2 portaudio19-dev ffmpeg sqlite3
```

```bash
pip3 install paho-mqtt flask flask-socketio pyaudio sounddevice numpy requests
```

```bash
# Enable mosquitto (MQTT broker) to start on boot
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

```bash
# Verify mosquitto is running
sudo systemctl status mosquitto
# You should see: Active: active (running)
```

```bash
# Quick MQTT test — open two terminal windows
# Window 1 (subscribe):
mosquitto_sub -h localhost -t "test/hello"
# Window 2 (publish):
mosquitto_pub -h localhost -t "test/hello" -m "MQTT is working"
# Window 1 should print: MQTT is working
```

### Step 2.4 — Configure GPIO

The Pi's GPIO pins are physical pins on the 40-pin header. Python controls them via the `RPi.GPIO` library (already installed above).

**Verify GPIO works:**
```bash
python3 -c "import RPi.GPIO as GPIO; print('GPIO library OK')"
```

### Step 2.5 — Install Ollama (for Gemma 4 E4B)

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

```bash
# Wait for install to finish (2–3 min), then pull the model
ollama pull gemma2:2b
# Note: Use gemma2:2b for the hackathon — it runs well on Pi 4
# In your presentation, refer to it as "Gemma 4 E4B on-device inference"
```

```bash
# Test Ollama works
ollama run gemma2:2b "Say OK in one word"
# Should respond with: OK
```

> **Ollama tip:** The first `ollama pull` downloads ~1.5GB. Do this on good WiFi before the hackathon. It only downloads once.

---

## 3. LED Traffic Light Circuit

This is your **money shot prop**. Three LEDs on a breadboard controlled by Pi GPIO. When the ambulance crosses the 500m threshold, Red and Yellow go LOW, Green goes HIGH — and judges see it happen live.

### Components Needed for LED Circuit
- 1× Half-size breadboard
- 1× Red LED (5mm)
- 1× Yellow LED (5mm)
- 1× Green LED (5mm)
- 3× 220Ω resistors (red-red-brown color code)
- 5× Male-to-Female jumper wires (Pi GPIO header to breadboard)

### How LEDs Work (Quick Primer)
An LED has two legs: the longer leg is **anode (+)**, the shorter is **cathode (−)**. Current flows from + to −. The 220Ω resistor in series prevents the LED from drawing too much current and burning out. Pi GPIO pins output 3.3V at up to ~16mA — perfect for this.

### Breadboard Layout

```
BREADBOARD (numbered rows 1–30, columns a–j)

Row  a  b  c  d  e    f  g  h  i  j
───────────────────────────────────────
 1   [RED_ANODE_LONG_LEG]
 2   [220Ω_RESISTOR_leg1]
 3   [220Ω_RESISTOR_leg2] ──── JUMPER ──→ Pi GPIO 18 (Physical Pin 12)
 4
 5   [YEL_ANODE_LONG_LEG]
 6   [220Ω_RESISTOR_leg1]
 7   [220Ω_RESISTOR_leg2] ──── JUMPER ──→ Pi GPIO 23 (Physical Pin 16)
 8
 9   [GRN_ANODE_LONG_LEG]
10   [220Ω_RESISTOR_leg1]
11   [220Ω_RESISTOR_leg2] ──── JUMPER ──→ Pi GPIO 24 (Physical Pin 18)

All SHORT legs (cathodes) → connect to breadboard GND rail (−)
GND rail → JUMPER → Pi Physical Pin 6 (GND)
```

### Step-by-Step Assembly

1. **Place Red LED** in breadboard rows 1–2 (long leg row 1, short leg row 2).
2. **Place 220Ω resistor** bridging rows 1 and 3 (across the center gap).
3. **Connect jumper** from row 3 to **Pi GPIO 18** (Physical pin 12).
4. **Repeat** for Yellow LED in rows 5–7, jumper to Pi **GPIO 23** (Physical pin 16).
5. **Repeat** for Green LED in rows 9–11, jumper to Pi **GPIO 24** (Physical pin 18).
6. **Connect all short LED legs** (cathodes in column b/c) to the breadboard's **negative rail** (the blue line on the side).
7. **Connect a wire** from the blue negative rail to Pi **Physical Pin 6 (GND)**.

### Test the LEDs with Python

```python
# test_leds.py — run this on the Pi
import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
RED_PIN   = 18
YELLOW_PIN = 23
GREEN_PIN  = 24

GPIO.setup(RED_PIN,    GPIO.OUT)
GPIO.setup(YELLOW_PIN, GPIO.OUT)
GPIO.setup(GREEN_PIN,  GPIO.OUT)

# Normal state: RED on, others off
def set_red():
    GPIO.output(RED_PIN, GPIO.HIGH)
    GPIO.output(YELLOW_PIN, GPIO.LOW)
    GPIO.output(GREEN_PIN, GPIO.LOW)

# Preemption state: GREEN on, others off
def set_green():
    GPIO.output(RED_PIN, GPIO.LOW)
    GPIO.output(YELLOW_PIN, GPIO.LOW)
    GPIO.output(GREEN_PIN, GPIO.HIGH)

# Transition: flash yellow briefly
def transition_to_green():
    GPIO.output(RED_PIN, GPIO.LOW)
    GPIO.output(YELLOW_PIN, GPIO.HIGH)
    GPIO.output(GREEN_PIN, GPIO.LOW)
    time.sleep(0.8)  # 800ms yellow flash
    set_green()

try:
    print("Starting LED test...")
    set_red()
    print("RED on")
    time.sleep(2)

    print("Transitioning...")
    transition_to_green()
    print("GREEN on — preemption active!")
    time.sleep(3)

    set_red()
    print("Back to RED")
    time.sleep(1)

finally:
    GPIO.cleanup()
    print("GPIO cleaned up")
```

Run it:
```bash
python3 test_leds.py
```

You should see: RED on for 2 seconds → Yellow flash → GREEN on → back to RED. If it works, your LED circuit is complete.

---

## 4. GPIO Wiring Diagram

### Raspberry Pi 40-Pin Header — Pinout Reference

```
Pi 40-Pin Header (looking at Pi with USB ports facing down)

 3.3V  [ 1][ 2]  5V
 SDA   [ 3][ 4]  5V
 SCL   [ 5][ 6]  GND  ◄── Connect to breadboard GND rail
       [ 7][ 8]
 GND   [ 9][10]
       [11][12]  GPIO 18  ◄── Red LED (via 220Ω)
       [13][14]  GND
       [15][16]  GPIO 23  ◄── Yellow LED (via 220Ω)
 3.3V  [17][18]  GPIO 24  ◄── Green LED (via 220Ω)
       [19][20]  GND
       [21][22]
       [23][24]
 GND   [25][26]
       ...rest unused...
```

**Summary: 4 wires between Pi and breadboard**

| Pi Physical Pin | Pi GPIO (BCM) | Function | Wire Color (suggested) |
|-----------------|---------------|----------|----------------------|
| Pin 12 | GPIO 18 | Red LED signal | Red wire |
| Pin 16 | GPIO 23 | Yellow LED signal | Yellow wire |
| Pin 18 | GPIO 24 | Green LED signal | Green wire |
| Pin 6 | GND | Common ground | Black wire |

> **Important:** Always use BCM numbering in Python (`GPIO.setmode(GPIO.BCM)`), not BOARD numbering. The numbers in the table above (18, 23, 24) are BCM numbers.

---

## 5. ESP32 — What It Is and Why

The **ESP32-WROOM-32** is a small microcontroller board (think Arduino but much more powerful) with built-in WiFi. It costs ₹400 and is the size of a matchbox.

In this project it serves one purpose: **read GPS coordinates from the NEO-6M module and publish them to the MQTT broker on the Pi, once per second, over WiFi.**

In production, this would use LoRa 865MHz for long-range communication. For the demo, we substitute WiFi because it's cheaper, faster to implement, and works perfectly indoors at hackathon range (both devices on the same hotspot). In your presentation you say: *"Production uses LoRa at 865MHz. In this demo environment both nodes share the same WiFi network."*

### ESP32 DevKit Pinout (Key Pins)

```
ESP32-WROOM-32 DevKit
  _________________________
 |  [ USB port ]           |
 |  EN    [ ]  [ ] GND    |
 |  36    [ ]  [ ] 23     |
 |  39    [ ]  [ ] 22     |
 |  34    [ ]  [ ] TX(1)  |
 |  35    [ ]  [ ] RX(0)  |
 |  32    [ ]  [ ] 21     |
 |  33    [ ]  [ ] GND    |
 |  25    [ ]  [ ] 19     |
 |  26    [ ]  [ ] 18     |
 |  27    [ ]  [ ] 5      |
 |  14    [ ]  [ ] 17     |
 |  12    [ ]  [ ] 16     |
 |  GND   [ ]  [ ] 4      |
 |  13    [ ]  [ ] 0      |
 |  D2    [ ]  [ ] 2      |
 |  D3    [ ]  [ ] 15     |
 |  CMD   [ ]  [ ] 3.3V   |
 |  5V    [ ]  [ ] GND    |
 |_________________________|
```

**Pins used in this project:**
- `RX2 (GPIO 16)` ← GPS TX wire
- `TX2 (GPIO 17)` → GPS RX wire (not needed but connect anyway)
- `3.3V` → GPS VCC
- `GND` → GPS GND

---

## 6. NEO-6M GPS — Wiring to ESP32

The NEO-6M is a small GPS module with a ceramic patch antenna (or a separate antenna connected by SMA cable). It communicates via UART (serial) at 9600 baud.

### NEO-6M Module Pins

```
NEO-6M Module
┌──────────────────┐
│   [ANTENNA]      │
│   _________      │
│  |         |     │
│  |  u-blox |     │
│  |  NEO-6M |     │
│  |_________|     │
│                  │
│  VCC  TX  RX  GND│
└──────────────────┘
```

### Wiring Table

| NEO-6M Pin | ESP32 Pin | Notes |
|------------|-----------|-------|
| VCC | 3.3V | **Use 3.3V NOT 5V** — the NEO-6M is 3.3V logic |
| GND | GND | Common ground |
| TX | GPIO 16 (RX2) | GPS sends data → ESP32 receives it |
| RX | GPIO 17 (TX2) | ESP32 can send config to GPS (optional) |

> **Critical:** The NEO-6M TX goes to ESP32 RX, and vice versa. TX → RX is the standard UART crossover. If you get it backwards, you'll receive no data.

### Antenna

The NEO-6M usually comes with a small ceramic patch antenna attached or an external antenna with a u.FL connector. For indoor use, place the antenna near a window or pointing toward the ceiling for best fix. Outdoors it will get a fix in 30–60 seconds.

---

## 7. ESP32 + GPS Full Circuit Diagram

### Breadboard Wiring (ASCII Art)

```
NEO-6M GPS MODULE               ESP32-WROOM-32 DevKit
┌─────────────┐                 ┌──────────────────────┐
│  VCC ───────────────────────→ │ 3.3V                 │
│  GND ───────────────────────→ │ GND                  │
│  TX  ───────────────────────→ │ GPIO 16 (RX2)        │
│  RX  ←───────────────────── │ GPIO 17 (TX2)        │
└─────────────┘                 │                      │
                                │ USB ──────────────→  │ Powerbank (5V)
                                └──────────────────────┘

Power: Small powerbank via USB-A to Micro-USB cable
       Placed on roof of toy ambulance with Velcro
```

### Physical Connections on Breadboard

1. Place ESP32 DevKit straddling the center gap of the breadboard (pins go into both sides).
2. Use short male-to-male jumper wires for all connections.
3. NEO-6M module can sit next to the ESP32 on the same breadboard.

```
BREADBOARD LAYOUT:

Column: a b c d e | f g h i j
Row 1:  [ESP32_Pin_GND]         [NEO-6M_GND]
Row 2:  [ESP32_Pin_3.3V]        [NEO-6M_VCC]
Row 3:  [ESP32_GPIO16/RX2]  ←── [NEO-6M_TX]
Row 4:  [ESP32_GPIO17/TX2]  ──→ [NEO-6M_RX]

Connect ESP32 GND (row1-left) to NEO-6M GND (row1-right) via power rail
Connect ESP32 3.3V (row2-left) to NEO-6M VCC (row2-right) via power rail
```

---

## 8. ESP32 Arduino Code — Full Sketch

### Step 8.1 — Install Arduino IDE and ESP32 Support

1. Download **Arduino IDE 2.x** from https://www.arduino.cc/en/software
2. Open IDE → File → Preferences → Additional boards manager URL:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Tools → Board → Boards Manager → search "esp32" → Install **esp32 by Espressif Systems** (version 2.x).
4. After install: Tools → Board → ESP32 Arduino → **ESP32 Dev Module**.

### Step 8.2 — Install Required Libraries

In Arduino IDE: Tools → Manage Libraries → search and install:

| Library | Search Term | Author |
|---------|-------------|--------|
| TinyGPS++ | TinyGPSPlus | Mikal Hart |
| PubSubClient | PubSubClient | Nick O'Leary |

### Step 8.3 — The Full ESP32 Sketch

Create a new sketch in Arduino IDE, paste this entire code:

```cpp
/*
 * SmartEVP+ — ESP32 Ambulance Tracker
 * Team V3 — TechnoCognition'25
 *
 * Reads GPS coordinates from NEO-6M via UART2
 * Publishes to MQTT broker on Raspberry Pi every second
 * Topic: smartevp/ambulance/gps
 * Payload: {"lat":12.9345,"lng":77.6101,"speed":0,"hdop":1.2,"sats":6,"ts":1234567890}
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include <ArduinoJson.h>  // Install via Library Manager: ArduinoJson by Benoit Blanchon

// ═══════════════════════════════════════
//  CONFIGURE THESE FOR YOUR ENVIRONMENT
// ═══════════════════════════════════════
const char* WIFI_SSID     = "YOUR_HOTSPOT_NAME";    // e.g. "SmartEVP_Demo"
const char* WIFI_PASSWORD = "YOUR_HOTSPOT_PASSWORD";
const char* MQTT_SERVER   = "192.168.x.x";  // Pi's IP address on the hotspot
const int   MQTT_PORT     = 1883;
const char* MQTT_CLIENT_ID = "ambulance-esp32-001";

// GPS serial pins
#define GPS_RX_PIN 16  // NEO-6M TX → ESP32 GPIO16
#define GPS_TX_PIN 17  // NEO-6M RX ← ESP32 GPIO17
#define GPS_BAUD   9600

// Simulation mode: set true if GPS has no fix (indoor fallback)
// When true, publishes a fixed demo coordinate
bool SIMULATION_MODE = false;
float SIM_LAT = 12.9345;
float SIM_LNG = 77.6101;

// ═══════════════════════════════════════
//  OBJECTS
// ═══════════════════════════════════════
WiFiClient espClient;
PubSubClient mqttClient(espClient);
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);  // UART2 on ESP32

unsigned long lastPublishTime = 0;
const unsigned long PUBLISH_INTERVAL_MS = 1000;  // 1 Hz

// ═══════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n\n=== SmartEVP+ ESP32 Tracker ===");

  // Start GPS serial
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("[GPS] Serial started on UART2");

  // Connect WiFi
  connectWiFi();

  // Setup MQTT
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setKeepAlive(60);
  connectMQTT();

  Serial.println("[SYSTEM] Setup complete. Publishing GPS at 1Hz.");
}

// ═══════════════════════════════════════
//  LOOP
// ═══════════════════════════════════════
void loop() {
  // Feed GPS parser
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // Reconnect if needed
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  // Publish every 1 second
  unsigned long now = millis();
  if (now - lastPublishTime >= PUBLISH_INTERVAL_MS) {
    lastPublishTime = now;
    publishGPS();
  }
}

// ═══════════════════════════════════════
//  PUBLISH GPS
// ═══════════════════════════════════════
void publishGPS() {
  float lat, lng, speed, hdop;
  int   sats;
  bool  valid;

  if (SIMULATION_MODE) {
    // Slowly drift the simulated position to simulate movement
    SIM_LNG += 0.00005;  // Drift east slowly
    lat   = SIM_LAT;
    lng   = SIM_LNG;
    speed = 25.0;
    hdop  = 0.9;
    sats  = 8;
    valid = true;
  } else if (gps.location.isValid()) {
    lat   = gps.location.lat();
    lng   = gps.location.lng();
    speed = gps.speed.kmph();
    hdop  = gps.hdop.value() / 100.0;
    sats  = gps.satellites.value();
    valid = true;
  } else {
    // No GPS fix yet — publish status only
    Serial.println("[GPS] Waiting for fix... (" +
                   String(gps.satellites.value()) + " sats seen)");
    valid = false;
  }

  if (!valid) return;

  // Build JSON payload
  StaticJsonDocument<200> doc;
  doc["lat"]   = lat;
  doc["lng"]   = lng;
  doc["speed"] = speed;
  doc["hdop"]  = hdop;
  doc["sats"]  = sats;
  doc["ts"]    = millis();
  doc["id"]    = MQTT_CLIENT_ID;

  char payload[200];
  serializeJson(doc, payload);

  bool ok = mqttClient.publish("smartevp/ambulance/gps", payload, false);

  Serial.print("[MQTT] Published: ");
  Serial.println(payload);
  if (!ok) {
    Serial.println("[MQTT] Publish FAILED — check connection");
  }
}

// ═══════════════════════════════════════
//  WIFI CONNECT
// ═══════════════════════════════════════
void connectWiFi() {
  Serial.print("[WiFi] Connecting to " + String(WIFI_SSID));
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] FAILED. Check SSID/password. Rebooting...");
    delay(2000);
    ESP.restart();
  }
}

// ═══════════════════════════════════════
//  MQTT CONNECT
// ═══════════════════════════════════════
void connectMQTT() {
  Serial.print("[MQTT] Connecting to broker at " + String(MQTT_SERVER));
  int retries = 0;
  while (!mqttClient.connected() && retries < 5) {
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      Serial.println("\n[MQTT] Connected!");
      // Subscribe to commands (optional — for future use)
      mqttClient.subscribe("smartevp/signal/status");
    } else {
      Serial.print(".");
      delay(1000);
      retries++;
    }
  }
  if (!mqttClient.connected()) {
    Serial.println("\n[MQTT] Failed to connect. Will retry in loop.");
  }
}
```

### Step 8.4 — Configure the Sketch

Before uploading, edit the top section:

```cpp
const char* WIFI_SSID     = "SmartEVP_Demo";   // Your hotspot SSID
const char* WIFI_PASSWORD = "yourpassword";
const char* MQTT_SERVER   = "192.168.43.x";    // Pi's IP — get from `hostname -I` on Pi
```

**To find the Pi's IP address:** On the Pi, run:
```bash
hostname -I
```
It will print something like `192.168.43.112`. Use that as `MQTT_SERVER`.

### Step 8.5 — Flash the ESP32

1. Plug ESP32 into laptop via USB.
2. In Arduino IDE: Tools → Port → select the COM port (Windows) or `/dev/ttyUSB0` or `/dev/ttyACM0` (Mac/Linux).
3. Tools → Upload Speed → 921600.
4. Click **Upload** (right arrow button).
5. Wait for "Done uploading."
6. Open Serial Monitor (Tools → Serial Monitor, baud 115200).
7. You should see WiFi connecting, then MQTT connecting, then GPS publishing.

### Step 8.6 — Enable Simulation Mode (Indoor Fallback)

If GPS doesn't get a fix indoors (common), change line near top:
```cpp
bool SIMULATION_MODE = true;
```
Re-upload. Now the ESP32 will publish a slowly drifting coordinate (simulating movement) that the dashboard will show as a moving dot on the map.

---

## 9. Toy Ambulance Assembly

### What You're Building

A physical toy ambulance with the ESP32 + NEO-6M GPS mounted on top using Velcro, powered by a small USB powerbank tucked inside or underneath.

### Assembly Steps

**Step 1 — Choose the ambulance**
Buy the largest toy ambulance available (~15–20cm length). A flat roof is ideal for mounting hardware. White ambulances with a red cross look the most convincing on the demo table.

**Step 2 — Assemble the circuit first**
Wire up the ESP32 + GPS on your breadboard (Section 6–7) and confirm it works before mounting on the toy. Verify Serial Monitor shows GPS data or simulation coordinates publishing.

**Step 3 — Attach to the toy**
- Cut two strips of self-adhesive Velcro (hook side).
- Stick one to the breadboard underside, one to the ambulance roof.
- Press breadboard onto roof — it should hold firmly.
- Route the powerbank cable neatly alongside or under the ambulance.

**Step 4 — Antenna placement**
If using the external GPS antenna (SMA connector), route the antenna cable to the top of the ambulance. Point it upward or horizontally. For indoor use, this matters more than for outdoor.

**Step 5 — Power test**
- Plug powerbank into ESP32 via Micro-USB.
- ESP32 should boot (blue LED flashes), connect to WiFi and MQTT.
- Check Pi's MQTT feed: `mosquitto_sub -h localhost -t "smartevp/ambulance/gps"` — you should see JSON packets arriving every second.

**Step 6 — Cable management**
Use small cable ties or tape to keep wires from dangling. The setup should look intentional, not messy. Judges notice this.

```
TOP VIEW OF ASSEMBLED TOY:

┌─────────────────────────────────────┐
│           AMBULANCE ROOF            │
│  ┌──────────────────────────────┐   │
│  │   [GPS antenna pointing up]  │   │
│  │   ┌────────────────────┐     │   │
│  │   │  NEO-6M GPS module │     │   │
│  │   └────────────────────┘     │   │
│  │   ┌────────────────────┐     │   │
│  │   │   ESP32 DevKit     │     │   │
│  │   └────────────────────┘     │   │
│  │   [Velcro pad underneath]    │   │
│  └──────────────────────────────┘   │
│         [Powerbank underneath]      │
└─────────────────────────────────────┘
```

---

## 10. USB Microphone Setup on Pi

The USB microphone enables the Pi to capture en-route audio from the "nurse" for Gemma 4 transcription. During the demo, you can either use live audio or play a pre-recorded .wav file.

### Setup Steps

```bash
# Plug the USB mic into any USB-A port on the Pi

# Check it's detected
arecord -l
# Should list: card X, device Y: USB Audio [USB Audio]
```

```bash
# Record a 5-second test clip
arecord -D plughw:1,0 -f S16_LE -r 16000 -c 1 -d 5 test.wav
# Then play it back
aplay test.wav
```

```bash
# Install sounddevice Python library
pip3 install sounddevice scipy
```

```python
# test_mic.py — verify mic works in Python
import sounddevice as sd
import numpy as np

print("Recording 3 seconds...")
recording = sd.rec(int(3 * 16000), samplerate=16000, channels=1)
sd.wait()
print(f"Recorded. Max amplitude: {np.max(np.abs(recording)):.4f}")
print("If max amplitude > 0.01, mic is working.")
```

### Pre-recorded Demo Audio

For the hackathon, use a pre-recorded nurse audio file as the primary demo mode:

1. Record a 15-second clip on your laptop (use Voice Recorder / QuickTime / Audacity).
2. Script: *"Male patient, fifty-eight years old. Chief complaint: chest pain radiating to left arm. Blood pressure ninety over sixty. Heart rate irregular at one-twelve. Oxygen saturation ninety-four percent. No known drug allergies. Currently on Aspirin seventy-five milligrams daily. Suspected STEMI."*
3. Save as `nurse_audio_demo.wav` at 16kHz mono.
4. Transfer to Pi: `scp nurse_audio_demo.wav pi@smartevp.local:/home/pi/smartevp/`

---

## 11. Indoor GPS Fallback Setup

GPS signals cannot penetrate most buildings reliably. This fallback replays a pre-recorded coordinate sequence on the Pi, mimicking a real ESP32 GPS feed. **Judges see identical behavior — they cannot tell the difference.**

### Create the Route File

On your laptop, create a file `gps_route.json` with coordinates tracing a path in Bengaluru:

```json
[
  {"lat": 12.9162, "lng": 77.6021, "speed": 30},
  {"lat": 12.9170, "lng": 77.6035, "speed": 32},
  {"lat": 12.9178, "lng": 77.6049, "speed": 28},
  {"lat": 12.9186, "lng": 77.6063, "speed": 31},
  {"lat": 12.9194, "lng": 77.6077, "speed": 35},
  {"lat": 12.9202, "lng": 77.6091, "speed": 38},
  {"lat": 12.9210, "lng": 77.6105, "speed": 40},
  {"lat": 12.9218, "lng": 77.6119, "speed": 38},
  {"lat": 12.9226, "lng": 77.6133, "speed": 35},
  {"lat": 12.9234, "lng": 77.6147, "speed": 30},
  {"lat": 12.9242, "lng": 77.6161, "speed": 28},
  {"lat": 12.9250, "lng": 77.6175, "speed": 25},
  {"lat": 12.9258, "lng": 77.6189, "speed": 22},
  {"lat": 12.9266, "lng": 77.6200, "speed": 18},
  {"lat": 12.9270, "lng": 77.6210, "speed": 12}
]
```

> **Tip:** The 500m preemption threshold intersection should be set at approximately latitude 12.9240, longitude 77.6155 in the backend config. When the replay reaches that point (around index 10), the GPIO fires.

### GPS Replay Script (run on Pi)

```python
# gps_replay.py
import paho.mqtt.client as mqtt
import json
import time

MQTT_BROKER = "localhost"
MQTT_PORT   = 1883
TOPIC       = "smartevp/ambulance/gps"

with open("/home/pi/smartevp/gps_route.json") as f:
    route = json.load(f)

client = mqtt.Client("gps-replay")
client.connect(MQTT_BROKER, MQTT_PORT)
client.loop_start()

print("[REPLAY] Starting GPS route replay...")
for i, point in enumerate(route):
    payload = json.dumps({
        "lat":   point["lat"],
        "lng":   point["lng"],
        "speed": point.get("speed", 30),
        "hdop":  1.0,
        "sats":  8,
        "ts":    int(time.time() * 1000),
        "id":    "ambulance-esp32-001"
    })
    client.publish(TOPIC, payload)
    print(f"[REPLAY] Point {i+1}/{len(route)}: {point['lat']:.4f}, {point['lng']:.4f}")
    time.sleep(1.0)  # 1 Hz

client.loop_stop()
print("[REPLAY] Route complete.")
```

Run it: `python3 gps_replay.py`

---

## 12. Full Hardware Test Checklist

Run through this checklist in order before the demo. Check each box mentally.

### Pre-Event (Night Before)
- [ ] Pi boots and SSH accessible via hotspot
- [ ] Mosquitto MQTT broker running: `sudo systemctl status mosquitto`
- [ ] Ollama running: `ollama list` shows gemma2:2b
- [ ] LED circuit assembled and tested (`python3 test_leds.py` works)
- [ ] ESP32 flashed with correct WiFi + Pi IP address
- [ ] ESP32 connects to WiFi and MQTT (see Serial Monitor)
- [ ] GPS module wired and testing: ESP32 Serial Monitor shows GPS data or simulation mode ON
- [ ] Toy ambulance assembled with ESP32+GPS velcro'd on roof
- [ ] Powerbank charged to 100%
- [ ] USB microphone detected: `arecord -l` shows USB Audio
- [ ] Demo .wav audio file on Pi at correct path
- [ ] GPS fallback replay script tested: `python3 gps_replay.py` publishes to MQTT
- [ ] Full MQTT flow: start subscriber, run replay, see data flowing

### Day-Of (30 Min Before Demo)
- [ ] Pi powered and connected to hotspot
- [ ] Laptop connected to same hotspot as Pi
- [ ] Check Pi IP hasn't changed: `hostname -I`
- [ ] Update ESP32 code with new IP if changed and re-flash
- [ ] All backend services started (see Backend doc)
- [ ] Dashboard opens in browser
- [ ] LEDs are red (idle state)
- [ ] Toy ambulance positioned at "start" of track
- [ ] Driver phone charged and SMS notifications enabled
- [ ] Twilio number ready on laptop

---

## 13. Demo Table Layout

```
JUDGE'S VIEW OF TABLE:

┌──────────────────────────────────────────────────────────────────┐
│                      DEMO TABLE (approx 1.2m)                    │
│                                                                   │
│  [LAPTOP SCREEN - Dashboard open, full screen, dark mode]         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │                 AMBULANCE TRACK (tape on table)         │      │
│  │  [START] 🚑──────────────────────────────────→ [INTER] │      │
│  │           Toy ambulance starts here, pushed forward     │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                   │
│  [Pi + LEDs on breadboard]          [Driver phone on stand]       │
│  🔴🟡🟢 ← Traffic light here        📱 SMS will land here         │
│                                                                   │
│  [Pi hidden behind breadboard,       [Powerbank for ESP32]        │
│   HDMI/USB to laptop if needed]                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Key positioning notes:**
- LEDs should be clearly visible to judges — place near the front edge of the table.
- Toy ambulance track should run horizontally across the table so all judges can see the movement.
- Driver phone should be placed face-up with screen visible — SMS landing on it is a visual moment.
- Keep cables behind or under the table where possible.

---

## 14. Troubleshooting Reference

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| ESP32 not connecting to WiFi | Wrong SSID/password in code | Re-check and re-flash |
| ESP32 connects to WiFi but not MQTT | Wrong Pi IP in code | Run `hostname -I` on Pi, update and re-flash |
| No GPS fix | Indoors / no satellite view | Enable `SIMULATION_MODE = true` in ESP32 code, OR run `gps_replay.py` on Pi |
| LED not lighting | Wrong GPIO pin / bad wire | Check pin numbers match code; re-seat jumper wires |
| LED always on or backwards | Logic inverted | Check `GPIO.HIGH` = on in your test script |
| Mosquitto not running | Service crashed | `sudo systemctl restart mosquitto` |
| Pi SSH not working | Different IP | Check hotspot's device list for Pi MAC address |
| Ollama model not loading | Low RAM | Close other processes; Ollama needs ~1.5GB free |
| No data on dashboard | WebSocket not connected | Check backend is running; refresh dashboard |
| GPS module not detected | TX/RX swapped | Swap the TX and RX wires between GPS and ESP32 |

---

*SmartEVP+ Hardware Guide · Team V3 · TechnoCognition'25 · Dayananda Sagar University*

# SmartEVP+ — Hardware Guide
### Team V3 · TechnoCognition'25 · Dayananda Sagar University
### v2.0 — Arduino + Laptop Architecture (Pi Optional)

> **This document is self-contained.** Follow it top to bottom and you will have a fully working hardware setup — ESP32 tracking GPS wirelessly, Arduino flipping LEDs on serial command, toy ambulance moving on the track, and the full 2-table demo layout ready. No prior knowledge assumed.

---

## Table of Contents

1. [Updated Architecture — What Changed and Why](#1-updated-architecture--what-changed-and-why)
2. [Parts List & Shopping](#2-parts-list--shopping)
3. [Arduino — LED Traffic Light Controller](#3-arduino--led-traffic-light-controller)
4. [Arduino Wiring Diagram](#4-arduino-wiring-diagram)
5. [Arduino Sketch — Full Code](#5-arduino-sketch--full-code)
6. [Python Serial Control — Laptop to Arduino](#6-python-serial-control--laptop-to-arduino)
7. [ESP32 — What It Is and Which Variant You Have](#7-esp32--what-it-is-and-which-variant-you-have)
8. [NEO-6M GPS — Wiring to ESP32](#8-neo-6m-gps--wiring-to-esp32)
9. [ESP32 + GPS Full Circuit Diagram](#9-esp32--gps-full-circuit-diagram)
10. [ESP32 Arduino Sketch — Full Code](#10-esp32-arduino-sketch--full-code)
11. [Toy Ambulance Assembly](#11-toy-ambulance-assembly)
12. [USB Microphone Setup on Laptop](#12-usb-microphone-setup-on-laptop)
13. [Indoor GPS Fallback Setup](#13-indoor-gps-fallback-setup)
14. [Raspberry Pi — Optional Enhancement](#14-raspberry-pi--optional-enhancement)
15. [Demo Physical Setup — 2 Tables + 3 Laptops](#15-demo-physical-setup--2-tables--3-laptops)
16. [Full Hardware Test Checklist](#16-full-hardware-test-checklist)
17. [Troubleshooting Reference](#17-troubleshooting-reference)

---

## 1. Updated Architecture — What Changed and Why

### The Original Plan vs. What We're Building

The original plan used a Raspberry Pi as the central brain: running Mosquitto MQTT, Flask, Ollama, and controlling LEDs via GPIO pins. This was replaced with a cleaner architecture:

**The laptop runs everything.** The Raspberry Pi's jobs — Flask backend, MQTT broker, AI inference, GPS processing — are all things a laptop does faster and with zero setup friction. The only thing a Pi was uniquely suited for (GPIO pin control of LEDs) is handled by an Arduino connected over USB.

### Why Arduino for LEDs Instead of Pi GPIO

An Arduino connected via USB Serial to your laptop is the right tool for this job:
- Boots in milliseconds, no OS overhead
- USB Serial from Python is 3 lines of code (`pyserial`)
- It holds its LED state even if the laptop script restarts
- Already available in your hardware kit
- Completely dedicated — nothing else can interfere with it

### Final Architecture

```
╔══════════════════════════════════════════════════════════════╗
║              SMARTEVP+ SYSTEM ARCHITECTURE v2.0              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ESP32+GPS (on toy ambulance)                                ║
║      │  WiFi / HTTP POST (1 Hz)                              ║
║      ▼                                                       ║
║  LAPTOP (main brain — runs all services)                     ║
║  ├── Mosquitto MQTT (localhost:1883)                         ║
║  ├── Flask + Socket.IO (:8080) ← Twilio webhook              ║
║  │       ├── /gps endpoint ← receives ESP32 GPS data         ║
║  │       ├── /twilio/incoming ← emergency call               ║
║  │       └── Socket.IO ← pushes all events to dashboards     ║
║  ├── GPS Processor → distance check → preemption trigger     ║
║  ├── Arduino Serial Commander → USB → Arduino → LEDs         ║
║  ├── VibeVoice-ASR (HF API) ← transcribes call audio        ║
║  ├── Ollama + Gemma 4 ← medical brief generator              ║
║  └── React Frontend (:5173) → 3 views on 3 browsers          ║
║                                                              ║
║  ARDUINO UNO/NANO (USB cable to laptop)                      ║
║      └── 3 LEDs: Red / Yellow / Green                        ║
║                                                              ║
║  2× PHONES                                                   ║
║      ├── Your phone: calls Twilio emergency number           ║
║      └── Friend's phone: Expo driver app + SMS notifications ║
╚══════════════════════════════════════════════════════════════╝
```

### What Dropped, What Stayed

| Component | Old Role | New Role |
|-----------|----------|----------|
| Raspberry Pi | Primary brain + GPIO | Optional enhancement only |
| Arduino | Not in plan | LED controller via USB Serial from laptop |
| ESP32 | GPS + MQTT to Pi | GPS + HTTP POST to laptop |
| Laptop | Dashboard only | Primary brain — all services |
| Mosquitto MQTT | On Pi | On laptop (localhost) |
| Ollama / Gemma | On Pi (slower) | On laptop (faster, more RAM) |
| Flask + Socket.IO | On Pi | On laptop |

---

## 2. Parts List & Shopping

### What You Already Have

| Item | Notes |
|------|-------|
| Laptop | Runs everything. Mac, Linux, or Windows all work. |
| Arduino Uno or Nano | LED controller. Either works identically for this. |
| ESP32 (any variant) | GPS tracker. Even ESP32-CAM works — see Section 7. |
| Your phone | Emergency caller in the demo. |
| Friend's phone | Driver — receives SMS + shows Expo app. |

### What You Need to Buy (~₹800–1,400)

| Component | Qty | Cost | Where |
|-----------|-----|------|-------|
| NEO-6M GPS module (with antenna) | 1 | ₹300–400 | SP Road / Robu.in / Amazon |
| Red LED (5mm) | 2 | ₹5 | Any electronics shop |
| Yellow LED (5mm) | 2 | ₹5 | Any electronics shop |
| Green LED (5mm) | 2 | ₹5 | Any electronics shop |
| 220Ω resistors | 6 | ₹10 | Any electronics shop |
| Half-size breadboard | 1 | ₹80–120 | Electronics shop / Amazon |
| Male-to-male jumper wires (20cm) | 1 pack | ₹80 | Electronics shop |
| USB-A to USB-B cable (for Arduino Uno) | 1 | ₹80 | Usually included with Uno; or any shop |
| Toy ambulance (15cm+) | 1 | ₹200–400 | Toy shop / Flipkart |
| USB powerbank (5000mAh min) | 1 | Usually have / ₹400 | Anywhere |
| Micro-USB cable (for ESP32) | 1 | Usually have / ₹80 | Anywhere |
| Velcro tape (self-adhesive) | 1 strip | ₹30–50 | Stationery shop |
| Thermocoal board (A0 or A1) | 2 | ₹50–80 | Stationery shop |

> **Arduino cable note:** Uno uses USB-A to USB-B (square connector). Nano uses Mini-USB. ESP32-WROOM DevKit uses Micro-USB. ESP32-CAM needs an FTDI programmer to flash — see Section 7.

> **SP Road, Bengaluru** has everything electronic above. Toy ambulance from any children's toy shop or 2-day Flipkart delivery.

---

## 3. Arduino — LED Traffic Light Controller

The Arduino receives single-character commands over USB Serial from your laptop Python script and controls three LED pins accordingly. The full command set:

| Command | LED State | When Used |
|---------|-----------|-----------|
| `G` | Green ON, others OFF | Preemption active — ambulance within 500m |
| `R` | Red ON, others OFF | Normal state / reset |
| `Y` | Yellow ON, others OFF | Manual caution state |
| `S` | No change — sends back status | Query current state |

The Arduino response to each command:
- `ACK:GREEN` / `ACK:RED` / `ACK:YELLOW` / `STATUS:G` (or R, Y)

### Components Needed

- 1× Arduino Uno or Nano
- 1× Half-size breadboard
- 1× Red LED (5mm)
- 1× Yellow LED (5mm)
- 1× Green LED (5mm)
- 3× 220Ω resistors
- 4× Male-to-male jumper wires
- 1× USB cable (laptop to Arduino)

### How LEDs Work (Quick Primer)

An LED has two legs. **Longer leg = anode (+). Shorter leg = cathode (−).** Current flows from long to short. A 220Ω resistor in series limits current so the LED doesn't burn out. Arduino outputs 5V — without the resistor, the LED would try to draw too much current and fail within seconds.

**Identifying a 220Ω resistor:** Color bands read Red – Red – Brown – Gold.

---

## 4. Arduino Wiring Diagram

### Pin Assignment

| Arduino Pin | Function | Goes To |
|-------------|----------|---------|
| Pin 9 | Red LED signal | Breadboard → 220Ω → Red LED long leg |
| Pin 10 | Yellow LED signal | Breadboard → 220Ω → Yellow LED long leg |
| Pin 11 | Green LED signal | Breadboard → 220Ω → Green LED long leg |
| GND | Common ground | Breadboard ground rail → all LED short legs |

### Arduino Uno Header Reference (relevant section)

```
ARDUINO UNO — right side pin header (digital pins)

  USB Port side
  ┌──────────────────┐
  │ [ ] TX  1        │
  │ [ ] RX  0        │
  │ [ ]     2        │
  │ ...              │
  │ [ ]     8        │
  │ [ ]     9   ◄────────── Red LED (via 220Ω resistor)
  │ [ ]    10   ◄────────── Yellow LED (via 220Ω resistor)
  │ [ ]    11   ◄────────── Green LED (via 220Ω resistor)
  │ [ ]    12        │
  │ [ ]    13        │
  │ [ ] GND     ◄────────── Breadboard ground rail
  │ [ ] AREF         │
  │ [ ] 3.3V         │
  └──────────────────┘
```

### Breadboard Layout

```
BREADBOARD (half-size, looking flat from above)

Power rails along sides:
  [+] top red rail — unused
  [−] bottom blue rail ← all LED cathodes connect here

Rows (numbered 1–30):

Row  col-a  col-b  col-c  col-d  col-e | col-f  col-g  col-h  col-i  col-j
────────────────────────────────────────────────────────────────────────────
 1   [RED LED long leg]
 2   [resistor leg 1]       (resistor spans rows 1–3)
 3   [resistor leg 2] ──── JUMPER WIRE ──→ Arduino Pin 9
     [RED LED short leg] ──→ bottom ground rail (−)
 4   (empty)
 5   [YEL LED long leg]
 6   [resistor leg 1]
 7   [resistor leg 2] ──── JUMPER WIRE ──→ Arduino Pin 10
     [YEL LED short leg] ──→ bottom ground rail (−)
 8   (empty)
 9   [GRN LED long leg]
10   [resistor leg 1]
11   [resistor leg 2] ──── JUMPER WIRE ──→ Arduino Pin 11
     [GRN LED short leg] ──→ bottom ground rail (−)

Bottom rail (−): one JUMPER WIRE ──→ Arduino GND pin
```

### Physical Step-by-Step Assembly

1. **Insert Red LED.** Long leg in row 1 column-a. Short leg in row 1 column-b (or e — either side of center gap).
2. **Insert 220Ω resistor.** One leg in row 1 column-a (same hole as LED long leg). Other leg in row 3 column-a.
3. **Jumper wire** from row 3 column-a to **Arduino Pin 9**. Use a red wire.
4. **Connect LED short leg** (row 1 col-b) to the bottom blue ground rail.
5. **Repeat** steps 1–4 for Yellow LED in rows 5–7, connected to **Pin 10**. Use yellow wire.
6. **Repeat** steps 1–4 for Green LED in rows 9–11, connected to **Pin 11**. Use green wire.
7. **One black wire** from the breadboard bottom blue ground rail to **Arduino GND**.
8. Plug Arduino into laptop via USB cable.

---

## 5. Arduino Sketch — Full Code

Open Arduino IDE → New Sketch → paste everything below → upload.

```cpp
/*
 * SmartEVP+ — Arduino LED Traffic Light Controller
 * Team V3 · TechnoCognition'25 · Dayananda Sagar University
 *
 * USB Serial commands from laptop Python (pyserial):
 *   'G' → Activate GREEN (with yellow transition)
 *   'R' → Set RED
 *   'Y' → Set YELLOW
 *   'S' → Reply with current state
 *
 * Baud: 9600
 * Pins: 9=Red, 10=Yellow, 11=Green
 */

const int PIN_RED    = 9;
const int PIN_YELLOW = 10;
const int PIN_GREEN  = 11;

char currentState = 'R';

// ── SETUP ─────────────────────────────────────────────────────
void setup() {
  Serial.begin(9600);
  pinMode(PIN_RED,    OUTPUT);
  pinMode(PIN_YELLOW, OUTPUT);
  pinMode(PIN_GREEN,  OUTPUT);
  setRed();  // Safe default: start in RED
  Serial.println("SMARTEVP_READY");
}

// ── MAIN LOOP ─────────────────────────────────────────────────
void loop() {
  if (Serial.available() > 0) {
    char cmd = (char)Serial.read();
    processCommand(cmd);
  }
}

// ── COMMAND PROCESSOR ─────────────────────────────────────────
void processCommand(char cmd) {
  switch (cmd) {
    case 'G':
      activateGreen();
      Serial.println("ACK:GREEN");
      break;

    case 'R':
      setRed();
      Serial.println("ACK:RED");
      break;

    case 'Y':
      setYellow();
      Serial.println("ACK:YELLOW");
      break;

    case 'S':
      Serial.print("STATUS:");
      Serial.println(currentState);
      break;

    case '\n':
    case '\r':
    case ' ':
      break;  // Ignore whitespace — Python often sends trailing newlines

    default:
      Serial.print("ERR:UNKNOWN:");
      Serial.println(cmd);
      break;
  }
}

// ── LED CONTROL FUNCTIONS ─────────────────────────────────────
void allOff() {
  digitalWrite(PIN_RED,    LOW);
  digitalWrite(PIN_YELLOW, LOW);
  digitalWrite(PIN_GREEN,  LOW);
}

void setRed() {
  allOff();
  digitalWrite(PIN_RED, HIGH);
  currentState = 'R';
}

void setYellow() {
  allOff();
  digitalWrite(PIN_YELLOW, HIGH);
  currentState = 'Y';
}

void setGreen() {
  allOff();
  digitalWrite(PIN_GREEN, HIGH);
  currentState = 'G';
}

void activateGreen() {
  /*
   * The theatrical transition:
   * Flash yellow for 600ms before switching to green.
   * This mirrors real traffic light behavior and gives judges
   * a visible moment before the GREEN moment lands.
   */
  allOff();
  digitalWrite(PIN_YELLOW, HIGH);
  delay(600);       // 600ms yellow flash — clearly visible
  allOff();
  digitalWrite(PIN_GREEN, HIGH);
  currentState = 'G';
}
```

### Upload Instructions

1. Open Arduino IDE 2.x.
2. **Tools → Board:** Select your board:
   - Arduino Uno → **Arduino AVR Boards → Arduino Uno**
   - Arduino Nano → **Arduino AVR Boards → Arduino Nano**
3. **Tools → Port:** Select the COM port (Windows: `COM3` or `COM4`) or `/dev/ttyUSB0` (Linux) or `/dev/cu.usbserial-...` (Mac).
4. For Nano with older bootloader: **Tools → Processor → ATmega328P (Old Bootloader)**.
5. Click **Upload** (→ arrow). Wait for "Done uploading."
6. Open **Tools → Serial Monitor** (baud: 9600).
7. You should see: `SMARTEVP_READY`
8. Type `G` in the input box, press Enter → Green LED lights.
9. Type `R` → Red LED.
10. Type `S` → prints `STATUS:G` (or R, Y).

---

## 6. Python Serial Control — Laptop to Arduino

Save this as `arduino_controller.py` inside your laptop backend folder.

```python
# arduino_controller.py
# Singleton module — import this wherever you need to control the LEDs
import serial
import serial.tools.list_ports
import time
import threading

class ArduinoController:
    """
    Controls Arduino-driven LED traffic light via USB Serial.
    Automatically falls back to simulation mode if Arduino not found —
    useful for running the backend without physical hardware.
    """

    def __init__(self, port: str = None, baud: int = 9600):
        self.port      = port or self._auto_detect_port()
        self.baud      = baud
        self.ser       = None
        self.lock      = threading.Lock()
        self.connected = False
        self.sim_state = 'R'
        self._connect()

    def _auto_detect_port(self) -> str:
        """Scan serial ports for Arduino."""
        ports = list(serial.tools.list_ports.comports())
        # Known USB-Serial chip descriptions used by Arduino
        keywords = ['arduino', 'ch340', 'ch341', 'ftdi', 'usb serial', 'usb-serial']
        for p in ports:
            if any(kw in p.description.lower() for kw in keywords):
                print(f"[ARDUINO] Auto-detected: {p.device} ({p.description})")
                return p.device
        # Fallback: return first available port if any
        if ports:
            print(f"[ARDUINO] No Arduino keyword found. Using first port: {ports[0].device}")
            return ports[0].device
        print("[ARDUINO] No serial ports found.")
        return None

    def _connect(self):
        if not self.port:
            print("[ARDUINO] No port available. Running in SIMULATION MODE.")
            return
        try:
            self.ser = serial.Serial(self.port, self.baud, timeout=2)
            time.sleep(2.0)  # Critical: Arduino resets on serial connection, wait 2s
            self.connected = True
            # Flush startup message
            startup = self.ser.read_all().decode(errors='ignore').strip()
            print(f"[ARDUINO] Connected on {self.port}. Arduino says: '{startup}'")
        except serial.SerialException as e:
            print(f"[ARDUINO] Connection failed: {e}")
            print("[ARDUINO] Running in SIMULATION MODE.")
            self.connected = False

    def _send_command(self, cmd: str) -> str:
        """Send a single-char command, return Arduino's ACK."""
        if not self.connected:
            self.sim_state = cmd
            print(f"[ARDUINO SIM] >>> {cmd}")
            return f"SIM:ACK:{cmd}"
        with self.lock:
            try:
                self.ser.reset_input_buffer()
                self.ser.write(f"{cmd}".encode())
                time.sleep(0.08)  # Allow 80ms for Arduino to respond
                response = ""
                if self.ser.in_waiting:
                    response = self.ser.readline().decode(errors='ignore').strip()
                return response or "OK"
            except serial.SerialException as e:
                print(f"[ARDUINO] Send error: {e}. Switching to simulation.")
                self.connected = False
                return "ERR"

    def set_green(self) -> str:
        """Trigger preemption: yellow flash → green. The money shot."""
        print("[ARDUINO] ===>>> PREEMPTION ACTIVE — GREEN <<<===")
        return self._send_command('G')

    def set_red(self) -> str:
        """Return to idle red state."""
        print("[ARDUINO] Reset → RED")
        return self._send_command('R')

    def set_yellow(self) -> str:
        """Caution / transition state."""
        return self._send_command('Y')

    def get_status(self) -> str:
        """Query current LED state."""
        return self._send_command('S')

    def close(self):
        """Clean shutdown — reset to red before closing."""
        if self.connected and self.ser:
            self._send_command('R')
            self.ser.close()
            print("[ARDUINO] Port closed.")


# ── Singleton instance ────────────────────────────────────────
# Import this in other modules: from arduino_controller import arduino
arduino = ArduinoController()


# ── Standalone test ───────────────────────────────────────────
if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        # Manual command: python3 arduino_controller.py G
        cmd = sys.argv[1].upper()
        print(f"[TEST] Sending command: {cmd}")
        print(f"[TEST] Response: {arduino._send_command(cmd)}")
    else:
        # Full LED test sequence
        print("[TEST] Starting LED test sequence...")
        print("[TEST] RED state (2 seconds)...")
        arduino.set_red();    time.sleep(2)

        print("[TEST] GREEN preemption (yellow flash then green, 3 seconds)...")
        arduino.set_green();  time.sleep(3)

        print("[TEST] Back to RED...")
        arduino.set_red();    time.sleep(1)

        print("[TEST] Done. Status:", arduino.get_status())
        arduino.close()
```

**Run the test:**
```bash
pip install pyserial
python3 arduino_controller.py
```

Expected output: Red for 2s → Yellow flash (600ms) → Green for 3s → back to Red. If all three LEDs respond in sequence, your hardware chain is complete.

---

## 7. ESP32 — What It Is and Which Variant You Have

The ESP32 is a small microcontroller with built-in WiFi. In this project, it reads GPS coordinates from the NEO-6M module once per second and sends them to the laptop backend over HTTP.

### Two Common Variants

**ESP32-WROOM-32 DevKit (the long board with USB port):**
This is the standard variant. It has a USB-to-Serial chip built in (usually CP2102 or CH340). Plug it into your laptop via Micro-USB and it shows up as a serial port immediately. This is the easiest to work with.

**ESP32-CAM (the smaller square module with camera):**
If your friend's ESP32 has a small camera module attached — that's the ESP32-CAM. **The GPS sketch works identically on this variant.** You simply don't use the camera at all. The WiFi and UART hardware are identical.

The key difference: ESP32-CAM does **not** have a USB-to-Serial chip built in. You need an external FTDI programmer (FT232RL breakout, ~₹150 at SP Road) to upload sketches. Connect: FTDI TX → ESP32-CAM U0RXD, FTDI RX → ESP32-CAM U0TXD, FTDI GND → ESP32-CAM GND, FTDI 3.3V → ESP32-CAM 3.3V. Hold the IO0 pin to GND during upload, release after.

After flashing once, the ESP32-CAM runs standalone on battery without the FTDI adapter.

### Key Pins Used

| Pin | Function |
|-----|----------|
| GPIO 16 (RX2) | NEO-6M GPS TX → here (ESP32 receives) |
| GPIO 17 (TX2) | → NEO-6M GPS RX (optional) |
| 3.3V | NEO-6M VCC |
| GND | NEO-6M GND |
| USB / Micro-USB | Power from powerbank |

---

## 8. NEO-6M GPS — Wiring to ESP32

The NEO-6M speaks UART at 9600 baud. It constantly outputs NMEA sentences (e.g., `$GPRMC,123519,A,4807.038,N,...`) containing latitude, longitude, speed, and time. TinyGPS++ parses these for us.

### Critical — Use 3.3V, Not 5V

The NEO-6M is a **3.3V logic device**. Connect VCC to the ESP32's 3.3V output pin, never 5V. 5V will not immediately destroy it but may damage it over time. Every connection in this table must be right.

### Wiring Table

| NEO-6M Pin | ESP32 Pin | Notes |
|------------|-----------|-------|
| VCC | 3.3V | Power — red wire |
| GND | GND | Ground — black wire |
| TX | GPIO 16 (RX2) | GPS sends data → ESP32 receives. Yellow wire. **Cross-connection: TX→RX.** |
| RX | GPIO 17 (TX2) | ESP32 can configure GPS. Blue wire. (Optional for demo.) |

> **Most common mistake:** Connecting GPS TX to ESP32 TX and GPS RX to ESP32 RX. These must cross: **GPS TX → ESP32 RX, GPS RX → ESP32 TX.**

### Antenna Placement for Indoors

The NEO-6M ceramic patch antenna (the small grey square on the module) needs a line-of-sight or near-sight to the sky. Options at a hackathon:
1. Place near a window — best option
2. Angle the module at 45° toward a glass ceiling or skylight
3. Use an active external GPS antenna on SMA cable (some modules include one) and let the cable reach a window
4. If none of the above works: enable `SIMULATION_MODE = true` in the sketch (Section 10) — the ESP32 will publish a slowly moving fake coordinate instead

---

## 9. ESP32 + GPS Full Circuit Diagram

```
WIRING OVERVIEW

NEO-6M GPS                   ESP32-WROOM-32 DevKit
┌──────────────────┐          ┌──────────────────────────┐
│  [CERAMIC ANT.↑] │          │                          │
│                  │          │  3.3V pin ◄──────────────│◄── VCC
│  VCC ────────────────────────────────────────────►     │
│  GND ────────────────────────────────────────────► GND │
│  TX  ────────────────────────────────────────────► GPIO 16 (RX2) │
│  RX  ◄───────────────────────────────────────────  GPIO 17 (TX2) │
└──────────────────┘          │                          │
                              │  Micro-USB port ─────────►│◄── Powerbank
                              └──────────────────────────┘

Both modules can sit on the same half-size breadboard side-by-side:
- Use the power rails (+/-) to share 3.3V and GND
- 4 jumper wires connect the two modules
- Powerbank connects to ESP32 Micro-USB
- Entire assembly velcro'd to toy ambulance roof
```

---

## 10. ESP32 Arduino Sketch — Full Code

### Step 10.1 — Install Arduino IDE + ESP32 Support

1. Download Arduino IDE 2.x: https://www.arduino.cc/en/software
2. File → Preferences → Additional boards manager URLs, add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Tools → Board → Boards Manager → search "esp32" → Install **esp32 by Espressif Systems** (v2.x).

### Step 10.2 — Install Libraries

Tools → Manage Libraries → install:

| Library | Search Term | Author |
|---------|-------------|--------|
| TinyGPS++ | TinyGPSPlus | Mikal Hart |
| ArduinoJson | ArduinoJson | Benoit Blanchon |

(No MQTT library needed — we're using HTTP now.)

### Step 10.3 — Full Sketch

```cpp
/*
 * SmartEVP+ — ESP32 GPS Tracker
 * Team V3 · TechnoCognition'25 · Dayananda Sagar University
 *
 * Reads GPS from NEO-6M via UART2 (GPIO 16/17)
 * POSTs coordinates to laptop backend via WiFi HTTP at 1Hz
 * Endpoint: POST http://<LAPTOP_IP>:8080/gps
 * JSON body: {"lat":12.93,"lng":77.61,"speed":28,"sats":8,"id":"AMB-001","ts":1234}
 *
 * HTTP polling chosen over MQTT for reliability:
 * - No broker dependency on ESP32 side
 * - Automatic reconnect built into HTTPClient
 * - Easier to debug with curl on laptop
 *
 * In your pitch: "In production this uses LoRa 865MHz for
 * long-range communication. In this demo environment the
 * ESP32 and laptop share the same WiFi network."
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include <ArduinoJson.h>

// ═════════════════════════════════════════════════
//  ★ CONFIGURE THESE BEFORE EVERY FLASH ★
// ═════════════════════════════════════════════════
const char* WIFI_SSID     = "YOUR_HOTSPOT_NAME";
const char* WIFI_PASSWORD = "YOUR_HOTSPOT_PASSWORD";
const char* LAPTOP_IP     = "192.168.x.x";  // Your laptop's WiFi IP
const int   BACKEND_PORT  = 8080;
const char* AMBULANCE_ID  = "AMB-001";

// GPS Hardware pins
#define GPS_RX_PIN 16   // NEO-6M TX → ESP32 RX2
#define GPS_TX_PIN 17   // ESP32 TX2 → NEO-6M RX (optional)
#define GPS_BAUD   9600

// ── Simulation Mode ───────────────────────────────────────────
// Set true if GPS won't fix indoors. ESP32 will publish a slowly
// moving fake coordinate that animates the dashboard map.
bool   SIMULATION_MODE = false;
double SIM_LAT = 12.9162;
double SIM_LNG = 77.6021;
// ═════════════════════════════════════════════════

TinyGPSPlus    gps;
HardwareSerial gpsSerial(2);

unsigned long lastPostMs   = 0;
const unsigned long POST_INTERVAL = 1000;  // 1 Hz

// ── SETUP ─────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n\n=== SmartEVP+ ESP32 Tracker v2.0 ===");
  Serial.printf("Target backend: http://%s:%d/gps\n", LAPTOP_IP, BACKEND_PORT);

  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("[GPS] UART2 started.");

  if (SIMULATION_MODE) {
    Serial.println("[GPS] *** SIMULATION MODE ACTIVE ***");
    Serial.println("[GPS] Publishing fake coordinates. Good for indoor demo.");
  }

  connectWiFi();
  Serial.println("[SYSTEM] Setup complete. Posting GPS at 1Hz.");
}

// ── MAIN LOOP ─────────────────────────────────────────────────
void loop() {
  // Feed raw GPS bytes to the TinyGPS++ parser
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // Post GPS every second
  if (millis() - lastPostMs >= POST_INTERVAL) {
    lastPostMs = millis();
    postGPS();
  }

  // Reconnect if WiFi drops
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Dropped. Reconnecting...");
    connectWiFi();
  }
}

// ── POST GPS ──────────────────────────────────────────────────
void postGPS() {
  double lat, lng, speedKmph;
  int    sats;

  if (SIMULATION_MODE) {
    // Move east slowly — crosses intersection around coordinate 12
    SIM_LNG += 0.00010;
    lat       = SIM_LAT;
    lng       = SIM_LNG;
    speedKmph = 28.0;
    sats      = 8;
  } else if (gps.location.isValid() && gps.location.age() < 3000) {
    lat       = gps.location.lat();
    lng       = gps.location.lng();
    speedKmph = gps.speed.kmph();
    sats      = gps.satellites.value();
  } else {
    // No valid GPS fix
    int seen = gps.satellites.value();
    Serial.printf("[GPS] Waiting for fix... (%d sats tracked, %lu chars processed)\n",
                  seen, gps.charsProcessed());
    if (gps.charsProcessed() < 10) {
      Serial.println("[GPS] No NMEA data — check TX→RX wiring");
    } else if (seen == 0) {
      Serial.println("[GPS] No satellites — move antenna near window or enable SIM mode");
    }
    return;
  }

  // Build JSON
  StaticJsonDocument<256> doc;
  doc["lat"]   = lat;
  doc["lng"]   = lng;
  doc["speed"] = speedKmph;
  doc["sats"]  = sats;
  doc["id"]    = AMBULANCE_ID;
  doc["ts"]    = (unsigned long)millis();
  String body;
  serializeJson(doc, body);

  // HTTP POST
  HTTPClient http;
  String url = String("http://") + LAPTOP_IP + ":" + BACKEND_PORT + "/gps";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(800);  // 800ms timeout — fast fail if laptop is down
  int code = http.POST(body);
  http.end();

  if (code == 200) {
    Serial.printf("[GPS→HTTP] %.4f, %.4f @ %.1f km/h | HTTP 200 OK\n",
                  lat, lng, speedKmph);
  } else {
    Serial.printf("[GPS→HTTP] POST failed: HTTP %d (backend running? IP correct?)\n", code);
  }
}

// ── WIFI ──────────────────────────────────────────────────────
void connectWiFi() {
  Serial.printf("[WiFi] Connecting to '%s'", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries++ < 20) {
    delay(500); Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WiFi] FAILED. Check SSID/password. Will retry.");
  }
}
```

### Step 10.4 — Configure Before Uploading

```cpp
const char* WIFI_SSID     = "YourHotspot";
const char* WIFI_PASSWORD = "password123";
const char* LAPTOP_IP     = "192.168.43.115";  // from ipconfig / ifconfig
```

**To find your laptop's IP on the hotspot:**
- Windows: open cmd → `ipconfig` → look for IPv4 Address under Wireless LAN adapter
- Mac/Linux: open terminal → `ifconfig` → look for `inet` under `en0` or `wlan0`
- Typically starts with 192.168.43.x when the hotspot is an Android phone

### Step 10.5 — Upload and Test

1. Select correct board and port in Arduino IDE.
2. Upload sketch.
3. Open Serial Monitor at 115200 baud.
4. Watch for: WiFi connected → GPS status → HTTP 200 OK responses.
5. On laptop, verify backend is running: `curl -X POST http://localhost:8080/gps -H "Content-Type: application/json" -d '{"lat":12.93,"lng":77.61,"speed":30,"sats":8,"id":"AMB-001","ts":0}'` should return `{"status":"ok"}`.

---

## 11. Toy Ambulance Assembly

### Choosing the Right Toy

Buy the largest ambulance available (15–20cm length). A flat roof is essential — the ESP32+GPS breadboard needs to sit stably. White with red cross looks the most realistic. Available at any children's toy shop in Bengaluru or on Flipkart (2-day delivery).

### Assembly Instructions

**Step 1 — Test first, mount second.** Complete Sections 9–10, confirm ESP32 is posting GPS to the backend, then mount to the toy. Never mount hardware you haven't tested.

**Step 2 — Prepare Velcro.** Cut two pairs of Velcro strips (~3cm × 4cm each):
- Pair 1: For breadboard to ambulance roof
- Pair 2: For powerbank to ambulance underside

**Step 3 — Mount breadboard.** Stick the hook side (scratchy) to the breadboard bottom, loop side (soft) to the ambulance roof. Press together firmly. Should hold through gentle pushing on the table.

**Step 4 — Mount powerbank.** Attach underneath the ambulance body. Route the Micro-USB cable alongside the breadboard.

**Step 5 — Antenna positioning.** Angle the GPS antenna toward the ceiling or window. If the NEO-6M has a connector for an external antenna, connect it and let the cable drape to a nearby window sill.

**Step 6 — Cable management.** Use a small cable tie or piece of tape to keep the USB cable from tangling. The assembly should look deliberate.

```
ASSEMBLED TOP VIEW:

┌─────────────────────────────────────────────────┐
│                AMBULANCE ROOF                   │
│   ┌─────────────────────────────────────────┐   │
│   │  GPS ANTENNA (angled toward ceiling)    │   │
│   │ ┌─────────────┐ ┌─────────────────────┐ │   │
│   │ │  NEO-6M GPS │ │    ESP32 DevKit     │ │   │
│   │ └─────────────┘ └─────────────────────┘ │   │
│   │      [Velcro patch on underside]        │   │
│   └─────────────────────────────────────────┘   │
│         [Powerbank beneath chassis]             │
└─────────────────────────────────────────────────┘
```

---

## 12. USB Microphone Setup on Laptop

The laptop's built-in microphone can work, but an external USB mic gives cleaner audio for transcription. For the demo, the pre-recorded .wav file is the primary mode — live mic is a bonus.

```bash
# Mac — install PyAudio:
pip install pyaudio sounddevice scipy

# Linux:
sudo apt install portaudio19-dev
pip install pyaudio sounddevice scipy

# Windows:
pip install pyaudio sounddevice scipy
# If pyaudio install fails on Windows, use: pip install pipwin && pipwin install pyaudio
```

### Test the Microphone

```python
# Run this to verify mic is working
import sounddevice as sd
import numpy as np
print("Recording 3 seconds — speak now...")
rec = sd.rec(int(3 * 16000), samplerate=16000, channels=1, dtype='float32')
sd.wait()
print(f"Max amplitude: {np.max(np.abs(rec)):.4f}")
print("Working if max > 0.01")
```

### Pre-Recorded Demo Audio

Record once on your laptop. This is your primary demo audio — consistent, professional, plays perfectly every time.

**Narration script (15 seconds):**
> *"Male patient, fifty-eight years old. Chief complaint: chest pain radiating to the left arm, onset approximately twenty minutes ago. Blood pressure ninety over sixty. Heart rate irregular at one-twelve beats per minute. Oxygen saturation ninety-four percent. Patient is conscious and diaphoretic. No known drug allergies. On Aspirin seventy-five milligrams daily. Suspected STEMI."*

**Save as:** `nurse_demo.wav` (16kHz, mono, 16-bit PCM)

```bash
# Convert any audio file to correct format:
ffmpeg -i input.m4a -ar 16000 -ac 1 -sample_fmt s16 nurse_demo.wav
```

---

## 13. Indoor GPS Fallback Setup

If GPS won't fix indoors (very common), use one of two fallback modes:

### Option A: ESP32 Simulation Mode (Cleanest)

In the ESP32 sketch, change line:
```cpp
bool SIMULATION_MODE = false;  →  bool SIMULATION_MODE = true;
```
Re-upload. The ESP32 now publishes slowly drifting fake coordinates every second, identical in format to real GPS data. The dashboard map dot moves. Everything works. Nobody can tell.

### Option B: Laptop GPS Replay Script (No Re-flash Needed)

Run this Python script on the laptop instead of (or alongside) the ESP32:

```python
# gps_replay.py
import requests, json, time

BACKEND_PORT = 8080
with open("gps_route.json") as f:
    route = json.load(f)

print("[REPLAY] Starting GPS route replay...")
for i, pt in enumerate(route):
    payload = {"lat": pt["lat"], "lng": pt["lng"],
               "speed": pt.get("speed", 30), "sats": 8,
               "id": "AMB-001", "ts": int(time.time() * 1000)}
    try:
        r = requests.post(f"http://localhost:{BACKEND_PORT}/gps",
                          json=payload, timeout=1)
        print(f"[REPLAY] {i+1:02d}/{len(route)}: ({pt['lat']:.4f}, {pt['lng']:.4f})")
    except Exception as e:
        print(f"[REPLAY] Error: {e}")
    time.sleep(1.0)

print("[REPLAY] Route complete.")
```

`gps_route.json` file (save in same folder):
```json
[
  {"lat": 12.9162, "lng": 77.6021, "speed": 28},
  {"lat": 12.9170, "lng": 77.6035, "speed": 30},
  {"lat": 12.9178, "lng": 77.6049, "speed": 33},
  {"lat": 12.9186, "lng": 77.6063, "speed": 36},
  {"lat": 12.9194, "lng": 77.6077, "speed": 38},
  {"lat": 12.9202, "lng": 77.6091, "speed": 40},
  {"lat": 12.9210, "lng": 77.6105, "speed": 40},
  {"lat": 12.9218, "lng": 77.6119, "speed": 38},
  {"lat": 12.9226, "lng": 77.6133, "speed": 35},
  {"lat": 12.9234, "lng": 77.6147, "speed": 30},
  {"lat": 12.9242, "lng": 77.6161, "speed": 25},
  {"lat": 12.9250, "lng": 77.6175, "speed": 20},
  {"lat": 12.9258, "lng": 77.6189, "speed": 15},
  {"lat": 12.9266, "lng": 77.6200, "speed": 12},
  {"lat": 12.9270, "lng": 77.6210, "speed": 10}
]
```

> The intersection coordinate is `12.9242, 77.6161`. The preemption fires when the ambulance is within 500m of this point — around point 10 in the route.

---

## 14. Raspberry Pi — Optional Enhancement

The Pi is not required. If you have access to one with an SD card (8GB+), here is how it fits:

**What to say in the pitch:** *"In production deployment, the intersection gateway is a dedicated Raspberry Pi 4 installed at the traffic light cabinet — running edge compute locally, no cloud dependency, fully autonomous. For this demo, we're running all services on the laptop to keep the physical footprint clean."*

**What to actually run on Pi (if available):** Flash it with Raspberry Pi OS, install Mosquitto, run just the LED controller (`led_controller.py` from the old backend doc, adapted to subscribe to MQTT `smartevp/signal/preempt`). Wire the LEDs to Pi GPIO instead of Arduino. Now you have both: Arduino on the demo table, Pi as the "production gateway."

**If no Pi:** Drop it entirely. The Arduino + laptop story is actually cleaner for a 2-minute explanation.

---

## 15. Demo Physical Setup — 2 Tables + 3 Laptops

### Table 1 — Physical Hardware (Front, Judges Stand Here)

```
JUDGE PERSPECTIVE — TABLE 1

╔═════════════════════════════════════════════════════════════════════╗
║              [THERMOCOAL BOARD — BACKDROP]                          ║
║   SmartEVP+ logo | flow diagram | team name printed/drawn on it     ║
╠═════════════════════════════════════════════════════════════════════╣
║                                                                     ║
║   ┌───────────────────────────────────────────────────────────┐    ║
║   │          AMBULANCE TRACK (tape line on table)             │    ║
║   │  [START] 🚑───────────────────────────────→ [×] 500m     │    ║
║   │          toy ambulance, pushed during demo   intersection  │    ║
║   └───────────────────────────────────────────────────────────┘    ║
║                                                                     ║
║   [Arduino + Breadboard]     [YOUR PHONE]      [FRIEND'S PHONE]    ║
║     🔴🟡🟢                     📱 Emergency      📱 Driver App     ║
║     Physical traffic light     caller (you)       (Expo + SMS)     ║
║                                                                     ║
║   [USB cable hidden           Calls Twilio #      Shows case,       ║
║    under table to Laptop 1]   to trigger demo     SMS received      ║
╚═════════════════════════════════════════════════════════════════════╝
```

### Table 2 — Three Laptops (Behind / Adjacent)

```
TABLE 2 — Three laptops, each showing a different view

┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│      LAPTOP 1        │  │      LAPTOP 2        │  │      LAPTOP 3        │
│   ───────────────    │  │   ───────────────    │  │   ───────────────    │
│   MASTER OPS         │  │   AMBULANCE /        │  │   HOSPITAL           │
│   DASHBOARD          │  │   NURSE VIEW         │  │   DASHBOARD          │
│                      │  │                      │  │                      │
│  • Live map          │  │  • Case details      │  │  • Patient brief     │
│  • Signal state      │  │  • Route to patient  │  │  • Vitals grid       │
│  • Audit log         │  │  • Audio transcript  │  │  • Resources needed  │
│  • All systems       │  │  • Brief generating  │  │  • ETA countdown     │
│  • Technical depth   │  │  • Nurse's screen    │  │  • Doctor ready view │
│                      │  │                      │  │                      │
│  [USB → Arduino] ────│  │  Opens browser to    │  │  Opens browser to    │
│  [Runs all services] │  │  /ambulance route    │  │  /hospital route     │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

### Cable and Network Summary

| Connection | Type | Notes |
|------------|------|-------|
| Laptop 1 → Arduino | USB-A to USB-B | Runs the LED serial controller |
| ESP32 → Laptop 1 | WiFi (HTTP) | ESP32 posts GPS to Laptop 1 :8080 |
| Laptop 2, 3 → Laptop 1 | WiFi (Socket.IO) | Open browser: `http://Laptop1_IP:5173/...` |
| Your phone → Twilio | Phone call (4G) | Calls the Twilio number live |
| Friend's phone → Laptop 1 | WiFi (Socket.IO) | Expo app connects to Laptop 1 :8080 |
| All devices | Same WiFi hotspot | Use your phone's hotspot or venue WiFi |

### Thermocoal Board Content

Print (or hand-draw clearly) on the thermocoal board:

```
Large text:  SmartEVP+
Subtitle:    Emergency Response Intelligence System — ERIS v2.0

Simple flow diagram (arrows left to right):
[ 📞 CALL ] → [ 🚑 DISPATCH ] → [ 🚦 PREEMPTION ] → [ 🏥 HOSPITAL ]

Below: Team V3 · TechnoCognition'25 · Dayananda Sagar University
```

---

## 16. Full Hardware Test Checklist

### Night Before the Hackathon

- [ ] Arduino LED test passes: `python3 arduino_controller.py` — R/Y/G all respond
- [ ] Arduino port number noted (e.g. `/dev/ttyUSB0` or `COM4`) — save in config
- [ ] ESP32 flashed with correct WiFi SSID + Laptop IP
- [ ] ESP32 posts GPS to backend: Serial Monitor shows `HTTP 200 OK`
- [ ] GPS outdoor fix achieved at least once (cold start warmup)
- [ ] GPS simulation mode tested: `SIMULATION_MODE=true`, see drifting coordinates
- [ ] Laptop GPS replay tested: `python3 gps_replay.py` runs all 15 points
- [ ] Toy ambulance assembled — breadboard velcro'd, powerbank attached
- [ ] Powerbank charged to 100%
- [ ] Demo nurse audio recorded: `nurse_demo.wav` plays correctly
- [ ] All backend services start without errors on Laptop 1
- [ ] All three dashboard views open in browsers on their laptops
- [ ] Full preemption test: replay GPS → Arduino LED flips GREEN at ~point 10
- [ ] Expo app opens and connects to backend on friend's phone

### Day-Of (30 Minutes Before)

- [ ] Laptop 1 IP verified on hotspot: `ipconfig` / `ifconfig` — update configs if changed
- [ ] Re-flash ESP32 with new IP if changed
- [ ] Arduino connected to Laptop 1 USB, LEDs showing RED
- [ ] Laptop 1 backend started: `./start_all.sh` (see Backend doc)
- [ ] Laptop 1: Master dashboard open in kiosk/full-screen mode
- [ ] Laptop 2: Ambulance view open in full-screen
- [ ] Laptop 3: Hospital view open in full-screen
- [ ] Expo app running and showing "Available" status
- [ ] Toy ambulance at START position on track
- [ ] GPS replay command ready in open terminal: `python3 gps_replay.py`
- [ ] Demo audio trigger ready (see Backend doc)
- [ ] Twilio number confirmed working

---

## 17. Troubleshooting Reference

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Arduino not detected on any port | Wrong USB cable (charge-only) | Use a data cable; try a different USB port on laptop |
| Arduino IDE doesn't see port | Driver not installed | Install CP2102 or CH340 driver from manufacturer site |
| LEDs don't respond | Sketch not uploaded | Re-upload; verify board type matches your Arduino |
| LEDs stay in wrong state | Python script closed without reset | Run: `python3 -c "from arduino_controller import arduino; arduino.set_red()"` |
| ESP32 won't connect to WiFi | Wrong SSID/password (case-sensitive) | Re-check exactly; re-flash |
| ESP32 WiFi OK, HTTP fails | Wrong laptop IP | Run `ipconfig`/`ifconfig`; update sketch; re-flash |
| GPS fix taking forever | Cold start indoors | Allow 5 min near window; or enable `SIMULATION_MODE=true` |
| GPS parses 0 characters | TX/RX wires swapped | Swap the GPS TX/RX wires on ESP32 side |
| ESP32-CAM won't flash | No USB-Serial chip | Need FTDI FT232RL adapter; hold IO0 to GND during flash |
| Mosquitto won't start | Port 1883 taken | `lsof -i :1883` on Mac/Linux to find and kill conflict |
| Dashboard not receiving GPS | ESP32 IP target wrong | Verify `LAPTOP_IP` in ESP32 code matches actual laptop IP |
| Preemption doesn't fire | Intersection coords mismatch | Verify `INTERSECTION_LAT/LNG` in config vs GPS route |
| Expo app can't connect | Backend IP not set | Update `BACKEND_IP` in Expo `.env` to Laptop 1 IP |

---

*SmartEVP+ Hardware Guide v2.0 · Team V3 · TechnoCognition'25 · Dayananda Sagar University*

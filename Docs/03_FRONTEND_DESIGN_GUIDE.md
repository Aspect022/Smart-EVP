# SmartEVP+ — Frontend & UI/UX Design Guide
### Team V3 · TechnoCognition'25 · Dayananda Sagar University

> **Audience:** The frontend engineer and the whole team. This document covers both the *what to build* and *how it should look and feel* — the visual language, interaction design, animation philosophy, component architecture, and everything needed to produce a dashboard and landing page that judges remember.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Design Language — Motifs and Patterns](#4-design-language--motifs-and-patterns)
5. [What to Build (Page Inventory)](#5-what-to-build-page-inventory)
6. [Page 1: Landing Page — Architecture & Ideas](#6-page-1-landing-page--architecture--ideas)
7. [Page 2: Master Operations Dashboard](#7-page-2-master-operations-dashboard)
8. [Page 3: Hospital Readiness Screen](#8-page-3-hospital-readiness-screen)
9. [Animation Blueprint](#9-animation-blueprint)
10. [Component Architecture (React)](#10-component-architecture-react)
11. [Real-Time Data Wiring (Socket.IO)](#11-real-time-data-wiring-socketio)
12. [Tech Stack and Setup](#12-tech-stack-and-setup)
13. [Build Priority Order](#13-build-priority-order)
14. [UI Copy & Microcopy](#14-ui-copy--microcopy)
15. [Judge-Facing Design Tips](#15-judge-facing-design-tips)

---

## 1. Design Philosophy

This product saves lives. The UI needs to feel like it belongs in that context — not a student hackathon project, not a SaaS dashboard, not a data analytics tool. It should feel like something that *does exist* in a critical operations center.

**Three design principles to carry throughout every screen:**

**1. Information at a glance.** Operators in emergencies don't read. They scan. Every critical data point (signal state, ambulance position, case severity) needs to be readable from 3 meters away. Big numbers. High contrast. Color that means something.

**2. Calm under pressure.** The UI should feel controlled, precise, clinical. Not flashy. Animations should be purposeful — they mark state changes, not decorate. The dark background isn't aesthetic; it's what control rooms use because it reduces eye strain during long shifts.

**3. Theatrical for the demo.** Yes, this is a hackathon. Judges *will* respond emotionally to things that move, flash, and update live. Build for that moment. The LED flip at T=35s is physical — the dashboard should mirror it with equal drama: a full signal status takeover animation, a siren-red-to-green wash across the panel.

---

## 2. Color System

These are locked. Use exactly these values. They come from the original documentation HTML and are calibrated to work together.

### Core Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#080b12` | Page background |
| `--bg2` | `#0d1117` | Slightly lighter panels |
| `--bg3` | `#111620` | Card backgrounds |
| `--card` | `#131924` | Primary card surface |
| `--border` | `#1e2838` | Default borders |
| `--border2` | `#243044` | Hover / active borders |

### Semantic Colors (The Four Signals)

| Token | Hex | Meaning |
|-------|-----|---------|
| `--red` | `#ff3b3b` | Danger / Red light / Alert / Inactive |
| `--amber` | `#f59e0b` | Warning / Yellow light / Caution / Transition |
| `--cyan` | `#22d3ee` | Active / Live / MQTT / System heartbeat |
| `--green` | `#4ade80` | Success / Green light / Preemption active / Hospital ready |
| `--purple` | `#a78bfa` | AI / Medical / Gemma outputs |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--text` | `#e2e8f0` | Primary text |
| `--text-dim` | `#94a3b8` | Secondary text |
| `--text-muted` | `#64748b` | Disabled / placeholder |

### Glow Effects (for active states)

```css
--glow-red:   0 0 30px rgba(255, 59, 59, 0.25);
--glow-amber: 0 0 30px rgba(245, 158, 11, 0.25);
--glow-cyan:  0 0 30px rgba(34, 211, 238, 0.25);
--glow-green: 0 0 30px rgba(74, 222, 128, 0.25);
```

Use these sparingly — on the LED state indicator, on active signal cards, on the live ambulance dot on the map.

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg:      "#080b12",
        bg2:     "#0d1117",
        bg3:     "#111620",
        card:    "#131924",
        border:  "#1e2838",
        border2: "#243044",
        red:     "#ff3b3b",
        amber:   "#f59e0b",
        cyan:    "#22d3ee",
        green:   "#4ade80",
        purple:  "#a78bfa",
        "text-primary": "#e2e8f0",
        "text-dim":     "#94a3b8",
        "text-muted":   "#64748b",
      },
      fontFamily: {
        mono:  ["JetBrains Mono", "monospace"],
        syne:  ["Syne", "sans-serif"],
        serif: ["Instrument Serif", "serif"],
      }
    }
  }
}
```

---

## 3. Typography

### Font Stack

**Syne** — Used for all headings, large numbers, product name, section titles. Bold, geometric, technical. Load from Google Fonts.

**JetBrains Mono** — Used for body text, labels, data values, timestamps, code. Monospace creates the "terminal/operational" feeling.

**Instrument Serif (Italic only)** — Used sparingly for taglines, pull quotes, emotional moments (e.g., "By the time the doors open, the doctor already knows everything."). The serif italic contrast against mono creates impact.

### Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
```

### Type Scale

| Level | Font | Size | Weight | Use Case |
|-------|------|------|--------|----------|
| Hero | Syne | 72–96px | 800 | Product name on landing |
| Title | Syne | 36–48px | 700 | Section headers |
| Metric | Syne | 48–64px | 800 | Live numbers (latency, speed) |
| Subheading | Syne | 18–22px | 600 | Card headers |
| Body | JetBrains Mono | 13–14px | 400 | Descriptions, data labels |
| Caption | JetBrains Mono | 10–11px | 400 | Timestamps, unit labels |
| Eyebrow | JetBrains Mono | 10px | 500 | Section labels, ALL CAPS, letter-spacing 0.2em |
| Pull Quote | Instrument Serif | 20–22px | Italic | Emotional taglines |

---

## 4. Design Language — Motifs and Patterns

These are the visual elements that tie the whole product together. Use them consistently.

### Grid Overlay

Every background gets a subtle dot or line grid, masked with a radial gradient so it fades at edges:

```css
.grid-bg {
  background-image:
    linear-gradient(rgba(255,59,59,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,59,59,0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
}
```

Use red-tinted grid on the hero. Use cyan-tinted grid on the operations dashboard.

### Noise Texture

A film-grain noise overlay at 3–4% opacity over the entire page makes the dark backgrounds feel rich and non-flat:

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* SVG fractalNoise */
  pointer-events: none;
  z-index: 999;
  opacity: 0.035;
}
```

### Colored Top Border on Cards

Every card gets a 2px top border in its semantic color. This is the visual hierarchy system:

```css
.card-red    { border-top: 2px solid #ff3b3b; }
.card-amber  { border-top: 2px solid #f59e0b; }
.card-cyan   { border-top: 2px solid #22d3ee; }
.card-green  { border-top: 2px solid #4ade80; }
.card-purple { border-top: 2px solid #a78bfa; }
```

### Section Labels (Eyebrow Pattern)

Every section starts with a small numbered eyebrow in JetBrains Mono:

```
01 — System Overview
```

Left red line + label text at letter-spacing 0.2em, all caps, text-muted color.

### Status Badges

Small inline badges for live status indicators:

```jsx
// Active state
<span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest
  bg-green/10 text-green border border-green/30 rounded-sm">
  LIVE
</span>

// Warning state
<span className="... bg-amber/10 text-amber border-amber/30">PENDING</span>

// Alert state
<span className="... bg-red/10 text-red border-red/30">ALERT</span>
```

### Pulse Animation for Live Elements

```css
@keyframes pulse-glow {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(74,222,128,0.4); }
  50%       { opacity: 0.6; box-shadow: 0 0 20px rgba(74,222,128,0.8); }
}

.live-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #4ade80;
  animation: pulse-glow 2s ease-in-out infinite;
}
```

---

## 5. What to Build (Page Inventory)

**Build exactly two screens.** Quality over quantity.

| Screen | URL Route | Primary Purpose | Show During |
|--------|-----------|-----------------|------------|
| Landing Page | `/` | Explain the product to judges, link to dashboard | Before/after demo; judges browse this |
| Operations Dashboard | `/dashboard` | Live demo — all 5 subsystems on one screen | During the 90-second demo |

The **Hospital Readiness view** is a tab/panel *within* the dashboard, not a separate page. This lets you switch to it mid-demo with a single click.

---

## 6. Page 1: Landing Page — Architecture & Ideas

The landing page is for judges who walk up to your table before the presentation, and for anyone judging online later. It needs to answer: *What is this, why does it matter, and how does it work?* — in under 60 seconds of scrolling.

### Section Architecture

```
SECTION 1: HERO
  ↓
SECTION 2: THE PROBLEM (numbers)
  ↓
SECTION 3: SYSTEM PIPELINE (5 steps)
  ↓
SECTION 4: LIVE DEMO CTA
  ↓
SECTION 5: HOW IT WORKS (architecture diagram)
  ↓
SECTION 6: HARDWARE SHOWCASE
  ↓
SECTION 7: IMPACT NUMBERS
  ↓
FOOTER
```

### Section 1: Hero

**Concept:** The screen is pitch black. A red grid pulses in from the top left. Large white text forms:

```
SmartEVP
Emergency  ← ghosted outline text (visible but hollow)
Reimagined. ← in red
```

Below it, in Instrument Serif italic:
*"A full end-to-end emergency dispatch, traffic preemption, and hospital readiness platform — built for lives that can't wait."*

Below that, 4 stat pills:
```
[ <5s Latency ] [ 5 Subsystems ] [ ₹0 Recurring Cost ] [ 25% Faster ]
```

Bottom CTA button (red, sharp corners, no border-radius):
```
[ → OPEN LIVE DASHBOARD ]
```

**Reverse parallax on scroll:** As the user scrolls down, the red grid in the hero moves *upward* faster than the content, creating depth. Implement with:

```javascript
useEffect(() => {
  const onScroll = () => {
    const y = window.scrollY;
    gridRef.current.style.transform = `translateY(${-y * 0.4}px)`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

### Section 2: The Problem

Three large stat callouts in a horizontal row. Each has a big number in Syne 800, a label beneath it, and a one-line context note.

```
45%            30–60s          ₹8–15L
───────────    ──────────────   ─────────────────────
Bengaluru      Manual corridor  Per intersection —
ambulance      response time    commercial EVP
delay          vs our <5s       systems
```

Background: subtle red ambient glow behind the "45%" stat.

### Section 3: System Pipeline

A horizontal flow diagram showing the 5 subsystems connected by arrows. On mobile this becomes vertical.

Each node is a card with colored top border, icon, number, title, one-line description. Matching the exact pipeline from the documentation.

**Micro-interaction:** On hover, each step expands slightly (scale 1.02) and its description text fades in with a 0.2s transition.

### Section 4: Live Demo CTA

A full-width dark card with a red ambient glow. Text:

```
Instrument Serif italic (large):
"Every second after a cardiac event, survival chances
drop by 10%. SmartEVP+ removes the seconds."

Below: [OPEN LIVE DASHBOARD →] button
```

### Section 5: Architecture Diagram

The full SVG architecture diagram from the documentation HTML, with animations:
- Arrows animate in sequence (CSS stroke-dashoffset animation)
- Each node pulses briefly when the arrow reaches it
- Cyan for MQTT paths, red for emergency flow, amber for AI paths

**This is the section that shows technical depth to engineers judging the project.**

### Section 6: Hardware Showcase

A grid of 4 hardware cards (Pi, ESP32, GPS, LEDs) with an icon, specs, and price badge. The Pi card has a cyan top border (brain of the system). ESP32 has amber. The whole section has a subtle cyan grid background.

### Section 7: Impact Numbers

Large animated counters that count up when the section scrolls into view:

```
20–25%         3–4 min        ₹82K–1.5L        99.9%
response       saved per      per intersection  authentication
time reduction emergency      vs ₹8–15L        accuracy
```

### Footer

Dark bar, product name in red, team name, tagline in muted text, small GitHub link.

---

## 7. Page 2: Master Operations Dashboard

This is the center of the demo. It runs full-screen on your laptop, projected for judges. Every panel updates in real time via WebSocket.

### Layout Grid

```
┌─────────────────────────────────────────────────────────────────────┐
│ TOPBAR: SmartEVP+ [LIVE●] | Case#0042 | Latency: 3.2s | 12:34:05  │
├──────────────────────┬──────────────┬──────────────────────────────┤
│                      │              │                              │
│   MAP PANEL          │  SIGNAL      │  ACTIVE CASE CARD            │
│   (Leaflet map,      │  STATUS      │  (severity, location,        │
│   GPS dot,           │  PANEL       │   symptoms, dispatch         │
│   ambulance route,   │              │   status)                    │
│   intersection       │  🔴/🟢       │                              │
│   marker)            │  Intersection│                              │
│                      │  INT-01      │                              │
│   60% width          │  20% width   │  20% width                   │
├──────────────────────┴──────────────┴──────────────────────────────┤
│                                                                     │
│  [TABS:  HOSPITAL READINESS  |  AUDIT LOG  |  SYSTEM METRICS ]     │
│                                                                     │
│  ┌─ HOSPITAL READINESS (default active tab) ───────────────────┐   │
│  │  Chief Complaint  | Suspected Dx  | Vitals grid             │   │
│  │  Resources Needed | Priority      | ETA countdown           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Panel 1: Map Panel

Uses **Leaflet.js** with a dark tile layer (CartoDB Dark Matter — free, no API key).

```javascript
// Map initialization
const map = L.map('map').setView([12.93, 77.61], 14);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap © CARTO',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);
```

**Ambulance dot:** A custom red pulsing circle marker:

```javascript
const ambulanceIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 16px; height: 16px; border-radius: 50%;
    background: #ff3b3b;
    box-shadow: 0 0 0 4px rgba(255,59,59,0.3), 0 0 20px rgba(255,59,59,0.5);
    border: 2px solid #fff;
    animation: pulse 1.5s ease-in-out infinite;">
  </div>`,
  iconSize: [16, 16], iconAnchor: [8, 8]
});
```

**Intersection marker:** A cyan crosshair icon at the intersection coordinates.

**500m radius circle:** A semi-transparent cyan circle showing the preemption zone. When the ambulance enters it, the circle fills amber → green.

```javascript
const radiusCircle = L.circle([INTERSECTION_LAT, INTERSECTION_LNG], {
  radius: 500,
  color: '#22d3ee',
  fillColor: '#22d3ee',
  fillOpacity: 0.04,
  weight: 1
}).addTo(map);

// On preemption active:
radiusCircle.setStyle({ fillColor: '#4ade80', fillOpacity: 0.08, color: '#4ade80' });
```

**GPS update handler:**

```javascript
socket.on('gps_update', (data) => {
  ambulanceMarker.setLatLng([data.lat, data.lng]);
  // Smooth pan to keep ambulance in view (don't center abruptly)
  if (!map.getBounds().contains([data.lat, data.lng])) {
    map.panTo([data.lat, data.lng], { animate: true, duration: 0.5 });
  }
  // Update speed + ETA in panel
  setSpeed(data.speed);
});
```

### Panel 2: Signal Status Panel

This panel is the physical LED state mirrored on screen. It has one big job: make the light flip feel as dramatic on screen as it does in real life.

**Default State (RED):**

```
┌─────────────────────┐
│  INTERSECTION       │
│  INT-01             │
│                     │
│  ████████           │  ← Big red circle, softly glowing
│    RED              │
│  AWAITING           │
│  AMBULANCE          │
│                     │
│  Preemptions: 0     │
│  Avg latency: —     │
└─────────────────────┘
```

**Preemption Active State (GREEN):**

```
┌─────────────────────┐ ← Border flashes green briefly
│  INTERSECTION       │
│  INT-01             │
│                     │
│  ████████           │  ← Big green circle, strong glow
│    GREEN            │
│  PREEMPTION         │
│  ACTIVE             │
│                     │
│  Latency: 3.2s ✓    │
│  Auth: VERIFIED     │
└─────────────────────┘
```

**The Transition Animation (this is your money shot on screen):**

```javascript
// When signal_update arrives with state === 'GREEN':
const activatePreemption = (latency) => {
  // 1. Flash the entire panel background (600ms amber → immediate green)
  setPanelState('transitioning');
  setTimeout(() => {
    setPanelState('green');
    setLatency(latency);
    // 2. Flash header bar briefly
    setHeaderFlash(true);
    setTimeout(() => setHeaderFlash(false), 1200);
  }, 600);
};
```

```css
@keyframes preemption-flash {
  0%   { background: transparent; }
  10%  { background: rgba(245,158,11,0.15); }  /* amber */
  40%  { background: rgba(245,158,11,0.08); }
  60%  { background: rgba(74,222,128,0.12); }  /* green */
  100% { background: transparent; }
}

.panel-preempt-active {
  animation: preemption-flash 1.2s ease forwards;
}
```

### Panel 3: Active Case Card

Appears when `new_case` WebSocket event fires. Slides in from the right.

```
CASE #C0042                           [CRITICAL]
─────────────────────────────────────────────────
📍 BTM Layout, Bengaluru
💬 Heart attack patient, chest pain radiating
   to left arm
🚑 AMB-001 Dispatched
📱 SMS Delivered — 2s ago

[── DRIVER NOTIFIED ──────────────────────────── ✓]
```

Animation: Slides in from right (translateX 100% → 0, 400ms ease-out). The CRITICAL badge pulses red once. SMS delivery confirmation fades in 2 seconds later.

### Bottom Tabs

#### Tab 1: Hospital Readiness (Default)

This populates when `medical_brief` WebSocket event fires.

**Before brief arrives:** Shows "Awaiting en-route audio..." with a subtle cyan pulsing indicator.

**After brief arrives:** The entire tab content animates in, field by field, with a 50ms stagger:

```
PATIENT BRIEF — Pre-Arrival Intelligence
─────────────────────────────────────────────────────────────────
Age: 58          Gender: Male         Priority: P1 — IMMEDIATE
Chief Complaint: Acute chest pain radiating to left arm
Suspected:       STEMI (ST-Elevation Myocardial Infarction)
─────────────────────────────────────────────────────────────────
VITALS
BP: 90/60 mmHg   HR: 112 bpm (irregular)   SpO2: 94%   GCS: 15
─────────────────────────────────────────────────────────────────
RESOURCES REQUIRED
[Cardiologist] [Defibrillator] [ICU Bed] [Cath Lab Team]
─────────────────────────────────────────────────────────────────
Medications: Aspirin 75mg    Allergies: None known
─────────────────────────────────────────────────────────────────
ETA: 4 min 12 sec  [━━━━━━━━━━━━━━━━━━░░░░░░░] 68%
─────────────────────────────────────────────────────────────────
Notes: Diaphoretic. EMS Aspirin 325mg given.
       Onset approximately 20 minutes ago.
```

The ETA countdown ticks down in real time, computed from the live GPS feed.

Resource tags are displayed as colored badges — each flashes in with a scale animation (0.8 → 1.0, 150ms).

The whole brief section gets a purple left border (AI-generated indicator) and a small tag:
```
[● AI GENERATED — Gemma 4 on-device]
```

#### Tab 2: Audit Log

Scrolling log of system events, newest at top. Each line has:
- Timestamp in JetBrains Mono
- Event type as a colored badge
- Event data as dim text

```
12:34:08 [SIGNAL_GREEN]  Intersection INT-01 — Latency 3.2s
12:33:51 [GPS_UPDATE]    Ambulance at (12.9242, 77.6161) — 487m
12:33:44 [SMS_SENT]      AMB-001 driver notified — Case C0042
12:33:41 [CASE_OPENED]   C0042 — CRITICAL — BTM Layout
12:33:39 [CALL_INTAKE]   Twilio call received
```

Auto-scrolls to newest entry. Each new entry slides in from the bottom with a 200ms fade.

#### Tab 3: System Metrics

Four metric cards:
- **End-to-End Latency:** Animated number, current value in big Syne font, green if <5s, amber if 5–10s, red if >10s
- **System Uptime:** Counter ticking up
- **GPS Fix Quality:** HDOP value + satellite count
- **MQTT Message Rate:** Messages per second

---

## 8. Page 3: Hospital Readiness Screen

> This is **Tab 1 of the dashboard**, not a separate page. But it can be extracted to full-screen mode with a single button press — useful if you want to show judges the hospital's perspective separately.

Full-screen mode shows:

```
┌──────────────────────────────────────────────────────────────┐
│  HOSPITAL RECEPTION DASHBOARD                                │
│  Apollo Hospitals, Bengaluru    14:22:03                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  INCOMING PATIENT                           ETA: 3:47 ↓     │
│  ─────────────────────────────────────────────────────────  │
│  STEMI — Male, 58 years old                                  │
│  Chief: Acute chest pain, left arm radiation                 │
│                                                              │
│  VITALS                                                      │
│  BP 90/60  │  HR 112 (IRREG)  │  SpO2 94%  │  GCS 15        │
│                                                              │
│  PREPARE IMMEDIATELY                                         │
│  ┌────────────┐ ┌─────────────────┐ ┌──────────────────┐   │
│  │Cardiologist│ │Defibrillator    │ │ICU Bed           │   │
│  └────────────┘ └─────────────────┘ └──────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │Cath Lab Team                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Meds: Aspirin 75mg daily   Allergies: None known           │
│  ──────────────────────────────────────────────────────      │
│  Notes: EMS Aspirin 325mg given. Diaphoretic. Onset 20min.  │
│  ──────────────────────────────────────────────────────      │
│  [● GENERATED BY GEMMA 4 — EDGE AI — ON-DEVICE INFERENCE]   │
└──────────────────────────────────────────────────────────────┘
```

The ETA countdown bar moves in real time. When ETA hits 0, the card flashes green and displays:

```
█████████████████ PATIENT ARRIVING █████████████████
```

---

## 9. Animation Blueprint

These are the specific animations to implement, in priority order. Build 1–4 first; 5–7 if time permits.

### Animation 1: Signal Panel State Change (MUST BUILD — Demo Critical)

When preemption fires, the signal panel executes:

1. **T+0ms:** Panel border color transitions from `#1e2838` → `#f59e0b` over 200ms
2. **T+200ms:** Circle in panel color transitions amber, subtle pulse
3. **T+600ms:** Circle and border transition to green (`#4ade80`)
4. **T+700ms:** Green glow expands (box-shadow from 0px → 30px over 500ms)
5. **T+800ms:** "PREEMPTION ACTIVE" text fades in (opacity 0 → 1)
6. **T+900ms:** Latency number counts up from 0 to actual value over 300ms

### Animation 2: Ambulance GPS Dot Movement

The Leaflet marker moves smoothly using `marker.setLatLng()` — Leaflet handles interpolation. Additionally, add a trailing "ghost" line showing the route taken:

```javascript
const routePoints = [];
socket.on('gps_update', (data) => {
  routePoints.push([data.lat, data.lng]);
  if (routePolyline) map.removeLayer(routePolyline);
  routePolyline = L.polyline(routePoints, {
    color: '#ff3b3b',
    weight: 2,
    opacity: 0.5,
    dashArray: '4 6'
  }).addTo(map);
});
```

### Animation 3: Case Card Slide-In

When `new_case` event fires:

```css
@keyframes slide-in-right {
  from { transform: translateX(120%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}

.case-card-enter {
  animation: slide-in-right 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
```

### Animation 4: Medical Brief Field Reveal

When `medical_brief` fires, each field in the brief reveals with a stagger:

```javascript
const briefFields = document.querySelectorAll('.brief-field');
briefFields.forEach((field, i) => {
  setTimeout(() => {
    field.classList.add('revealed');
  }, i * 60);  // 60ms stagger
});
```

```css
.brief-field {
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.brief-field.revealed {
  opacity: 1;
  transform: translateY(0);
}
```

### Animation 5: Landing Page Hero Parallax (Reverse)

As described in Section 6. The red grid moves upward faster than the scroll.

### Animation 6: Stat Counter (Landing Page)

When impact stat section scrolls into view, numbers count up from 0:

```javascript
const countUp = (element, target, duration = 1500) => {
  const start = performance.now();
  const update = (time) => {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    element.textContent = Math.round(ease * target);
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
};
```

### Animation 7: Topbar Live Pulse

A small green dot next to "LIVE" in the topbar pulses continuously. This is constant reassurance that the WebSocket is connected.

```css
@keyframes live-pulse {
  0%, 100% { transform: scale(1);   opacity: 1;   }
  50%       { transform: scale(1.5); opacity: 0.6; }
}
.live-dot { animation: live-pulse 2s ease-in-out infinite; }
```

---

## 10. Component Architecture (React)

### Folder Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Topbar.jsx
│   │   └── TabBar.jsx
│   ├── map/
│   │   ├── MapPanel.jsx
│   │   └── AmbulanceMarker.jsx
│   ├── signal/
│   │   └── SignalPanel.jsx
│   ├── dispatch/
│   │   └── CaseCard.jsx
│   ├── medical/
│   │   ├── MedicalBrief.jsx
│   │   ├── VitalsGrid.jsx
│   │   └── ResourceBadges.jsx
│   ├── audit/
│   │   └── AuditLog.jsx
│   ├── metrics/
│   │   └── MetricsPanel.jsx
│   └── landing/
│       ├── Hero.jsx
│       ├── PipelineFlow.jsx
│       ├── HardwareCards.jsx
│       └── ImpactStats.jsx
├── hooks/
│   ├── useSocket.js       ← Socket.IO connection + state
│   ├── useGPS.js          ← GPS state management
│   └── useSignal.js       ← Signal state + preemption logic
├── pages/
│   ├── Landing.jsx
│   └── Dashboard.jsx
├── lib/
│   ├── socket.js          ← Socket.IO singleton
│   └── constants.js       ← INTERSECTION_LAT, LNG, etc.
├── App.jsx
└── main.jsx
```

### Core useSocket Hook

```javascript
// hooks/useSocket.js
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const PI_IP = import.meta.env.VITE_PI_IP || '192.168.x.x';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [gpsData, setGpsData] = useState(null);
  const [signalState, setSignalState] = useState('RED');
  const [activeCase, setActiveCase] = useState(null);
  const [medicalBrief, setMedicalBrief] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [auditLog, setAuditLog] = useState([]);
  const [latency, setLatency] = useState(null);

  useEffect(() => {
    const socket = io(`http://${PI_IP}:5000`, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect',       ()    => setConnected(true));
    socket.on('disconnect',    ()    => setConnected(false));
    socket.on('initial_state', (s)   => {
      if (s.signal_state)   setSignalState(s.signal_state);
      if (s.active_case)    setActiveCase(s.active_case);
      if (s.medical_brief)  setMedicalBrief(s.medical_brief);
    });
    socket.on('gps_update',    (d)   => setGpsData(d));
    socket.on('signal_update', (d)   => {
      setSignalState(d.state);
      if (d.latency_ms) setLatency(d.latency_ms);
    });
    socket.on('new_case',      (d)   => setActiveCase(d));
    socket.on('medical_brief', (d)   => setMedicalBrief(d.brief));
    socket.on('transcript_update', (d) => setTranscript(d.text));
    socket.on('dispatch_sms',  (d)   => {
      setAuditLog(prev => [{
        ts: d.ts, event: 'SMS_SENT',
        data: `AMB-${d.ambulance_id} — Case ${d.case_id}`
      }, ...prev].slice(0, 100));
    });

    return () => socket.disconnect();
  }, []);

  return {
    connected, gpsData, signalState, activeCase,
    medicalBrief, transcript, auditLog, latency,
    socket: socketRef.current
  };
};
```

---

## 11. Real-Time Data Wiring (Socket.IO)

### Dashboard Component Wiring

```jsx
// pages/Dashboard.jsx
import { useSocket } from '../hooks/useSocket';
import MapPanel      from '../components/map/MapPanel';
import SignalPanel   from '../components/signal/SignalPanel';
import CaseCard      from '../components/dispatch/CaseCard';
import MedicalBrief  from '../components/medical/MedicalBrief';
import AuditLog      from '../components/audit/AuditLog';
import Topbar        from '../components/layout/Topbar';

export default function Dashboard() {
  const {
    connected, gpsData, signalState, activeCase,
    medicalBrief, transcript, auditLog, latency
  } = useSocket();

  return (
    <div className="flex flex-col h-screen bg-bg font-mono overflow-hidden">
      <Topbar connected={connected} latency={latency} activeCase={activeCase} />

      <div className="flex flex-1 overflow-hidden">
        {/* Map — 60% */}
        <div className="flex-[3] relative">
          <MapPanel gpsData={gpsData} signalState={signalState} />
        </div>

        {/* Signal — 20% */}
        <div className="flex-1 border-l border-border">
          <SignalPanel state={signalState} latency={latency} />
        </div>

        {/* Case Card — 20% */}
        <div className="flex-1 border-l border-border">
          {activeCase
            ? <CaseCard caseData={activeCase} />
            : <IdlePanel />}
        </div>
      </div>

      {/* Bottom area */}
      <div className="border-t border-border h-64 flex-shrink-0">
        <TabBar>
          <Tab label="Hospital Readiness">
            <MedicalBrief brief={medicalBrief} transcript={transcript} />
          </Tab>
          <Tab label="Audit Log">
            <AuditLog events={auditLog} />
          </Tab>
        </TabBar>
      </div>
    </div>
  );
}
```

---

## 12. Tech Stack and Setup

### Install

```bash
npm create vite@latest smartevp-frontend -- --template react
cd smartevp-frontend
npm install

# Core deps
npm install socket.io-client leaflet react-leaflet

# Animation
npm install framer-motion

# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Utilities
npm install axios
```

### Environment Config

```bash
# .env.local
VITE_PI_IP=192.168.x.x
VITE_FLASK_PORT=5000
```

Access in code: `import.meta.env.VITE_PI_IP`

### Vite Config for Proxy (avoids CORS issues in dev)

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: `http://${process.env.VITE_PI_IP || '192.168.x.x'}:5000`,
        changeOrigin: true,
      },
      '/socket.io': {
        target: `http://${process.env.VITE_PI_IP || '192.168.x.x'}:5000`,
        ws: true,
        changeOrigin: true,
      }
    }
  }
})
```

### Run

```bash
npm run dev
# Open: http://localhost:5173
```

---

## 13. Build Priority Order

Given the 24-hour window, build in this exact sequence. Each step produces something demoable. Stop at any step if time runs out and you still have a working demo.

| Priority | What to Build | Time Est. | Demoable After? |
|----------|--------------|-----------|-----------------|
| 1 | React app scaffold + dark theme + Topbar + font imports | 1h | Basic shell visible |
| 2 | WebSocket hook + signal panel (RED/GREEN flip animation) | 2h | LED mirror working |
| 3 | Leaflet map + GPS dot moving from socket | 2h | Map + moving dot |
| 4 | Case card component + slide-in animation | 1h | Full intake flow |
| 5 | Medical brief tab + staggered field reveal | 2h | Full demo path |
| 6 | Audit log tab | 1h | Looks polished |
| 7 | Landing page hero section + pipeline | 2h | Pitchable |
| 8 | Landing page remaining sections + parallax | 2h | Complete product |

---

## 14. UI Copy & Microcopy

Exact text strings to use. Consistency matters.

| Location | Text |
|----------|------|
| Product name | `SmartEVP+` (always with + sign) |
| Tagline | "Every second counts. Intelligent traffic control for life-saving missions." |
| Sub-tagline | "A full end-to-end emergency dispatch, traffic preemption, and hospital readiness platform." |
| Dashboard topbar | `SmartEVP+ ERIS v2.0` |
| Signal idle state | `AWAITING DISPATCH` |
| Signal preemption | `PREEMPTION ACTIVE` |
| Signal reset | `CORRIDOR CLEARED` |
| Dispatch status | `AMBULANCE EN ROUTE` |
| Brief awaiting | `Awaiting en-route audio...` |
| Brief label | `PRE-ARRIVAL INTELLIGENCE` |
| AI tag | `● GEMMA 4 — EDGE AI — ON-DEVICE` |
| Case severity - critical | `P1 — CRITICAL` in red |
| Case severity - high | `P2 — HIGH` in amber |
| Live indicator | `● LIVE` in green |
| Disconnected indicator | `○ OFFLINE` in red |
| Reset button | `RESET DEMO` |
| Hospital screen title | `INCOMING PATIENT BRIEF` |
| ETA prefix | `ETA:` |
| Latency label | `E2E LATENCY` |
| Auth label | `ECC-256 VERIFIED ✓` |

---

## 15. Judge-Facing Design Tips

**Things that matter most to judges evaluating UI/UX:**

1. **Full-screen the dashboard** before the demo starts. Remove all browser chrome. Use kiosk mode: `google-chrome --kiosk http://localhost:5173/dashboard`. This immediately signals professionalism.

2. **High contrast is non-negotiable.** Projectors wash out color. Test your dashboard projected on a wall or screen before the event. Increase contrast if needed.

3. **The signal panel is the focal point.** Make it physically large — it should be the first thing eyes go to. The green light flash needs to be visible from 5 meters away on the projector.

4. **Numbers over text.** Judges scan fast. `3.2s` tells them more in less time than "end-to-end latency of 3.2 seconds."

5. **Live updates beat static screenshots.** When the GPS dot moves and the map follows it, that alone is more impressive than 5 slides about GPS tracking.

6. **The audit log is your credibility proof.** Engineers judging the project will look at the audit log and see real system events. That's where technical depth becomes visible.

7. **One-click reset.** After the demo, judges may ask you to run it again. Have a reset button that clears all state and returns to idle in one click.

8. **Dark mode only.** Never show a white-background dashboard in a presentation context. White backgrounds signal prototype; dark backgrounds signal production.

---

*SmartEVP+ Frontend & UI/UX Design Guide · Team V3 · TechnoCognition'25 · Dayananda Sagar University*

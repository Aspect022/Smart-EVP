# SmartEVP+ — Frontend & UI/UX Design Guide
### Team V3 · TechnoCognition'25 · Dayananda Sagar University
### v2.0 — One React App, Three Views, Three Laptops

> **Audience:** The frontend engineer. This document covers every screen, every panel, every animation, every color decision, and every line of wiring code. Follow it sequentially. The goal is a UI that wins the UI/UX judging criterion decisively.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Design Language — Motifs and Patterns](#4-design-language--motifs-and-patterns)
5. [Three Views — One App, Three Routes](#5-three-views--one-app-three-routes)
6. [Project Setup](#6-project-setup)
7. [View 1: Master Operations Dashboard (`/`)](#7-view-1-master-operations-dashboard-)
8. [View 2: Ambulance / Nurse View (`/ambulance`)](#8-view-2-ambulance--nurse-view-ambulance)
9. [View 3: Hospital Readiness Dashboard (`/hospital`)](#9-view-3-hospital-readiness-dashboard-hospital)
10. [Shared Components](#10-shared-components)
11. [Animation Blueprint](#11-animation-blueprint)
12. [Socket.IO Wiring — useSocket Hook](#12-socketio-wiring--usesocket-hook)
13. [API Calls](#13-api-calls)
14. [Tailwind Config](#14-tailwind-config)
15. [Build Priority Order](#15-build-priority-order)
16. [UI Copy & Microcopy](#16-ui-copy--microcopy)
17. [Judge-Facing Tips](#17-judge-facing-tips)

---

## 1. Design Philosophy

This product is about seconds. Every second the UI wastes making a judge squint, re-read, or search for information is a second the demo loses. The UI must work like a control room, not a student project.

**Three principles — apply them to every decision:**

**1. Readable at 3 meters.** All critical data — signal state, ambulance position, case severity — must be scannable from across the room. Big Syne numbers. Semantic color. Status first, always.

**2. Calm under pressure.** No gradients for decoration. No bouncing animations. Animations serve exactly one purpose: marking state changes. The green flash when LEDs flip is theater. Everything else is precision.

**3. The three-laptop story.** Each view tells a different character's experience of the same emergency. Judges should feel like they are looking through three different windows into one live event. When the brief auto-fills on Laptop 3 and the LEDs flip on the table simultaneously — that is the moment that wins the room.

---

## 2. Color System

These values are locked. Use them via CSS variables or Tailwind tokens — never hardcode hex inline.

### Core Palette

```css
:root {
  --bg:      #080b12;   /* deepest dark — page background */
  --bg2:     #0d1117;   /* panels, slightly lighter */
  --bg3:     #111620;   /* nested card backgrounds */
  --card:    #131924;   /* primary card surface */
  --border:  #1e2838;   /* default border */
  --border2: #243044;   /* hover / active border */

  /* Semantic — these carry consistent meaning throughout */
  --red:     #ff3b3b;   /* danger / red light / CRITICAL / alert */
  --amber:   #f59e0b;   /* warning / yellow light / HIGH / transition */
  --cyan:    #22d3ee;   /* live / active / MQTT / GPS / connected */
  --green:   #4ade80;   /* success / GREEN light / preemption / hospital ready */
  --purple:  #a78bfa;   /* AI / Gemma outputs / medical intelligence */

  --text:       #e2e8f0;
  --text-dim:   #94a3b8;
  --text-muted: #64748b;
}
```

### When to Use Each Color

| Color | Use it for |
|-------|-----------|
| `--red` | CRITICAL severity badge, signal RED state, emergency alert, error states |
| `--amber` | HIGH severity, signal YELLOW transition, en route status |
| `--cyan` | Live GPS dot, MQTT connected indicator, map elements, system heartbeat |
| `--green` | Signal GREEN state, hospital ready, dispatch accepted, success |
| `--purple` | Anything AI/Gemma generated — brief content, transcript, AI badge |

### Glow Effects (use sparingly — only on actively-firing elements)

```css
--glow-red:   0 0 30px rgba(255, 59, 59, 0.25);
--glow-green: 0 0 40px rgba(74, 222, 128, 0.35);
--glow-cyan:  0 0 20px rgba(34, 211, 238, 0.20);
```

---

## 3. Typography

Three fonts. Each has a specific job. Never mix them up.

**Syne** — Headings, metric numbers, product name, section titles, button labels. Makes numbers feel important.

**JetBrains Mono** — All body text, data labels, timestamps, status text, captions. Creates the operational/terminal aesthetic.

**Instrument Serif, italic only** — Used exactly twice: hospital waiting state tagline, and the master dashboard callout. Creates emotional contrast against the mono.

```html
<!-- In index.html <head> -->
<link
  href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
  rel="stylesheet"
/>
```

### Type Scale

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Product name (topbar) | Syne | 15px | 800 |
| Signal state text | Syne | 28px | 700 |
| Metric numbers (latency, speed, ETA) | Syne | 40–64px | 800 |
| Card / panel header | Syne | 16px | 700 |
| Body text, labels, data values | JetBrains Mono | 13px | 400 |
| Captions, timestamps, unit labels | JetBrains Mono | 11px | 300 |
| Eyebrow labels | JetBrains Mono | 10px | 500, UPPERCASE, tracking-[0.2em] |
| Emotional callout (2 uses only) | Instrument Serif | 16–22px | italic |

---

## 4. Design Language — Motifs and Patterns

These elements appear consistently across all three views.

### Background Grid

Each view gets a subtle line grid tinted to its semantic color:

```css
/* View 1 — red grid (emergency ops) */
.grid-red {
  background-image:
    linear-gradient(rgba(255,59,59,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,59,59,0.035) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 30%, black, transparent);
}

/* View 2 — amber grid (en route) */
.grid-amber {
  background-image:
    linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 30%, black, transparent);
}

/* View 3 — green grid (hospital readiness) */
.grid-green {
  background-image:
    linear-gradient(rgba(74,222,128,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74,222,128,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 30%, black, transparent);
}
```

### Film Grain Overlay (global, add to index.css)

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
  opacity: 0.04;
}
```

### Colored Top Border on Cards

```css
.card-top-red    { border-top: 2px solid var(--red); }
.card-top-amber  { border-top: 2px solid var(--amber); }
.card-top-cyan   { border-top: 2px solid var(--cyan); }
.card-top-green  { border-top: 2px solid var(--green); }
.card-top-purple { border-top: 2px solid var(--purple); }
```

### Eyebrow Label Pattern

```jsx
const Eyebrow = ({ label, color = '#475569' }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="w-4 h-px" style={{ background: color }} />
    <span className="font-mono text-[10px] font-medium tracking-[0.2em] uppercase"
      style={{ color }}>
      {label}
    </span>
  </div>
)
```

### Status Badge

```jsx
const Badge = ({ children, color }) => {
  const map = {
    red:    { bg: 'rgba(255,59,59,0.1)',   border: 'rgba(255,59,59,0.3)',   text: '#ff3b3b' },
    amber:  { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  text: '#f59e0b' },
    cyan:   { bg: 'rgba(34,211,238,0.1)',  border: 'rgba(34,211,238,0.3)',  text: '#22d3ee' },
    green:  { bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)',  text: '#4ade80' },
    purple: { bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)', text: '#a78bfa' },
    muted:  { bg: 'rgba(30,40,56,0.5)',    border: '#1e2838',               text: '#475569' },
  }
  const s = map[color] || map.muted
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[10px]
      font-semibold uppercase tracking-widest rounded-sm border"
      style={{ background: s.bg, borderColor: s.border, color: s.text }}>
      {children}
    </span>
  )
}
```

---

## 5. Three Views — One App, Three Routes

One React app. Three routes. Each laptop opens one URL full-screen.

```
http://[Laptop1IP]:5173/           →  View 1: Master Operations Dashboard  (Laptop 1)
http://[Laptop1IP]:5173/ambulance  →  View 2: Ambulance / Nurse View       (Laptop 2)
http://[Laptop1IP]:5173/hospital   →  View 3: Hospital Readiness           (Laptop 3)
```

Laptop 2 and 3 connect to the React dev server running on Laptop 1 via its local IP. All three Socket.IO connections go to `http://[Laptop1IP]:8080` (the Flask backend).

### React Router Setup

```jsx
// src/main.jsx
import { createRoot }    from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Ambulance from './pages/Ambulance'
import Hospital  from './pages/Hospital'
import './index.css'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/"          element={<Dashboard />} />
      <Route path="/ambulance" element={<Ambulance />} />
      <Route path="/hospital"  element={<Hospital />}  />
    </Routes>
  </BrowserRouter>
)
```

---

## 6. Project Setup

```bash
npm create vite@latest smartevp-frontend -- --template react
cd smartevp-frontend
npm install

npm install react-router-dom socket.io-client leaflet react-leaflet axios framer-motion

npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### `.env.local`

```bash
# Update VITE_BACKEND_IP to Laptop 1's hotspot IP for cross-laptop access
VITE_BACKEND_IP=localhost
VITE_BACKEND_PORT=8080
```

### `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // Essential — allows Laptops 2 and 3 to access via IP
    port: 5173,
  }
})
```

> Laptops 2 and 3 open `http://[Laptop1IP]:5173/ambulance` etc. directly. No proxy needed since their Socket.IO connections also point directly at Laptop 1.

### `index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #root { height: 100%; margin: 0; padding: 0; }
  body {
    background-color: #080b12;
    color: #e2e8f0;
    font-family: 'JetBrains Mono', monospace;
    overflow: hidden;   /* dashboards never scroll — content fits the screen */
  }
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
    opacity: 0.04;
  }
}

.leaflet-container { height: 100%; width: 100%; }

.scroll-thin::-webkit-scrollbar { width: 4px; }
.scroll-thin::-webkit-scrollbar-track { background: #0d1117; }
.scroll-thin::-webkit-scrollbar-thumb { background: #1e2838; border-radius: 2px; }

@keyframes pulseGlow {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(74,222,128,0.4); }
  50%       { opacity: 0.6; box-shadow: 0 0 20px rgba(74,222,128,0.8); }
}

@keyframes flashGreen {
  0%   { background-color: transparent; }
  15%  { background-color: rgba(245,158,11,0.12); }
  45%  { background-color: rgba(245,158,11,0.06); }
  65%  { background-color: rgba(74,222,128,0.10); }
  100% { background-color: transparent; }
}

.animate-flash-green { animation: flashGreen 1.4s ease forwards; }
.animate-pulse-glow  { animation: pulseGlow 2s ease-in-out infinite; }
```

---

## 7. View 1: Master Operations Dashboard (`/`)

**Laptop 1 — Narrated by your team. Every subsystem visible simultaneously.**

### Layout — No Scroll, Fixed Height

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOPBAR (56px)                                                        │
│  SmartEVP+ ERIS  [● LIVE]  CASE: #C0042  E2E: 3.2s  14:32:07 IST   │
├─────────────────────────────────┬──────────────────┬─────────────────┤
│                                 │                  │                 │
│   MAP PANEL                     │  SIGNAL PANEL    │  CASE CARD      │
│   Leaflet dark map              │                  │                 │
│   • Red pulsing GPS dot         │  BIG ● circle    │  #C0042         │
│   • Dashed route trail          │  RED or GREEN    │  [P1 CRITICAL]  │
│   • 500m cyan radius circle     │                  │  📍 BTM Layout  │
│   • Intersection crosshair      │  Text: state +   │  💬 Chest pain  │
│   • Speed overlay bottom-left   │  label           │  🚑 AMB-001     │
│                                 │                  │  📱 SMS sent    │
│   flex-[3] ≈ 60%                │  flex-1 ≈ 20%    │  flex-1 ≈ 20%  │
│                                 │                  │  ETA: 4:12      │
├─────────────────────────────────┴──────────────────┴─────────────────┤
│  BOTTOM TABS — h-56                                                   │
│  [ HOSPITAL READINESS ] [ AUDIT LOG ] [ METRICS ]                    │
│                                                                       │
│  Default tab: HOSPITAL READINESS                                      │
│  Shows AI-generated patient brief with staggered field reveal        │
└──────────────────────────────────────────────────────────────────────┘
```

### Dashboard Page

```jsx
// src/pages/Dashboard.jsx
import { useSocket }  from '../hooks/useSocket'
import Topbar         from '../components/Topbar'
import MapPanel       from '../components/MapPanel'
import SignalPanel    from '../components/SignalPanel'
import CaseCard       from '../components/CaseCard'
import IdleCard       from '../components/IdleCard'
import BottomTabs     from '../components/BottomTabs'
import HospitalBrief  from '../components/HospitalBrief'
import AuditLog       from '../components/AuditLog'

export default function Dashboard() {
  const { connected, gpsData, signalState, latency, activeCase, medicalBrief, transcript, auditLog } = useSocket()

  return (
    <div className="flex flex-col h-screen bg-[#080b12] overflow-hidden relative">
      {/* Red grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,59,59,0.035) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,59,59,0.035) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 30%, black, transparent)'
      }} />

      <Topbar connected={connected} latency={latency} activeCase={activeCase} />

      <div className="flex flex-1 min-h-0 relative z-10">
        <div className="flex-[3] relative">
          <MapPanel gpsData={gpsData} signalState={signalState} />
        </div>
        <div className="flex-1 border-l border-[#1e2838]">
          <SignalPanel state={signalState} latency={latency} />
        </div>
        <div className="flex-1 border-l border-[#1e2838]">
          {activeCase ? <CaseCard caseData={activeCase} /> : <IdleCard />}
        </div>
      </div>

      <div className="h-56 border-t border-[#1e2838] flex-shrink-0 relative z-10">
        <BottomTabs labels={['HOSPITAL READINESS', 'AUDIT LOG', 'METRICS']}>
          <HospitalBrief brief={medicalBrief} transcript={transcript} />
          <AuditLog events={auditLog} />
          <div className="h-full flex items-center px-6">
            <span className="font-mono text-xs text-[#475569]">System metrics — coming soon</span>
          </div>
        </BottomTabs>
      </div>
    </div>
  )
}
```

### Topbar Component

```jsx
// src/components/Topbar.jsx
import { useEffect, useState } from 'react'

export default function Topbar({ connected, latency, activeCase, viewLabel }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const timeStr = time.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata'
  })

  return (
    <div className="h-14 flex items-center px-5 gap-5 border-b border-[#1e2838]
                    bg-[#0d1117]/80 backdrop-blur-sm flex-shrink-0 z-20 relative">
      <span className="font-['Syne'] font-black text-sm tracking-tight text-white">
        Smart<span className="text-[#ff3b3b]">EVP+</span>
        <span className="ml-2 font-mono text-[10px] text-[#334155] tracking-widest font-normal">
          ERIS v2.0
        </span>
      </span>

      {viewLabel && (
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569]">
          {viewLabel}
        </span>
      )}

      {/* Connection dot */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${connected ? 'animate-pulse' : ''}`}
          style={{
            background: connected ? '#4ade80' : '#ff3b3b',
            boxShadow: connected ? '0 0 6px #4ade80' : '0 0 6px #ff3b3b'
          }}
        />
        <span className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: connected ? '#4ade80' : '#ff3b3b' }}>
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Active case */}
      {activeCase && (
        <div className="flex items-center gap-2 px-2 py-0.5 rounded-sm border"
          style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <span className="font-mono text-[10px] text-[#f59e0b] tracking-widest">
            CASE #{activeCase.case_id}
          </span>
          <span className="font-mono text-[10px] font-bold"
            style={{ color: activeCase.severity === 'CRITICAL' ? '#ff3b3b' : '#f59e0b' }}>
            {activeCase.severity}
          </span>
        </div>
      )}

      {/* E2E latency */}
      {latency && (
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] text-[#475569]">E2E:</span>
          <span className="font-['Syne'] font-bold text-sm text-[#22d3ee]">
            {(latency / 1000).toFixed(1)}s
          </span>
          <span className="font-mono text-[10px] text-[#4ade80]">✓</span>
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={() => fetch('/api/reset', { method: 'POST' })}
        className="ml-auto font-mono text-[10px] uppercase tracking-widest text-[#334155]
                   hover:text-[#64748b] transition-colors px-2 py-1 border border-[#1e2838]
                   hover:border-[#243044] rounded-sm">
        RESET DEMO
      </button>

      {/* Clock */}
      <span className="font-mono text-[11px] text-[#334155]">{timeStr} IST</span>
    </div>
  )
}
```

### Map Panel

```jsx
// src/components/MapPanel.jsx
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const INT_LAT = 12.9242
const INT_LNG = 77.6161

export default function MapPanel({ gpsData, signalState }) {
  const mapRef      = useRef(null)
  const mapInstance = useRef(null)
  const markerRef   = useRef(null)
  const circleRef   = useRef(null)
  const trailRef    = useRef(null)
  const history     = useRef([])

  useEffect(() => {
    if (mapInstance.current) return

    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
    mapInstance.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19
    }).addTo(map)

    map.setView([INT_LAT, INT_LNG], 14)

    // 500m preemption circle — cyan at rest, green on preemption
    circleRef.current = L.circle([INT_LAT, INT_LNG], {
      radius: 500, color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 0.04, weight: 1
    }).addTo(map)

    // Intersection marker
    L.marker([INT_LAT, INT_LNG], {
      icon: L.divIcon({
        className: '',
        html: `<div style="width:20px;height:20px;border:2px solid #22d3ee;border-radius:50%;
               background:rgba(34,211,238,0.1);box-shadow:0 0 12px rgba(34,211,238,0.4);
               margin:-10px 0 0 -10px;"></div>`,
        iconSize: [0, 0]
      })
    }).bindTooltip('INT-01', {
      permanent: true, direction: 'right',
      className: '!font-mono !text-[10px] !bg-[#131924] !border-[#1e2838] !text-[#22d3ee]'
    }).addTo(map)

    // Ambulance marker — red pulsing dot
    markerRef.current = L.marker([INT_LAT - 0.015, INT_LNG - 0.02], {
      icon: L.divIcon({
        className: '',
        html: `<style>
          @keyframes pR { 0%,100%{box-shadow:0 0 0 4px rgba(255,59,59,0.3),0 0 20px rgba(255,59,59,0.5);}
                          50%{box-shadow:0 0 0 8px rgba(255,59,59,0.15),0 0 30px rgba(255,59,59,0.7);} }
        </style>
        <div style="width:16px;height:16px;border-radius:50%;background:#ff3b3b;
             border:2px solid #fff;margin:-8px 0 0 -8px;animation:pR 1.5s ease-in-out infinite;"></div>`,
        iconSize: [0, 0]
      })
    }).addTo(map)

    // Route trail — dashed red line
    trailRef.current = L.polyline([], { color: '#ff3b3b', weight: 2, opacity: 0.4, dashArray: '4 4' }).addTo(map)
  }, [])

  // Update ambulance position
  useEffect(() => {
    if (!gpsData?.lat || !markerRef.current) return
    const { lat, lng } = gpsData

    markerRef.current.setLatLng([lat, lng])
    history.current.push([lat, lng])
    if (history.current.length > 80) history.current.shift()
    trailRef.current?.setLatLngs(history.current)

    if (mapInstance.current && !mapInstance.current.getBounds().contains([lat, lng])) {
      mapInstance.current.panTo([lat, lng], { animate: true, duration: 0.5 })
    }
  }, [gpsData])

  // Update circle on signal change
  useEffect(() => {
    if (!circleRef.current) return
    circleRef.current.setStyle(signalState === 'GREEN'
      ? { color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.10 }
      : { color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 0.04 }
    )
  }, [signalState])

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />
      {gpsData?.speed > 0 && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-[#131924]/90 border border-[#1e2838]
             rounded px-3 py-2">
          <div className="font-['Syne'] font-black text-2xl text-white leading-none">
            {Math.round(gpsData.speed)}
          </div>
          <div className="font-mono text-[10px] text-[#475569] uppercase tracking-widest">km/h</div>
        </div>
      )}
    </div>
  )
}
```

### Signal Panel

This is the most important component. It must be dramatic.

```jsx
// src/components/SignalPanel.jsx
import { useEffect, useRef, useState } from 'react'

export default function SignalPanel({ state, latency }) {
  const [display, setDisplay] = useState('RED')
  const [flash,   setFlash]   = useState(false)
  const [count,   setCount]   = useState(0)
  const prev = useRef('RED')

  useEffect(() => {
    if (state === prev.current) return
    prev.current = state

    if (state === 'GREEN') {
      setCount(c => c + 1)
      setFlash(true)
      setTimeout(() => setDisplay('GREEN'), 600)   // Mirrors Arduino yellow→green 600ms delay
      setTimeout(() => setFlash(false), 1400)
    } else {
      setDisplay('RED')
    }
  }, [state])

  const isGreen = display === 'GREEN'
  const color = isGreen ? '#4ade80' : '#ff3b3b'

  return (
    <div
      className="h-full flex flex-col p-5 transition-all duration-500"
      style={{
        borderTop: `2px solid ${color}`,
        background: flash ? 'rgba(74,222,128,0.04)' : 'transparent',
        boxShadow: isGreen ? '0 0 30px rgba(74,222,128,0.06) inset' : 'none',
      }}
    >
      <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569] mb-4">
        Signal Control
      </div>

      <div className="font-['Syne'] font-bold text-base text-white">INTERSECTION</div>
      <div className="font-mono text-xs text-[#64748b] mb-6">INT-01 · Koramangala</div>

      {/* The big circle — mirrors the physical LED */}
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <div
          className="w-24 h-24 rounded-full transition-all duration-700"
          style={{
            background: color,
            boxShadow: isGreen
              ? '0 0 40px rgba(74,222,128,0.6)'
              : '0 0 20px rgba(255,59,59,0.35)'
          }}
        />
        <div className="text-center">
          <div className="font-['Syne'] font-bold text-2xl transition-colors duration-500"
            style={{ color }}>
            {isGreen ? 'GREEN' : 'RED'}
          </div>
          <div className="font-mono text-xs text-[#64748b] mt-1">
            {isGreen ? 'PREEMPTION ACTIVE' : 'AWAITING AMBULANCE'}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#1e2838] space-y-2">
        <div className="flex justify-between">
          <span className="font-mono text-[11px] text-[#475569]">Preemptions</span>
          <span className="font-mono text-[11px] text-white">{count}</span>
        </div>
        {latency && (
          <div className="flex justify-between">
            <span className="font-mono text-[11px] text-[#475569]">Latency</span>
            <span className="font-mono text-[11px] text-[#22d3ee] font-semibold">
              {(latency / 1000).toFixed(2)}s ✓
            </span>
          </div>
        )}
        {isGreen && (
          <div className="flex justify-between">
            <span className="font-mono text-[11px] text-[#475569]">Auth</span>
            <span className="font-mono text-[11px] text-[#4ade80]">ECC-256 ✓</span>
          </div>
        )}
      </div>
    </div>
  )
}
```

### Case Card

```jsx
// src/components/CaseCard.jsx
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CaseCard({ caseData }) {
  const [smsOk,    setSmsOk]    = useState(false)
  const [driverOk, setDriverOk] = useState(false)
  const [eta,      setEta]      = useState(null)

  useEffect(() => {
    setSmsOk(false); setDriverOk(false)
    const t1 = setTimeout(() => setSmsOk(true),    2000)
    const t2 = setTimeout(() => setDriverOk(true), 4000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [caseData?.case_id])

  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch('/api/eta')
        const d = await r.json()
        if (d.eta_seconds != null) setEta(d.eta_seconds)
      } catch {}
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [])

  const isCrit = caseData?.severity === 'CRITICAL'
  const accent = isCrit ? '#ff3b3b' : '#f59e0b'

  return (
    <motion.div
      key={caseData.case_id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-full flex flex-col p-5 overflow-hidden"
      style={{ borderTop: `2px solid ${accent}` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] text-[#475569] tracking-widest uppercase mb-1">
            Active Case
          </div>
          <div className="font-['Syne'] font-bold text-lg text-white">#{caseData.case_id}</div>
        </div>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest rounded-sm border"
          style={{ color: accent, borderColor: accent + '50', background: accent + '15' }}
        >
          {isCrit ? 'P1 — CRITICAL' : 'P2 — HIGH'}
        </motion.div>
      </div>

      <div className="border-t border-[#1e2838] mb-3" />

      <div className="space-y-3 flex-1">
        <Row icon="📍" label="Location" value={caseData.location} />
        <Row icon="🩺" label="Symptoms"
          value={caseData.symptoms?.substring(0, 75) + (caseData.symptoms?.length > 75 ? '...' : '')} />
        <Row icon="🚑" label="Unit" value="AMB-001 · City Ambulance 1" />

        <AnimatePresence>
          {smsOk && (
            <motion.div key="sms" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Row icon="📱" label="SMS" value="Delivered ✓" valueColor="#4ade80" />
            </motion.div>
          )}
          {driverOk && (
            <motion.div key="drv" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Row icon="✅" label="Driver App" value="Notified ✓" valueColor="#4ade80" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {eta != null && (
        <div className="mt-auto pt-3 border-t border-[#1e2838]">
          <div className="font-mono text-[10px] text-[#475569] uppercase tracking-wider mb-1">ETA</div>
          <div className="font-['Syne'] font-black text-3xl text-white">
            {Math.floor(eta / 60)}:{String(eta % 60).padStart(2, '0')}
          </div>
        </div>
      )}
    </motion.div>
  )
}

const Row = ({ icon, label, value, valueColor = '#e2e8f0' }) => (
  <div className="flex gap-3 items-start">
    <span className="text-base w-5 flex-shrink-0">{icon}</span>
    <div className="min-w-0">
      <div className="font-mono text-[10px] text-[#475569] uppercase tracking-wider mb-0.5">{label}</div>
      <div className="font-mono text-[12px] leading-snug break-words" style={{ color: valueColor }}>
        {value}
      </div>
    </div>
  </div>
)
```

### Hospital Brief (bottom tab)

```jsx
// src/components/HospitalBrief.jsx
import { motion, AnimatePresence } from 'framer-motion'

export default function HospitalBrief({ brief, transcript }) {
  if (!brief) {
    return (
      <div className="h-full flex items-center gap-4 px-6">
        <div className="relative w-5 h-5 flex-shrink-0">
          <div className="absolute inset-0 rounded-full border border-[#22d3ee]/30 animate-ping" />
          <div className="absolute inset-1.5 rounded-full bg-[#22d3ee]/20" />
        </div>
        <span className="font-mono text-xs text-[#475569]">
          Awaiting en-route audio — brief will auto-generate
        </span>
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Complaint + vitals */}
      <div className="flex-1 p-4 border-r border-[#1e2838] flex flex-col gap-2.5 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569]">
            Pre-Arrival Intelligence
          </span>
          <span className="px-1.5 py-0.5 bg-[#a78bfa]/10 border border-[#a78bfa]/30
               font-mono text-[9px] text-[#a78bfa] uppercase tracking-widest rounded-sm">
            ● Gemma AI
          </span>
        </div>

        {[
          { label: 'Chief Complaint', value: brief.chief_complaint, delay: 0 },
          { label: 'Suspected Dx',    value: brief.suspected_diagnosis, delay: 0.07, color: '#f59e0b' },
          { label: 'BP / HR / SpO2',  value: `${brief.vitals?.bp} · ${brief.vitals?.hr} · ${brief.vitals?.spo2}`, delay: 0.14 },
        ].map(f => (
          <motion.div key={f.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: f.delay }}>
            <div className="font-mono text-[10px] text-[#475569] uppercase tracking-wider">{f.label}</div>
            <div className="font-mono text-[12px]" style={{ color: f.color || '#e2e8f0' }}>{f.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Resources */}
      <div className="flex-1 p-4 border-r border-[#1e2838]">
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569] mb-2.5">
          Resources Needed
        </div>
        <div className="flex flex-wrap gap-1.5">
          {brief.resources_required?.map((r, i) => (
            <motion.span key={r}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className="px-2 py-1 font-mono text-[10px] text-[#4ade80] font-semibold rounded-sm border"
              style={{ background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.25)' }}>
              ✓ {r}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Transcript snippet */}
      <div className="w-48 p-4 flex flex-col">
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569] mb-2">
          Transcript
        </div>
        <div className="flex-1 font-mono text-[10px] text-[#475569] leading-relaxed overflow-hidden
             line-clamp-[8]">
          {transcript || 'Waiting...'}
        </div>
      </div>
    </div>
  )
}
```

---

## 8. View 2: Ambulance / Nurse View (`/ambulance`)

**Laptop 2 — The inside of the ambulance. What the nurse/crew sees en route.**

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  TOPBAR   🚑 AMB-001 — EN ROUTE  [● LIVE]  CASE: #C0042        │
├──────────────────────────────┬───────────────────────────────────┤
│                              │                                   │
│   MAP PANEL                  │   CASE PANEL                      │
│   (same Leaflet, zoom 16,    │                                   │
│    ambulance-centered)       │   Case + severity                 │
│                              │   Location + symptoms             │
│   flex-[3] ≈ 55%             │   Driver accepted status          │
│                              │   flex-[2] ≈ 45%                  │
├──────────────────────────────┴───────────────────────────────────┤
│  SIGNAL CORRIDOR STATUS BAR  (h-20)                              │
│  Idle:   🔴 INT-01 · Approaching · 1,200m                        │
│  Active: 🟢 GREEN CORRIDOR ACTIVE — PROCEED WITHOUT STOPPING     │
├──────────────────────────────────────────────────────────────────┤
│  NURSE AUDIO + BRIEF  (flex-1 remaining)                         │
│                                                                   │
│  LEFT: LIVE TRANSCRIPT  →  auto-scrolling as words appear       │
│  RIGHT: COMPACT BRIEF   →  appears after Gemma generates        │
└──────────────────────────────────────────────────────────────────┘
```

### Ambulance Page

```jsx
// src/pages/Ambulance.jsx
import { useSocket }        from '../hooks/useSocket'
import Topbar               from '../components/Topbar'
import MapPanel             from '../components/MapPanel'
import CaseCard             from '../components/CaseCard'
import IdleCard             from '../components/IdleCard'
import SignalCorridorBar    from '../components/SignalCorridorBar'
import TranscriptBrief      from '../components/TranscriptBrief'

export default function Ambulance() {
  const { connected, gpsData, signalState, latency, activeCase, medicalBrief, transcript } = useSocket()

  return (
    <div className="flex flex-col h-screen bg-[#080b12] overflow-hidden relative">
      {/* Amber grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 30%, black, transparent)'
      }} />

      <Topbar connected={connected} activeCase={activeCase} viewLabel="🚑 AMBULANCE — EN ROUTE" />

      <div className="flex min-h-0 relative z-10" style={{ height: '50%' }}>
        <div className="flex-[3] relative">
          <MapPanel gpsData={gpsData} signalState={signalState} />
        </div>
        <div className="flex-[2] border-l border-[#1e2838] overflow-hidden">
          {activeCase ? <CaseCard caseData={activeCase} /> : <IdleCard />}
        </div>
      </div>

      <div className="flex-shrink-0 relative z-10">
        <SignalCorridorBar state={signalState} latency={latency} gpsData={gpsData} />
      </div>

      <div className="flex-1 min-h-0 border-t border-[#1e2838] relative z-10">
        <TranscriptBrief transcript={transcript} brief={medicalBrief} />
      </div>
    </div>
  )
}
```

### Signal Corridor Bar

The most dramatic element on this view. When it flips green the entire bar transforms.

```jsx
// src/components/SignalCorridorBar.jsx
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SignalCorridorBar({ state, latency, gpsData }) {
  const [isGreen, setIsGreen] = useState(false)
  const prev = useRef('RED')

  useEffect(() => {
    if (state === prev.current) return
    prev.current = state
    setIsGreen(state === 'GREEN')
  }, [state])

  return (
    <AnimatePresence mode="wait">
      {isGreen ? (
        <motion.div key="green"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="px-6 py-5 flex items-center gap-5"
          style={{
            background: 'linear-gradient(to right, rgba(74,222,128,0.10), rgba(74,222,128,0.02))',
            borderTop: '2px solid #4ade80',
            borderBottom: '1px solid rgba(74,222,128,0.2)',
            boxShadow: '0 0 40px rgba(74,222,128,0.12) inset',
          }}
        >
          <div className="w-12 h-12 rounded-full bg-[#4ade80] flex-shrink-0"
            style={{ boxShadow: '0 0 30px rgba(74,222,128,0.7)' }} />
          <div className="flex-1">
            <div className="font-['Syne'] font-black text-xl text-[#4ade80]">
              GREEN CORRIDOR ACTIVE — PROCEED WITHOUT STOPPING
            </div>
            <div className="font-mono text-[11px] text-[#475569] mt-0.5">
              INT-01 · Authenticated ·{' '}
              {latency ? `${(latency/1000).toFixed(2)}s latency` : ''} · ECC-256 ✓
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div key="red"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 py-5 flex items-center gap-5 border-t border-[#1e2838]"
        >
          <div className="w-12 h-12 rounded-full flex-shrink-0"
            style={{ background: 'rgba(255,59,59,0.7)', boxShadow: '0 0 15px rgba(255,59,59,0.4)' }} />
          <div>
            <div className="font-['Syne'] font-bold text-base text-[#ff3b3b]">
              INTERSECTION AHEAD — INT-01
            </div>
            <div className="font-mono text-[11px] text-[#475569] mt-0.5">
              Approaching · Preemption system armed · GPS: {gpsData?.lat ? 'active' : 'waiting'}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### Transcript + Brief

```jsx
// src/components/TranscriptBrief.jsx
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TranscriptBrief({ transcript, brief }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [transcript])

  return (
    <div className="h-full flex">
      {/* Transcript */}
      <div className="flex-1 p-4 border-r border-[#1e2838] flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569]">
            Nurse Audio — Live Transcript
          </span>
        </div>
        <div ref={scrollRef}
          className="flex-1 font-mono text-[12px] text-[#94a3b8] leading-relaxed overflow-y-auto scroll-thin">
          {transcript || <span className="text-[#334155] italic">Awaiting nurse audio input...</span>}
        </div>
      </div>

      {/* Compact brief */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#475569]">
            Pre-Arrival Brief
          </span>
          {brief && (
            <span className="font-mono text-[9px] text-[#a78bfa] tracking-widest">● Gemma AI</span>
          )}
        </div>

        <AnimatePresence>
          {brief ? (
            <motion.div key="brief" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-2.5 border-l-2 border-[#a78bfa] pl-3">
              <BL label="Complaint"  value={brief.chief_complaint} />
              <BL label="Suspected"  value={brief.suspected_diagnosis} color="#f59e0b" />
              <BL label="Vitals"
                value={`BP ${brief.vitals?.bp} · HR ${brief.vitals?.hr} · SpO2 ${brief.vitals?.spo2}`} />
              <BL label="Allergies"  value={brief.allergies?.join(', ') || 'None known'} />
              <div>
                <div className="font-mono text-[10px] text-[#475569] uppercase tracking-wider mb-1">Resources</div>
                <div className="flex flex-wrap gap-1">
                  {brief.resources_required?.map(r => (
                    <span key={r} className="px-1.5 py-0.5 font-mono text-[9px] text-[#4ade80] rounded-sm border"
                      style={{ background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.2)' }}>
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>
              <div className="font-mono text-[11px] text-[#4ade80]">
                🏥 Hospital notified — Resources pre-allocated
              </div>
            </motion.div>
          ) : (
            <span className="font-mono text-[11px] text-[#334155] italic">
              Generating after transcript completes...
            </span>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const BL = ({ label, value, color = '#94a3b8' }) => (
  <div>
    <div className="font-mono text-[10px] text-[#475569] uppercase tracking-wider">{label}</div>
    <div className="font-mono text-[12px]" style={{ color }}>{value}</div>
  </div>
)
```

---

## 9. View 3: Hospital Readiness Dashboard (`/hospital`)

**Laptop 3 — The most emotionally powerful view. The hospital receiving the patient.**

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  TOPBAR  🏥 KORAMANGALA GENERAL — ED  [● CONNECTED]  14:32 IST  │
├──────────────────────────────────────────────────────────────────┤
│  ETA BAR  (h-14)  ETA: 4:12  [━━━━━━━━━━━━░░░░░]  68%          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BEFORE BRIEF — pulsing concentric cyan rings                   │
│  "Awaiting Incoming Patient Brief..."                            │
│  (Instrument Serif italic tagline)                               │
│                                                                  │
│  AFTER BRIEF — staggered reveal of all fields                   │
│  [P1 CRITICAL]  Case #C0042  Age: 58  Male                      │
│  ──────────────────────────────────────────────────────────────  │
│  Chief Complaint · Suspected Dx                                  │
│  Vitals grid: BP / HR / SpO2 / GCS                              │
│  Resources: [✓ Cardiologist] [✓ Defib] [✓ ICU] [✓ Cath Lab]    │
│  Allergies · Medications · EMS Interventions                     │
│  [● AI GENERATED — Gemma 2B on-device]                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Hospital Page

```jsx
// src/pages/Hospital.jsx
import { useEffect, useState }     from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket }               from '../hooks/useSocket'
import Topbar                      from '../components/Topbar'

export default function Hospital() {
  const { connected, medicalBrief, activeCase } = useSocket()
  const [eta, setEta]         = useState(null)
  const [totalEta, setTotal]  = useState(null)

  useEffect(() => {
    if (!activeCase) return
    const poll = async () => {
      try {
        const r = await fetch('/api/eta')
        const d = await r.json()
        if (d.eta_seconds != null) {
          setEta(d.eta_seconds)
          if (!totalEta && d.eta_seconds > 0) setTotal(d.eta_seconds)
        }
      } catch {}
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [activeCase])

  return (
    <div className="flex flex-col h-screen bg-[#080b12] overflow-hidden relative">
      {/* Green grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(74,222,128,0.025) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(74,222,128,0.025) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 30%, black, transparent)'
      }} />

      <Topbar connected={connected} activeCase={activeCase}
        viewLabel="🏥 KORAMANGALA GENERAL — EMERGENCY DEPT" />

      {/* ETA bar */}
      {eta != null && (
        <div className="px-6 py-2.5 border-b border-[#1e2838] flex items-center gap-4
             bg-[#0d1117]/60 flex-shrink-0 z-10 relative">
          <span className="font-mono text-[10px] text-[#475569] uppercase tracking-wider">ETA</span>
          <span className="font-['Syne'] font-black text-2xl text-white">
            {Math.floor(eta / 60)}:{String(eta % 60).padStart(2, '0')}
          </span>
          <div className="flex-1 h-1.5 bg-[#1e2838] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${totalEta ? Math.min(((totalEta - eta) / totalEta) * 100, 100) : 0}%`,
                background: 'linear-gradient(to right, #22d3ee, #4ade80)'
              }}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-thin p-6 relative z-10">
        <AnimatePresence mode="wait">
          {medicalBrief ? (
            <BriefView key="brief" brief={medicalBrief} />
          ) : (
            <WaitingView key="waiting" />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const WaitingView = () => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="h-full flex flex-col items-center justify-center gap-6 py-20">
    <div className="relative w-32 h-32">
      {[0, 1, 2].map(i => (
        <div key={i}
          className="absolute inset-0 rounded-full border border-[#22d3ee]/20 animate-ping"
          style={{ animationDelay: `${i * 0.7}s`, animationDuration: '2.1s' }}
        />
      ))}
      <div className="absolute inset-10 rounded-full bg-[#22d3ee]/15 border border-[#22d3ee]/40" />
    </div>
    <div className="text-center max-w-md">
      <div className="font-['Syne'] font-bold text-xl text-[#64748b] mb-3">
        Awaiting Incoming Patient Brief
      </div>
      <div className="font-['Instrument_Serif'] italic text-base text-[#334155]">
        SmartEVP+ will auto-populate the moment an ambulance is dispatched
      </div>
    </div>
  </motion.div>
)

const BriefView = ({ brief }) => {
  const isCrit = brief.severity === 'CRITICAL'
  const accent = isCrit ? '#ff3b3b' : '#f59e0b'

  const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1 } })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="space-y-5 max-w-4xl mx-auto"
      style={{ borderLeft: `3px solid ${accent}`, paddingLeft: '24px' }}
    >
      {/* Header */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible"
        className="flex items-center gap-3 flex-wrap">
        <span className="px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-widest rounded border"
          style={{ color: accent, borderColor: accent + '50', background: accent + '15' }}>
          {isCrit ? 'P1 — CRITICAL' : 'P2 — HIGH'}
        </span>
        <span className="font-['Syne'] font-bold text-lg text-white">CASE #{brief.case_id}</span>
        <span className="font-mono text-sm text-[#64748b]">
          Age: {brief.age ?? '?'} · {brief.gender ?? '?'}
        </span>
      </motion.div>

      <div className="border-t border-[#1e2838]" />

      {/* Complaint + Dx */}
      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible"
        className="grid grid-cols-2 gap-6">
        <div>
          <Lbl>Chief Complaint</Lbl>
          <div className="font-mono text-sm text-[#e2e8f0] leading-relaxed">
            {brief.chief_complaint}
          </div>
        </div>
        <div>
          <Lbl>Suspected Diagnosis</Lbl>
          <div className="font-['Syne'] font-bold text-base text-[#f59e0b]">
            {brief.suspected_diagnosis}
          </div>
        </div>
      </motion.div>

      <div className="border-t border-[#1e2838]" />

      {/* Vitals */}
      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
        <Lbl>Vitals</Lbl>
        <div className="grid grid-cols-4 gap-5">
          {[['BP', brief.vitals?.bp], ['HR', brief.vitals?.hr],
            ['SpO2', brief.vitals?.spo2], ['GCS', brief.vitals?.gcs]].map(([l, v]) => v && (
            <div key={l}>
              <div className="font-mono text-[11px] text-[#475569] uppercase">{l}</div>
              <div className="font-['Syne'] font-bold text-xl text-white">{v}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="border-t border-[#1e2838]" />

      {/* Resources */}
      <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
        <Lbl>Resources to Prepare Now</Lbl>
        <div className="flex flex-wrap gap-2">
          {brief.resources_required?.map((r, i) => (
            <motion.span key={r}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="px-3 py-1.5 font-mono text-sm font-semibold rounded-sm border"
              style={{
                color: '#4ade80', background: 'rgba(74,222,128,0.08)',
                borderColor: 'rgba(74,222,128,0.3)'
              }}>
              ✓ {r}
            </motion.span>
          ))}
        </div>
      </motion.div>

      <div className="border-t border-[#1e2838]" />

      {/* Medications + Allergies */}
      <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible"
        className="grid grid-cols-2 gap-6">
        <div>
          <Lbl>Current Medications</Lbl>
          <div className="font-mono text-sm text-[#94a3b8]">
            {brief.current_medications?.join(', ') || 'None'}
          </div>
        </div>
        <div>
          <Lbl>Allergies</Lbl>
          <div className="font-mono text-sm text-[#94a3b8]">
            {brief.allergies?.join(', ') || 'None known'}
          </div>
        </div>
      </motion.div>

      {/* EMS + Notes */}
      {(brief.ems_interventions || brief.notes) && (
        <motion.div custom={5} variants={sectionVariants} initial="hidden" animate="visible">
          <div className="border-t border-[#1e2838] mb-4" />
          <Lbl>EMS Interventions / Notes</Lbl>
          <div className="font-mono text-sm text-[#94a3b8]">
            {brief.ems_interventions || brief.notes}
          </div>
        </motion.div>
      )}

      {/* AI badge */}
      <motion.div custom={6} variants={sectionVariants} initial="hidden" animate="visible"
        className="pt-2">
        <span className="px-2 py-1 rounded-sm border font-mono text-[10px] text-[#a78bfa]"
          style={{ background: 'rgba(167,139,250,0.08)', borderColor: 'rgba(167,139,250,0.3)' }}>
          ● AI GENERATED — Gemma 2B on-device edge inference
        </span>
      </motion.div>
    </motion.div>
  )
}

const Lbl = ({ children }) => (
  <div className="font-mono text-[10px] text-[#475569] uppercase tracking-[0.2em] mb-2">
    {children}
  </div>
)
```

---

## 10. Shared Components

### Idle Card

```jsx
// src/components/IdleCard.jsx
export default function IdleCard() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 p-6">
      <div className="w-10 h-10 rounded-full border border-[#1e2838] flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-[#1e2838]" />
      </div>
      <div className="font-mono text-sm text-[#334155] text-center">AWAITING DISPATCH</div>
      <div className="font-mono text-[10px] text-[#243044] text-center">
        Emergency call will populate this panel
      </div>
    </div>
  )
}
```

### Audit Log

```jsx
// src/components/AuditLog.jsx
export default function AuditLog({ events = [] }) {
  if (!events.length) return (
    <div className="h-full flex items-center px-6">
      <span className="font-mono text-xs text-[#334155]">No events yet</span>
    </div>
  )

  const colorFor = (evt) => {
    if (evt.includes('PREEMPTION') || evt.includes('SIGNAL')) return '#4ade80'
    if (evt.includes('CASE') || evt.includes('DISPATCH'))      return '#f59e0b'
    if (evt.includes('BRIEF') || evt.includes('TRANSCRIPT'))   return '#a78bfa'
    return '#475569'
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin px-4 py-3 space-y-2">
      {events.map((e, i) => (
        <div key={i} className="flex items-start gap-3 text-[11px]">
          <span className="font-mono text-[#334155] flex-shrink-0 mt-0.5 tabular-nums">
            {new Date(e.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="font-mono font-semibold flex-shrink-0" style={{ color: colorFor(e.event) }}>
            {e.event}
          </span>
          <span className="font-mono text-[#334155] truncate">
            {typeof e.data === 'string' ? e.data : JSON.stringify(e.data).substring(0, 55)}
          </span>
        </div>
      ))}
    </div>
  )
}
```

### Bottom Tabs

```jsx
// src/components/BottomTabs.jsx
import { useState } from 'react'

export default function BottomTabs({ labels, children }) {
  const [active, setActive] = useState(0)
  const kids = Array.isArray(children) ? children : [children]

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b border-[#1e2838] flex-shrink-0">
        {labels.map((label, i) => (
          <button key={label} onClick={() => setActive(i)}
            className={`px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em]
              transition-colors border-r border-[#1e2838] last:border-r-0 ${
              active === i
                ? 'text-white bg-[#0d1117]/60 border-b-2 border-b-[#ff3b3b] -mb-px'
                : 'text-[#334155] hover:text-[#64748b]'
            }`}>
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{kids[active]}</div>
    </div>
  )
}
```

---

## 11. Animation Blueprint

### Must-Have (build these before anything else)

| Animation | Trigger | Timing | Where |
|-----------|---------|--------|-------|
| Signal circle RED→GREEN | `signal_update GREEN` | 700ms CSS transition | SignalPanel |
| Panel background flash | Same | 1400ms keyframe | SignalPanel |
| Corridor bar swap | Same | 350ms AnimatePresence | SignalCorridorBar |
| Case card slide in from right | `new_case` event | 400ms framer spring | CaseCard |
| Severity badge pulse | CaseCard mount | 300ms scale 1→1.12→1 | CaseCard |
| SMS row fade in | 2s after case | 400ms opacity | CaseCard |
| Driver row fade in | 4s after case | 400ms opacity | CaseCard |
| GPS dot pulse | Continuous | 1.5s loop CSS | MapPanel inline style |
| Circle color change | `signal_update` | 500ms Leaflet setStyle | MapPanel |

### Nice-to-Have (add after core is working)

| Animation | Trigger | Timing |
|-----------|---------|--------|
| Brief section stagger | `medical_brief` event | 100ms × 6 sections |
| Resource tag pop | After sections | 80ms × n tags |
| Transcript auto-scroll | `transcript_update` | Smooth scroll |
| ETA bar fill | Every 2s poll | 1000ms transition |
| Hospital waiting rings | Always showing | 2.1s animate-ping |
| Hospital brief stagger | `medical_brief` event | 100ms × sections |

---

## 12. Socket.IO Wiring — useSocket Hook

All three views share this hook. Backend is on port **8080**.

```javascript
// src/hooks/useSocket.js
import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const BACKEND_IP   = import.meta.env.VITE_BACKEND_IP   || 'localhost'
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8080'
const BACKEND_URL  = `http://${BACKEND_IP}:${BACKEND_PORT}`

export function useSocket() {
  const socketRef       = useRef(null)
  const [connected,     setConnected]     = useState(false)
  const [gpsData,       setGpsData]       = useState(null)
  const [signalState,   setSignalState]   = useState('RED')
  const [latency,       setLatency]       = useState(null)
  const [activeCase,    setActiveCase]    = useState(null)
  const [medicalBrief,  setMedicalBrief]  = useState(null)
  const [transcript,    setTranscript]    = useState(null)
  const [auditLog,      setAuditLog]      = useState([])
  const [driverAccepted, setDriverAccepted] = useState(false)

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    })
    socketRef.current = socket

    socket.on('connect',    () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('initial_state', (s) => {
      if (s.signal_state)  setSignalState(s.signal_state)
      if (s.active_case)   setActiveCase(s.active_case)
      if (s.medical_brief) setMedicalBrief(s.medical_brief)
    })

    socket.on('gps_update',        (d) => setGpsData(d))

    socket.on('signal_update',     (d) => {
      setSignalState(d.state)
      if (d.latency_ms != null) setLatency(d.latency_ms)
      addLog({ event: 'SIGNAL_' + d.state, data: `Latency ${d.latency_ms}ms` })
    })

    socket.on('new_case',          (d) => {
      setActiveCase(d)
      setMedicalBrief(null)
      setTranscript(null)
      setDriverAccepted(false)
      addLog({ event: 'CASE_CREATED', data: `Case ${d.case_id} · ${d.severity}` })
    })

    socket.on('medical_brief',     (d) => {
      setMedicalBrief(d.brief || d)
      addLog({ event: 'BRIEF_GENERATED', data: `Case ${d.case_id}` })
    })

    socket.on('transcript_update', (d) => setTranscript(d.text))

    socket.on('driver_accepted',   (d) => {
      setDriverAccepted(true)
      addLog({ event: 'DRIVER_ACCEPTED', data: d.driver_id || 'D001' })
    })

    socket.on('dispatch_sms',      (d) => {
      addLog({ event: 'SMS_SENT', data: `Case ${d.case_id} → ${d.ambulance_id}` })
    })

    socket.on('demo_reset', () => {
      setActiveCase(null); setMedicalBrief(null); setTranscript(null)
      setSignalState('RED'); setLatency(null); setGpsData(null)
      setDriverAccepted(false); setAuditLog([])
    })

    function addLog(entry) {
      setAuditLog(prev => [{ ts: Date.now(), ...entry }, ...prev].slice(0, 300))
    }

    return () => socket.disconnect()
  }, [])

  return {
    connected, gpsData, signalState, latency, activeCase,
    medicalBrief, transcript, auditLog, driverAccepted,
    socket: socketRef.current
  }
}
```

---

## 13. API Calls

```javascript
// src/api.js
const BASE = `http://${import.meta.env.VITE_BACKEND_IP || 'localhost'}:${import.meta.env.VITE_BACKEND_PORT || '8080'}`

export const api = {
  state:        () => fetch(`${BASE}/api/state`).then(r => r.json()),
  eta:          () => fetch(`${BASE}/api/eta`).then(r => r.json()),
  reset:        () => fetch(`${BASE}/api/reset`, { method: 'POST' }).then(r => r.json()),
  demoTrigger:  () => fetch(`${BASE}/demo/trigger`, { method: 'POST' }).then(r => r.json()),
  demoAudio:    (caseId) => fetch(`${BASE}/demo/audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId })
  }).then(r => r.json()),
}
```

---

## 14. Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#080b12',
        bg2:     '#0d1117',
        bg3:     '#111620',
        card:    '#131924',
        border:  '#1e2838',
        border2: '#243044',
        red:     '#ff3b3b',
        amber:   '#f59e0b',
        cyan:    '#22d3ee',
        green:   '#4ade80',
        purple:  '#a78bfa',
        't-primary': '#e2e8f0',
        't-dim':     '#94a3b8',
        't-muted':   '#64748b',
      },
      fontFamily: {
        mono:  ['"JetBrains Mono"', 'monospace'],
        syne:  ['Syne', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
      },
    }
  },
  plugins: [],
}
```

---

## 15. Build Priority Order

| # | What | Est. Time | After This Step |
|---|------|-----------|-----------------|
| 1 | Scaffold + Tailwind + fonts + index.css + router skeleton | 30 min | Three blank dark routes visible |
| 2 | `useSocket` hook + `console.log` all events to verify | 20 min | Data confirmed flowing |
| 3 | Topbar (shared, RESET button works) | 25 min | Topbar on all views |
| 4 | **SignalPanel** — RED/GREEN circle + flash animation | 1h | LED mirror working on Laptop 1 |
| 5 | **MapPanel** — Leaflet map + GPS dot + circle | 1.5h | Map alive on Laptop 1 |
| 6 | **CaseCard** — slide in + SMS fade + ETA poll | 1h | Full intake flow on Laptop 1 |
| 7 | **HospitalBrief** (bottom tab) — staggered reveal | 1h | Full pipeline visible on Laptop 1 |
| 8 | BottomTabs + AuditLog + IdleCard | 30 min | Laptop 1 fully complete |
| 9 | **SignalCorridorBar** + Ambulance page layout | 1h | Laptop 2 (corridor bar works) |
| 10 | **TranscriptBrief** component | 45 min | Laptop 2 complete |
| 11 | **Hospital page** — WaitingView + BriefView + ETABar | 1.5h | Laptop 3 complete |
| 12 | Framer Motion stagger tuning + polish | 45 min | Everything feels production |

**Total: ~10.5 hours focused.** Achievable in a hackathon.

---

## 16. UI Copy & Microcopy

| Location | Text |
|----------|------|
| Product name | `SmartEVP+` |
| Build label | `ERIS v2.0` |
| Laptop 1 view label | `MASTER OPS` |
| Laptop 2 view label | `🚑 AMBULANCE — EN ROUTE` |
| Laptop 3 view label | `🏥 KORAMANGALA GENERAL — EMERGENCY DEPT` |
| Signal idle | `AWAITING AMBULANCE` |
| Signal active | `PREEMPTION ACTIVE` |
| Corridor idle | `INTERSECTION AHEAD — INT-01` |
| Corridor active | `GREEN CORRIDOR ACTIVE — PROCEED WITHOUT STOPPING` |
| Brief waiting | `Awaiting Incoming Patient Brief` |
| Hospital waiting tagline | `SmartEVP+ will auto-populate the moment an ambulance is dispatched` |
| AI badge | `● AI GENERATED — Gemma 2B on-device edge inference` |
| Critical badge | `P1 — CRITICAL` |
| High badge | `P2 — HIGH` |
| Auth | `ECC-256 ✓` |
| SMS status | `Delivered ✓` |
| Driver status | `Notified ✓` |
| Reset button | `RESET DEMO` |

---

## 17. Judge-Facing Tips

**1. Full-screen every laptop before the demo.** Press F11. Remove all browser chrome. One tab per laptop. No address bar.

**2. Test projected before the room fills.** Green and cyan wash out on projectors. If they look pale, increase brightness in the CSS variables by 10% before the event.

**3. The signal panel circle must be visible from 5 meters.** 96px is the minimum. The color change is the demo's physical climax — on screen it must match the physical LED flip.

**4. Three-laptop narration is half the demo.** When the brief auto-fills on Laptop 3, say it: "And simultaneously, on the hospital screen — the patient brief auto-populates. The doctor already knows everything before the ambulance arrives." Silence before that line. Say it after the animation completes.

**5. The audit log sells technical depth.** Technical judges will walk up to Laptop 1 and look at the audit log. Timestamped MQTT events from a real system — that is what converts skepticism.

**6. One-click reset, practiced.** After the demo, judges will ask to see it again. Hit RESET DEMO. All three screens clear. LEDs go red. Then trigger again. This shows confidence.

**7. Three seconds of silence at the green moment.** When LEDs flip and screens go green — stop talking. Hold eye contact with the judges. Let them feel it. Then: *"Every second, accounted for."*

---

*SmartEVP+ Frontend & UI/UX Design Guide v2.0 · Team V3 · TechnoCognition'25 · Dayananda Sagar University*
*Flask backend on port 8080 · One React app · Three routes · Three laptops · One live emergency*

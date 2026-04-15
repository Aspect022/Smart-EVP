"use client"

import { useState, useEffect, useCallback } from "react"
import { Topbar } from "@/components/dashboard/topbar"
import { SignalPanel } from "@/components/dashboard/signal-panel"
import { CaseCard } from "@/components/dashboard/case-card"
import { MapPanel } from "@/components/dashboard/map-panel"
import { MedicalBrief } from "@/components/dashboard/medical-brief"
import { AuditLog } from "@/components/dashboard/audit-log"
import { SystemMetrics } from "@/components/dashboard/system-metrics"

// Demo simulation data
const INTERSECTION_COORDS = { lat: 12.93, lng: 77.61 }
const DEMO_CASE = {
  id: "C0042",
  severity: "CRITICAL" as const,
  location: "BTM Layout, Bengaluru",
  complaint: "Heart attack patient, chest pain radiating to left arm",
  ambulanceId: "AMB-001",
  smsDelivered: true,
  driverNotified: true,
  timestamp: Date.now(),
}

const DEMO_BRIEF = {
  age: 58,
  gender: "Male",
  priority: "P1" as const,
  chiefComplaint: "Acute chest pain radiating to left arm",
  suspectedDiagnosis: "STEMI (ST-Elevation Myocardial Infarction)",
  vitals: {
    bp: "90/60 mmHg",
    hr: "112 bpm (IRREG)",
    spo2: "94%",
    gcs: 15,
  },
  resources: ["Cardiologist", "Defibrillator", "ICU Bed", "Cath Lab Team"],
  medications: "Aspirin 75mg daily",
  allergies: "None known",
  notes: "Diaphoretic. EMS Aspirin 325mg given. Onset approximately 20 minutes ago.",
  eta: 252, // 4 min 12 sec
}

// Simulated GPS route approaching intersection
const generateRoute = () => {
  const points: { lat: number; lng: number }[] = []
  const startLat = 12.935
  const startLng = 77.605
  const endLat = INTERSECTION_COORDS.lat
  const endLng = INTERSECTION_COORDS.lng
  
  for (let i = 0; i <= 50; i++) {
    const progress = i / 50
    points.push({
      lat: startLat + (endLat - startLat) * progress + (Math.random() - 0.5) * 0.0005,
      lng: startLng + (endLng - startLng) * progress + (Math.random() - 0.5) * 0.0005,
    })
  }
  return points
}

export default function DashboardPage() {
  // State
  const [connected, setConnected] = useState(true)
  const [signalState, setSignalState] = useState<"RED" | "AMBER" | "GREEN">("RED")
  const [latency, setLatency] = useState<number | null>(null)
  const [preemptionCount, setPreemptionCount] = useState(0)
  const [activeCase, setActiveCase] = useState<typeof DEMO_CASE | null>(null)
  const [medicalBrief, setMedicalBrief] = useState<typeof DEMO_BRIEF | null>(null)
  const [transcript, setTranscript] = useState("")
  const [auditLog, setAuditLog] = useState<{ ts: string; event: string; data: string }[]>([])
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number; speed: number; timestamp: number } | null>(null)
  const [routePoints, setRoutePoints] = useState<{ lat: number; lng: number }[]>([])
  const [routeIndex, setRouteIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<"hospital" | "audit" | "metrics">("hospital")
  const [isDemoRunning, setIsDemoRunning] = useState(false)

  // Generate route on mount
  useEffect(() => {
    setRoutePoints(generateRoute())
  }, [])

  // Add log entry helper
  const addLogEntry = useCallback((event: string, data: string) => {
    const ts = new Date().toLocaleTimeString("en-IN", { hour12: false })
    setAuditLog((prev) => [{ ts, event, data }, ...prev].slice(0, 100))
  }, [])

  // Reset demo
  const handleReset = useCallback(() => {
    setSignalState("RED")
    setLatency(null)
    setActiveCase(null)
    setMedicalBrief(null)
    setTranscript("")
    setAuditLog([])
    setGpsData(null)
    setRouteIndex(0)
    setRoutePoints(generateRoute())
    setIsDemoRunning(false)
    setPreemptionCount(0)
  }, [])

  // Start demo simulation
  const startDemo = useCallback(() => {
    if (isDemoRunning) return
    setIsDemoRunning(true)
    handleReset()

    // T+0: Call intake
    setTimeout(() => {
      addLogEntry("CALL_INTAKE", "Twilio call received")
    }, 500)

    // T+2s: Case opened
    setTimeout(() => {
      setActiveCase({ ...DEMO_CASE, timestamp: Date.now() })
      addLogEntry("CASE_OPENED", "C0042 — CRITICAL — BTM Layout")
    }, 2000)

    // T+3s: SMS sent
    setTimeout(() => {
      addLogEntry("SMS_SENT", "AMB-001 driver notified — Case C0042")
    }, 3000)

    // T+4s: Start GPS updates
    setTimeout(() => {
      let idx = 0
      const gpsInterval = setInterval(() => {
        if (idx >= routePoints.length) {
          clearInterval(gpsInterval)
          return
        }
        const point = routePoints[idx]
        const speed = 30 + Math.floor(Math.random() * 20)
        setGpsData({
          lat: point.lat,
          lng: point.lng,
          speed,
          timestamp: Date.now(),
        })
        setRouteIndex(idx)

        // Calculate distance
        const R = 6371000
        const dLat = ((INTERSECTION_COORDS.lat - point.lat) * Math.PI) / 180
        const dLng = ((INTERSECTION_COORDS.lng - point.lng) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((point.lat * Math.PI) / 180) *
            Math.cos((INTERSECTION_COORDS.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = Math.round(R * c)

        addLogEntry("GPS_UPDATE", `Ambulance at (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}) — ${distance}m`)

        // Trigger preemption when entering 500m zone
        if (distance <= 500 && signalState === "RED") {
          setSignalState("AMBER")
          setTimeout(() => {
            setSignalState("GREEN")
            setLatency(3200 + Math.floor(Math.random() * 800))
            setPreemptionCount((p) => p + 1)
            addLogEntry("SIGNAL_GREEN", "Intersection INT-01 — Latency 3.2s")
          }, 600)
        }

        idx++
      }, 800)
    }, 4000)

    // T+8s: Transcript starts
    setTimeout(() => {
      setTranscript("Patient is 58 year old male with chest pain...")
    }, 8000)

    // T+12s: Medical brief arrives
    setTimeout(() => {
      setMedicalBrief(DEMO_BRIEF)
      addLogEntry("MEDICAL_BRIEF", "Gemma 4 brief generated — STEMI suspected")
    }, 12000)

  }, [isDemoRunning, routePoints, handleReset, addLogEntry, signalState])

  // Auto-start demo after 2 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      startDemo()
    }, 2000)
    return () => clearTimeout(timeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-screen bg-bg font-mono overflow-hidden">
      {/* Topbar */}
      <Topbar
        connected={connected}
        latency={latency}
        activeCase={activeCase ? { id: activeCase.id, severity: activeCase.severity } : null}
        onReset={handleReset}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map Panel - 60% */}
        <div className="flex-[3] relative border-r border-border">
          <MapPanel
            gpsData={gpsData}
            signalState={signalState}
            intersectionCoords={INTERSECTION_COORDS}
          />
        </div>

        {/* Signal Panel - 20% */}
        <div className="flex-1 border-r border-border">
          <SignalPanel
            state={signalState}
            latency={latency}
            preemptionCount={preemptionCount}
          />
        </div>

        {/* Case Card - 20% */}
        <div className="flex-1">
          <CaseCard caseData={activeCase} />
        </div>
      </div>

      {/* Bottom Tabs */}
      <div className="border-t border-border h-72 flex-shrink-0">
        {/* Tab Bar */}
        <div className="flex border-b border-border">
          {[
            { id: "hospital", label: "Hospital Readiness" },
            { id: "audit", label: "Audit Log" },
            { id: "metrics", label: "System Metrics" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 text-sm font-mono uppercase tracking-wider transition-colors ${
                activeTab === tab.id
                  ? "text-text border-b-2 border-cyan bg-bg2"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="h-[calc(100%-49px)] overflow-hidden">
          {activeTab === "hospital" && (
            <MedicalBrief brief={medicalBrief} transcript={transcript} />
          )}
          {activeTab === "audit" && <AuditLog events={auditLog} />}
          {activeTab === "metrics" && (
            <SystemMetrics latency={latency} connected={connected} />
          )}
        </div>
      </div>
    </div>
  )
}

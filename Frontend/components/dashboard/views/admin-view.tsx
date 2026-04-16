"use client"

import { useEffect, useMemo, useState } from "react"
import { Ambulance, LocateFixed } from "lucide-react"

import { MapPanel, type TrackedAmbulance } from "@/components/dashboard/map-panel"
import { SignalPanel } from "@/components/dashboard/signal-panel"

interface AdminViewProps {
  gps: any
  signal: "RED" | "AMBER" | "GREEN"
  latency: number | null
  activeCase: any | null
  caseStatus: string
  medicalBrief: any | null
  transcript: string
  auditLog: any[]
  connected: boolean
  preemptionCount: number
  intersectionCoords: { lat: number; lng: number }
  handleStartDemo: () => Promise<void>
}

export function AdminView({
  gps,
  signal,
  latency,
  activeCase,
  caseStatus,
  medicalBrief,
  transcript,
  auditLog,
  connected,
  preemptionCount,
  intersectionCoords,
  handleStartDemo,
}: AdminViewProps) {
  const [audioRunning, setAudioRunning] = useState(false)
  const [revealedCount, setRevealedCount] = useState(0)
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState("AMB-001")
  const [fleetTick, setFleetTick] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFleetTick((value) => value + 1)
    }, 1800)

    return () => window.clearInterval(timer)
  }, [])

  const trackedAmbulances = useMemo<TrackedAmbulance[]>(() => {
    const liveBase = gps ?? {
      lat: intersectionCoords.lat - 0.0065,
      lng: intersectionCoords.lng - 0.008,
      speed: 36,
    }
    const t = fleetTick

    return [
      {
        id: "AMB-001",
        label: "Unit Alpha",
        lat: liveBase.lat,
        lng: liveBase.lng,
        speed: liveBase.speed ?? 36,
        status: activeCase ? "Assigned to active case" : "Patrolling live route",
        isLive: true,
      },
      {
        id: "AMB-204",
        label: "Unit Bravo",
        lat: intersectionCoords.lat - 0.004 + Math.sin(t / 3) * 0.0009,
        lng: intersectionCoords.lng + 0.005 + Math.cos(t / 4) * 0.0012,
        speed: 34,
        status: "North approach patrol",
      },
      {
        id: "AMB-315",
        label: "Unit Charlie",
        lat: intersectionCoords.lat + 0.0038 + Math.sin(t / 5) * 0.0007,
        lng: intersectionCoords.lng - 0.006 + Math.cos(t / 3) * 0.001,
        speed: 28,
        status: "Hospital standby",
      },
      {
        id: "AMB-442",
        label: "Unit Delta",
        lat: intersectionCoords.lat + 0.0065 + Math.sin(t / 4) * 0.0008,
        lng: intersectionCoords.lng + 0.0025 + Math.cos(t / 5) * 0.0008,
        speed: 31,
        status: "Outer ring response",
      },
    ]
  }, [activeCase, fleetTick, gps, intersectionCoords])

  const selectedAmbulance = trackedAmbulances.find((item) => item.id === selectedAmbulanceId) ?? trackedAmbulances[0]

  useEffect(() => {
    if (!trackedAmbulances.some((item) => item.id === selectedAmbulanceId) && trackedAmbulances[0]) {
      setSelectedAmbulanceId(trackedAmbulances[0].id)
    }
  }, [selectedAmbulanceId, trackedAmbulances])

  const terminalLines = useMemo(() => {
    const numberSuffix = activeCase ? String(activeCase.id).slice(-3) : "241"
    const phone = `+91 9XXXX XX${numberSuffix}`

    if (!activeCase) {
      return [
        `Call from number ${phone} received`,
        "Extracting text from call audio pipeline",
        "Gemma reasoning started for triage classification",
        "Ambulance location identified and nearest driver matched",
        "Driver notified; SMS queue prepared (send integration pending)",
        "Signal sequence armed: first signal -> second signal -> third signal",
      ]
    }

    const lines = [
      `Call from number ${phone} received`,
      "Extracting text from call audio pipeline",
      "Gemma reasoning completed for ASL / BSL / MSL triage",
      `Ambulance ${activeCase.ambulanceId || "AMB-001"} location resolved`,
      "Driver notified; SMS dispatch flow queued (integration pending)",
      "Signal sequence running: first signal -> second signal -> third signal",
    ]

    if (gps) lines.push(`Live speed ${gps.speed} km/h`)
    if (medicalBrief) lines.push("Hospital intake forwarded with structured brief")

    return lines
  }, [activeCase, gps, medicalBrief])

  useEffect(() => {
    setRevealedCount(0)
    const timeouts: number[] = []

    terminalLines.forEach((_, index) => {
      const timeoutId = window.setTimeout(() => {
        setRevealedCount(index + 1)
      }, index * 5000)
      timeouts.push(timeoutId)
    })

    return () => {
      timeouts.forEach((id) => window.clearTimeout(id))
    }
  }, [terminalLines])

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-bg">
      <div className="flex flex-1 overflow-hidden">
        <div className="relative min-w-0 flex-1 border-r border-border">
          <MapPanel
            gpsData={gps}
            signalState={signal}
            intersectionCoords={intersectionCoords}
            ambulances={trackedAmbulances}
            selectedAmbulanceId={selectedAmbulanceId}
            activeCase={activeCase}
            caseStatus={caseStatus}
          />

          <div className="absolute left-4 bottom-4 z-[1000] flex gap-2">
            {!activeCase && (
              <button
                onClick={handleStartDemo}
                className="rounded-sm border border-border bg-bg px-4 py-2 text-xs font-mono uppercase tracking-[0.18em] text-text transition-colors hover:border-border2 hover:bg-bg2"
              >
                Start Demo Call
              </button>
            )}
            {!medicalBrief && activeCase && (
              <button
                disabled={audioRunning}
                onClick={async () => {
                  if (audioRunning) return
                  setAudioRunning(true)
                  try {
                    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/demo/audio`, { method: "POST" })
                  } finally {
                    setTimeout(() => setAudioRunning(false), 12000)
                  }
                }}
                className={`rounded-sm border px-4 py-2 text-xs font-mono uppercase tracking-[0.18em] transition-colors ${
                  audioRunning
                    ? "cursor-not-allowed border-border text-text-muted"
                    : "border-border bg-bg text-text hover:border-border2 hover:bg-bg2"
                }`}
              >
                Run Medical Intake
              </button>
            )}
          </div>
        </div>

        <div className="flex h-full w-[320px] flex-col border-r border-border bg-bg2">
          <div className="shrink-0 border-b border-border">
            <SignalPanel
              state={signal}
              latency={latency}
              preemptionCount={preemptionCount}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col bg-bg p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
                  Ambulance Fleet
                </div>
                <div className="mt-1 text-sm text-text-dim">Select any unit to follow it on the map.</div>
              </div>
              <div className="rounded-sm border border-border bg-bg2 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-text">
                {trackedAmbulances.length} Live
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="space-y-2">
              {trackedAmbulances.map((ambulance) => {
                const selected = ambulance.id === selectedAmbulanceId

                return (
                  <button
                    key={ambulance.id}
                    onClick={() => setSelectedAmbulanceId(ambulance.id)}
                    className={`w-full rounded-sm border px-3 py-3 text-left transition-colors ${
                      selected
                        ? "border-red/40 bg-red/10"
                        : "border-border bg-bg2 hover:border-border2 hover:bg-bg3"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-semibold text-text">
                          <Ambulance className={`h-4 w-4 ${ambulance.isLive ? "text-red" : "text-cyan"}`} />
                          <span>{ambulance.id}</span>
                          {ambulance.isLive && (
                            <span className="rounded-full bg-red/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-red">
                              Live
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-text-dim">{ambulance.label}</div>
                        <div className="mt-2 text-xs text-text">{ambulance.status}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono uppercase tracking-[0.16em] text-text-muted">Speed</div>
                        <div className="mt-1 font-mono text-sm text-text">{Math.round(ambulance.speed)} km/h</div>
                      </div>
                    </div>
                  </button>
                )
              })}
              </div>
            </div>

            {selectedAmbulance && (
              <div className="mt-3 shrink-0 rounded-sm border border-border bg-bg2 px-3 py-3">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
                  <LocateFixed className="h-3.5 w-3.5 text-cyan" />
                  Tracking Now
                </div>
                <div className="mt-2 text-sm font-semibold text-text">
                  {selectedAmbulance.id} · {selectedAmbulance.label}
                </div>
                <div className="mt-1 text-xs text-text-dim">
                  {selectedAmbulance.lat.toFixed(4)}, {selectedAmbulance.lng.toFixed(4)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-52 flex-shrink-0 border-t border-border bg-black px-4 py-3">
        <div
          className="mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-400"
          style={{ fontFamily: "'Segoe UI', Calibri, Arial, sans-serif" }}
        >
          Event Logs
        </div>
        <div className="h-[calc(100%-20px)] overflow-auto bg-black px-2 py-1">
          <div
            className="space-y-1 text-sm text-slate-300"
            style={{
              fontFamily: "Consolas, 'Cascadia Mono', 'Courier New', monospace",
            }}
          >
            {terminalLines.slice(0, revealedCount).map((line, index) => (
              <div key={`${line}-${index}`} className="leading-6">
                <span className="text-slate-500">&gt;</span>{" "}
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

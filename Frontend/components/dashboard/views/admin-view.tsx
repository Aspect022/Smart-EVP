"use client"

import { useEffect, useMemo, useState } from "react"

import { MapPanel } from "@/components/dashboard/map-panel"
import { SignalPanel } from "@/components/dashboard/signal-panel"

interface AdminViewProps {
  gps: any
  signal: "RED" | "AMBER" | "GREEN"
  latency: number | null
  activeCase: any | null
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

        <div className="flex w-[220px] flex-col border-r border-border bg-bg2">
          <SignalPanel
            state={signal}
            latency={latency}
            preemptionCount={preemptionCount}
          />
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

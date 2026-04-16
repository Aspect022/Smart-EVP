"use client"

import { useMemo, useState } from "react"
import { Activity, PhoneCall, ShieldCheck, Siren } from "lucide-react"

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

  const compactStats = useMemo(
    () => [
      {
        label: "Signal",
        value: signal,
        icon: ShieldCheck,
        tone: signal === "GREEN" ? "text-green" : signal === "AMBER" ? "text-amber" : "text-red",
      },
      {
        label: "Latency",
        value: latency !== null ? `${(latency / 1000).toFixed(1)}s` : "--",
        icon: Activity,
        tone: "text-cyan",
      },
      {
        label: "Preemptions",
        value: `${preemptionCount}`,
        icon: Siren,
        tone: "text-amber",
      },
      {
        label: "Link",
        value: connected ? "LIVE" : "OFFLINE",
        icon: PhoneCall,
        tone: connected ? "text-green" : "text-red",
      },
    ],
    [connected, latency, preemptionCount, signal],
  )

  const terminalLines = useMemo(() => {
    if (!activeCase) {
      return [
        "[SYSTEM] Portal armed",
        "[QUEUE] Waiting for call",
        "[MQTT] Broker live",
      ]
    }

    const lines = [
      `[CALL] +91 XXXXX${String(activeCase.id).slice(-3)} connected`,
      `[CLASSIFY] ${activeCase.severity}`,
      "[TRIAGE] ASL / BSL / MSL",
      `[DISPATCH] ${activeCase.ambulanceId || "AMB-001"} assigned`,
    ]

    if (gps) lines.push(`[GPS] ${gps.speed} km/h`)
    if (medicalBrief) lines.push("[HOSPITAL] Intake forwarded")

    return lines
  }, [activeCase, gps, medicalBrief])

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
          <div className="border-t border-border bg-bg p-3">
            <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
              Live System State
            </div>
            <div className="space-y-2">
              {compactStats.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-sm border border-border bg-bg2 px-3 py-2">
                    <div className="mb-1 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
                      <Icon className={`h-3.5 w-3.5 ${item.tone}`} />
                      {item.label}
                    </div>
                    <div className={`font-mono text-sm font-semibold ${item.tone}`}>{item.value}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="h-52 flex-shrink-0 border-t border-border bg-[#081019] px-4 py-3">
        <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.18em] text-cyan/80">
          Event Logs
        </div>
        <div className="h-[calc(100%-24px)] overflow-auto rounded-sm border border-cyan/15 bg-bg/60 px-3 py-2">
          <div className="space-y-2 font-mono text-sm text-text-dim">
            {terminalLines.map((line, index) => (
              <div key={`${line}-${index}`} className="flex items-start gap-3 border-b border-cyan/10 pb-2 last:border-b-0 last:pb-0">
                <span className="text-cyan">[{String(index + 1).padStart(2, "0")}]</span>
                <span>$ {line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

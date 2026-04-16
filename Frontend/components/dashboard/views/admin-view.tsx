"use client"

import { useState } from "react"
import { MapPanel } from "@/components/dashboard/map-panel"
import { SignalPanel } from "@/components/dashboard/signal-panel"
import { CaseCard } from "@/components/dashboard/case-card"
import { MedicalBrief } from "@/components/dashboard/medical-brief"
import { AuditLog } from "@/components/dashboard/audit-log"
import { SystemMetrics } from "@/components/dashboard/system-metrics"

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
  handleStartDemo
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<"hospital" | "audit" | "metrics">("hospital")
  const [audioRunning, setAudioRunning] = useState(false)

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map Panel - 60% */}
        <div className="flex-[3] relative border-r border-border">
          <MapPanel
            gpsData={gps}
            signalState={signal}
            intersectionCoords={intersectionCoords}
          />
          {/* Developer Testing buttons (Visible in demo only) */}
          <div className="absolute left-4 bottom-4 z-[1000] flex gap-2">
            {!activeCase && (
                <button 
                  onClick={handleStartDemo}
                  className="px-4 py-2 bg-text text-bg font-bold opacity-50 hover:opacity-100 uppercase text-xs"
                >
                  🚀 Trigger Demo Case
                </button>
            )}
            {!medicalBrief && activeCase && (
                <button 
                  disabled={audioRunning}
                  onClick={async () => {
                      if (audioRunning) return
                      setAudioRunning(true)
                      try {
                        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/demo/audio`, { method: "POST" });
                      } finally {
                        // Audio pipeline takes ~10s, re-enable after
                        setTimeout(() => setAudioRunning(false), 12000)
                      }
                  }}
                  className={`px-4 py-2 border border-text font-bold uppercase text-xs transition-opacity ${
                    audioRunning ? "opacity-20 cursor-not-allowed" : "text-text opacity-50 hover:opacity-100"
                  }`}
                >
                  🎙️ Run Medical Audio
                </button>
            )}
          </div>
        </div>

        {/* Signal Panel - 20% */}
        <div className="flex-1 border-r border-border">
          <SignalPanel
            state={signal}
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
      <div className="border-t border-border h-72 flex-shrink-0 bg-bg">
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

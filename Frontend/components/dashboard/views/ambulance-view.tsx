"use client"

import { useMemo, useState } from "react"
import { CheckCircle, Navigation } from "lucide-react"

import type { CaseStatus, Hospital, HospitalRecommendation } from "@/hooks/use-socket"
import { MapPanel } from "@/components/dashboard/map-panel"
import { CorridorBar } from "@/components/ambulance/corridor-bar"
import { CasePanel } from "@/components/ambulance/case-panel"
import { TranscriptPanel } from "@/components/ambulance/transcript-panel"
import { CompactBrief } from "@/components/ambulance/compact-brief"
import { VoiceInputBox } from "@/components/ambulance/voice-input-box"
import { getBackendUrl } from "@/lib/socket"

interface AmbulanceViewProps {
  gps: any
  signal: "RED" | "AMBER" | "GREEN"
  distance: number | null
  intersectionCoords: { lat: number; lng: number }
  connected: boolean
  caseStatus: CaseStatus
  etaSeconds: number | null
  activeCase: any | null
  transcript: string
  brief: any | null
  selectedHospital: Hospital | null
  hospitalRecommendation: HospitalRecommendation | null
  rlDecision: any | null
  onSelectHospital: (id: string, name: string) => void
}

export function AmbulanceView({
  gps,
  signal,
  distance,
  intersectionCoords,
  connected,
  caseStatus,
  etaSeconds,
  activeCase,
  transcript,
  brief,
  selectedHospital,
  hospitalRecommendation,
  rlDecision,
  onSelectHospital,
}: AmbulanceViewProps) {
  // Local brief override from voice input — takes priority over socket brief
  const [localBrief, setLocalBrief] = useState<any | null>(null)
  const activeBrief = localBrief ?? brief

  const updateStatus = async (status: CaseStatus, eta?: number) => {
    try {
      const payload: any = { status }
      if (eta !== undefined) payload.etaSeconds = eta
      await fetch(`${getBackendUrl()}/api/case/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      console.error("Failed to update status", error)
    }
  }

  const derivedEta = useMemo(() => {
    if (etaSeconds !== null && etaSeconds > 0) return etaSeconds
    if (distance !== null && distance > 0) {
      return Math.max(30, Math.floor(distance / 10))
    }
    return null
  }, [distance, etaSeconds])

  const triggerDistance = rlDecision?.trigger_distance_m ?? 500

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg">

      {/* ── Row 1: Map (55%) + Case Panel (45%) ────────────────────── */}
      <div className="flex min-h-0" style={{ flex: "0 0 55%" }}>
        {/* Map */}
        <div className="flex-1 min-w-0">
          <MapPanel
            gpsData={gps}
            signalState={signal}
            intersectionCoords={intersectionCoords}
            activeCase={activeCase}
            caseStatus={caseStatus}
          />
        </div>

        {/* Case Panel */}
        <div className="w-[340px] shrink-0 border-l border-border">
          <CasePanel
            activeCase={activeCase}
            caseStatus={caseStatus}
            etaSeconds={derivedEta}
            selectedHospital={selectedHospital}
            hospitalRecommendation={hospitalRecommendation}
            onSelectHospital={onSelectHospital}
          />
        </div>
      </div>

      {/* ── Row 2: Signal Corridor Bar ──────────────────────────────── */}
      <div className="shrink-0">
        <CorridorBar
          signal={signal}
          distance={distance}
          triggerDistance={triggerDistance}
        />
      </div>

      {/* ── Row 3: Transcript + Voice Input + Compact Brief ─────────── */}
      <div className="flex min-h-0 flex-1 border-t border-border">
        {/* Left: Transcript + Voice Input stacked */}
        <div className="flex flex-1 min-w-0 flex-col">
          <div className="flex-1 min-h-0">
            <TranscriptPanel transcript={transcript} />
          </div>
          <VoiceInputBox onBriefGenerated={setLocalBrief} />
        </div>
        {/* Right: AI Brief */}
        <div className="w-[320px] shrink-0 border-l border-border">
          <CompactBrief brief={activeBrief} />
        </div>
      </div>

      {/* ── Row 4: Status Action Buttons ────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 border-t border-border bg-bg px-5 py-3">
        {caseStatus !== "EN_ROUTE_HOSPITAL" && caseStatus !== "ARRIVING" && activeCase && (
          <button
            onClick={() => updateStatus("PATIENT_PICKED", 180)}
            className="inline-flex items-center gap-2 border border-amber/40 bg-amber/10 px-5 py-2 text-xs font-mono uppercase tracking-widest text-amber-400 transition-colors hover:bg-amber/15"
          >
            <CheckCircle className="h-4 w-4" />
            Patient Picked
          </button>
        )}

        {(caseStatus === "PATIENT_PICKED" || caseStatus === "EN_ROUTE_HOSPITAL") && (
          <button
            onClick={() => updateStatus("EN_ROUTE_HOSPITAL", 320)}
            className="inline-flex items-center gap-2 border border-green/40 bg-green/10 px-5 py-2 text-xs font-mono uppercase tracking-widest text-green transition-colors hover:bg-green/15"
          >
            <Navigation className="h-4 w-4" />
            En Route Hospital
          </button>
        )}

        {caseStatus === "EN_ROUTE_HOSPITAL" && distance !== null && distance < 2000 && (
          <button
            onClick={() => updateStatus("ARRIVING", 60)}
            className="inline-flex items-center gap-2 border border-red/40 bg-red/10 px-5 py-2 text-xs font-mono uppercase tracking-widest text-red transition-colors hover:bg-red/15"
          >
            Final Approach
          </button>
        )}

        {/* RL info chip */}
        {rlDecision && (
          <div className="ml-auto text-right">
            <div className="text-[9px] font-mono text-text-muted">RL Threshold</div>
            <div className="text-xs font-mono text-cyan">
              {rlDecision.trigger_distance_m}m · {rlDecision.green_duration_s}s green
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import type { Hospital, HospitalRecommendation, CaseStatus } from "@/hooks/use-socket"

interface CasePanelProps {
  activeCase: any | null
  caseStatus: CaseStatus
  etaSeconds: number | null
  selectedHospital: Hospital | null
  hospitalRecommendation: HospitalRecommendation | null
  onSelectHospital: (id: string, name: string) => void
}

const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; bg: string }> = {
  CALL_RECEIVED:    { label: "Call Received",    color: "text-text-muted", bg: "bg-text-muted/10" },
  DISPATCHED:       { label: "Dispatched",       color: "text-amber-400",  bg: "bg-amber/10" },
  EN_ROUTE_PATIENT: { label: "En Route Patient", color: "text-cyan",       bg: "bg-cyan/10" },
  PATIENT_PICKED:   { label: "Patient On Board", color: "text-cyan",       bg: "bg-cyan/10" },
  EN_ROUTE_HOSPITAL:{ label: "En Route Hospital",color: "text-green",      bg: "bg-green/10" },
  ARRIVING:         { label: "Arriving",         color: "text-green",      bg: "bg-green/15" },
}

function formatEta(seconds: number | null): string {
  if (seconds === null) return "--:--"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function CasePanel({
  activeCase,
  caseStatus,
  etaSeconds,
  selectedHospital,
  hospitalRecommendation,
  onSelectHospital,
}: CasePanelProps) {
  const [showHospitalList, setShowHospitalList] = useState(false)
  const status = STATUS_CONFIG[caseStatus]

  if (!activeCase) {
    return (
      <div className="flex items-center justify-center h-full bg-bg2 border border-border p-6">
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-30">🚑</div>
          <p className="text-text-muted font-mono text-sm">Awaiting dispatch...</p>
        </div>
      </div>
    )
  }

  const alternatives = hospitalRecommendation?.alternatives ?? []
  const allRanked = hospitalRecommendation?.all_ranked ?? []

  return (
    <div className="bg-bg2 border border-border flex flex-col h-full overflow-hidden">
      {/* Case Header */}
      <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-0.5">
            Active Case
          </div>
          <div className="font-mono text-base font-bold text-text">{activeCase.id}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`text-xs font-mono px-2 py-0.5 rounded-sm uppercase font-bold ${
            activeCase.severity === "CRITICAL" ? "bg-red/15 text-red border border-red/30" :
            activeCase.severity === "HIGH"     ? "bg-amber/15 text-amber-400 border border-amber/30" :
            "bg-cyan/10 text-cyan border border-cyan/30"
          }`}>
            {activeCase.severity}
          </span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded-sm uppercase ${status.bg} ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Patient & Location */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-mono text-text-muted uppercase w-20 shrink-0 pt-0.5">Location</span>
          <span className="text-sm text-text">{activeCase.location}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-mono text-text-muted uppercase w-20 shrink-0 pt-0.5">Complaint</span>
          <span className="text-sm text-text">{activeCase.complaint}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[10px] font-mono text-text-muted uppercase w-20 shrink-0 pt-0.5">Unit</span>
          <span className="text-sm text-text font-mono">{activeCase.ambulanceId}</span>
        </div>
      </div>

      {/* ETA */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest">ETA</div>
          <div className="font-mono text-3xl font-bold text-cyan tabular-nums" suppressHydrationWarning>
            {formatEta(etaSeconds)}
          </div>
        </div>
        {etaSeconds !== null && etaSeconds > 0 && (
          <div className="text-right">
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Countdown</div>
            <div className="w-24 h-1.5 bg-border rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-cyan rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(5, Math.min(100, 100 - (etaSeconds / 300) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Hospital Selection */}
      <div className="px-4 py-3 flex-1 overflow-y-auto">
        <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">
          Destination Hospital
        </div>

        {selectedHospital ? (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-sm font-bold text-text">{selectedHospital.name}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {selectedHospital.distance_km != null && (
                    <span className="text-xs text-text-muted">{selectedHospital.distance_km}km away</span>
                  )}
                  {selectedHospital.tag && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm uppercase ${
                      selectedHospital.tag === "RECOMMENDED"
                        ? "bg-green/10 text-green border border-green/30"
                        : "bg-border text-text-muted"
                    }`}>
                      {selectedHospital.tag}
                    </span>
                  )}
                  {hospitalRecommendation?.ai_model_used && (
                    <span className="text-[9px] font-mono text-purple-400">
                      ● {hospitalRecommendation.ai_model_used.toUpperCase()} ranked
                    </span>
                  )}
                </div>
                {selectedHospital.reasoning && (
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    {selectedHospital.reasoning}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowHospitalList(!showHospitalList)}
                className="text-[10px] font-mono px-2 py-1 border border-border text-text-muted hover:text-text hover:border-cyan/50 uppercase tracking-wider transition-colors shrink-0"
              >
                Change ▼
              </button>
            </div>

            {/* Hospital override list */}
            {showHospitalList && allRanked.length > 0 && (
              <div className="mt-2 border border-border rounded-sm overflow-hidden">
                {allRanked.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      onSelectHospital(h.id, h.name)
                      setShowHospitalList(false)
                    }}
                    className={`w-full text-left px-3 py-2 border-b border-border/50 last:border-0 hover:bg-bg transition-colors ${
                      selectedHospital.id === h.id ? "bg-cyan/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-mono text-text">{h.short_name}</div>
                        <div className="text-[10px] text-text-muted">{h.distance_km}km · {h.type}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono text-cyan">{h.score ?? "—"}</div>
                        <div className="text-[9px] text-text-muted">score</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-text-muted">
            <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
            <span className="text-xs font-mono">AI selecting optimal hospital...</span>
          </div>
        )}
      </div>
    </div>
  )
}

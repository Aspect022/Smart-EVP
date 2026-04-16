"use client"

import { useMemo, useState } from "react"
import { CheckCircle, Clock, Navigation, Route, ShieldCheck } from "lucide-react"

import type { CaseStatus } from "@/hooks/use-socket"
import { MapPanel } from "@/components/dashboard/map-panel"

import { AmbulanceAudioPanel } from "./ambulance-audio-panel"

interface AmbulanceViewProps {
  gps: any
  signal: "RED" | "AMBER" | "GREEN"
  distance: number | null
  intersectionCoords: { lat: number; lng: number }
  connected: boolean
  caseStatus: CaseStatus
  etaSeconds: number | null
}

function formatEta(seconds: number | null) {
  if (seconds === null || seconds <= 0) return "--:--"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function AmbulanceView({
  gps,
  signal,
  distance,
  intersectionCoords,
  connected,
  caseStatus,
  etaSeconds,
}: AmbulanceViewProps) {
  const updateStatus = async (status: CaseStatus, eta?: number) => {
    try {
      const payload: any = { status }
      if (eta !== undefined) payload.etaSeconds = eta
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/api/case/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      console.error("Failed to update status", error)
    }
  }

  // Fallback ETA from distance when backend ETA is unavailable.
  const derivedEta = useMemo(() => {
    if (etaSeconds !== null && etaSeconds > 0) return etaSeconds
    if (distance !== null && distance > 0) {
      const avgMetersPerSecond = 10
      return Math.max(30, Math.floor(distance / avgMetersPerSecond))
    }
    return null
  }, [distance, etaSeconds])

  const routeSummary = useMemo(() => {
    if (caseStatus === "EN_ROUTE_HOSPITAL" || caseStatus === "ARRIVING") {
      return "Patient Transport"
    }
    if (caseStatus === "PATIENT_PICKED") return "Patient Onboard"
    if (caseStatus === "DISPATCHED" || caseStatus === "EN_ROUTE_PATIENT") return "Approaching Pickup"
    return "Standby"
  }, [caseStatus])

  return (
    <div className="flex h-full flex-1 overflow-hidden bg-bg">
      <div className="flex min-w-0 flex-[1.9] flex-col">
        <div className="grid gap-3 border-b border-border bg-bg px-5 py-4 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="rounded-sm border border-border bg-bg2 px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
              <Route className="h-3.5 w-3.5 text-cyan" />
              Route Status
            </div>
            <div className="font-mono text-base font-semibold uppercase tracking-[0.1em] text-text">
              {routeSummary}
            </div>
          </div>

          <div className="rounded-sm border border-border bg-bg2 px-3 py-3">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
              <Clock className="h-3.5 w-3.5 text-amber" />
              ETA
            </div>
            <div className="font-mono text-xl font-semibold text-text">{formatEta(derivedEta)}</div>
          </div>

          <div className="rounded-sm border border-border bg-bg2 px-3 py-3">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-green" />
              Link / Signal
            </div>
            <div className="font-mono text-sm text-text">
              {connected ? "LIVE" : "OFFLINE"} · {signal}
            </div>
          </div>
        </div>

        <div className="flex-1 p-3">
          {/* Use the same map system as Admin until Google Maps integration is finalized. */}
          <MapPanel
            gpsData={gps}
            signalState={signal}
            intersectionCoords={intersectionCoords}
          />
        </div>

        <div className="flex min-h-24 flex-wrap items-center gap-3 border-t border-border bg-bg px-5 py-4">
          {caseStatus !== "EN_ROUTE_HOSPITAL" && caseStatus !== "ARRIVING" && (
            <button
              onClick={() => updateStatus("PATIENT_PICKED", 180)}
              className="inline-flex items-center gap-2 rounded-sm border border-amber/40 bg-amber/10 px-5 py-2.5 text-xs font-mono uppercase tracking-[0.18em] text-amber transition-colors hover:bg-amber/15"
            >
              <CheckCircle className="h-4 w-4" />
              Patient Picked
            </button>
          )}

          {(caseStatus === "PATIENT_PICKED" || caseStatus === "EN_ROUTE_HOSPITAL") && (
            <button
              onClick={() => updateStatus("EN_ROUTE_HOSPITAL", 320)}
              className="inline-flex items-center gap-2 rounded-sm border border-green/40 bg-green/10 px-5 py-2.5 text-xs font-mono uppercase tracking-[0.18em] text-green transition-colors hover:bg-green/15"
            >
              <Navigation className="h-4 w-4" />
              To Hospital
            </button>
          )}

          {caseStatus === "EN_ROUTE_HOSPITAL" && distance !== null && distance < 2000 && (
            <button
              onClick={() => updateStatus("ARRIVING", 60)}
              className="inline-flex items-center gap-2 rounded-sm border border-red/40 bg-red/10 px-5 py-2.5 text-xs font-mono uppercase tracking-[0.18em] text-red transition-colors hover:bg-red/15"
            >
              Final Approach
            </button>
          )}
        </div>
      </div>

      <AmbulanceAudioPanel />
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
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
  if (seconds === null) return "--:--"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
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

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  const hospitalLoc = "Fortis+Hospital+Bannerghatta+Road+Bengaluru"
  const patientLoc = "BTM+Layout+Bengaluru"
  const mapOrigin = caseStatus === "EN_ROUTE_HOSPITAL" ? patientLoc : "Jayanagar+Bengaluru"
  const mapDest = caseStatus === "EN_ROUTE_HOSPITAL" ? hospitalLoc : patientLoc

  const [localEta, setLocalEta] = useState<number | null>(etaSeconds)

  useEffect(() => {
    if (etaSeconds !== null) setLocalEta(etaSeconds)
  }, [etaSeconds])

  useEffect(() => {
    if (localEta === null || localEta <= 0) return
    const interval = setInterval(() => setLocalEta((prev) => (prev && prev > 0 ? prev - 1 : 0)), 1000)
    return () => clearInterval(interval)
  }, [localEta])

  const routeSummary = useMemo(() => {
    if (caseStatus === "EN_ROUTE_HOSPITAL" || caseStatus === "ARRIVING") {
      return "Patient onboard. Continue transport to receiving hospital."
    }
    if (caseStatus === "PATIENT_PICKED") {
      return "Patient secured. Confirm departure when ready."
    }
    if (caseStatus === "DISPATCHED" || caseStatus === "EN_ROUTE_PATIENT") {
      return "Proceeding to patient pickup location."
    }
    return "Unit standing by for dispatch."
  }, [caseStatus])

  const statusSteps = [
    "DISPATCHED",
    "PATIENT_PICKED",
    "EN_ROUTE_HOSPITAL",
    "ARRIVING",
  ]

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      <div className="flex flex-[3] flex-col bg-bg2">
        <div className="grid gap-3 border-b border-border bg-bg px-4 py-3 md:grid-cols-4">
          <div className="rounded-sm border border-border bg-bg2 p-4 md:col-span-2">
            <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
              <Route className="h-3.5 w-3.5 text-cyan" />
              Route status
            </div>
            <div className="text-lg font-semibold text-text">{routeSummary}</div>
          </div>

          <div className="rounded-sm border border-border bg-bg2 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
              <Clock className="h-3.5 w-3.5 text-amber" />
              ETA
            </div>
            <div className="text-3xl font-semibold text-text">{formatEta(localEta)}</div>
          </div>

          <div className="rounded-sm border border-border bg-bg2 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-green" />
              Link / Signal
            </div>
            <div className="text-sm text-text">
              {connected ? "Backend connected" : "Offline"} · {signal}
            </div>
          </div>
        </div>

        <div className="border-b border-border bg-bg px-4 py-3">
          <div className="flex flex-wrap gap-3">
            {statusSteps.map((step, index) => {
              const active =
                statusSteps.indexOf(caseStatus) >= index || (caseStatus === "ARRIVING" && step === "ARRIVING")
              return (
                <div
                  key={step}
                  className={`rounded-sm border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] ${
                    active
                      ? "border-cyan/30 bg-cyan/10 text-cyan"
                      : "border-border bg-bg2 text-text-muted"
                  }`}
                >
                  {step.replaceAll("_", " ")}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1 bg-bg">
          {caseStatus === "ARRIVING" ? (
            <MapPanel
              gpsData={gps}
              signalState={signal}
              intersectionCoords={intersectionCoords}
            />
          ) : (
            <div className="relative h-full p-3">
              {!mapsKey ? (
                <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-border bg-bg3/40 p-8 text-center">
                  <p className="max-w-md text-sm text-text-dim">
                    Embedded navigation is not configured in this environment. Use the external route link below for live driving directions.
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${mapOrigin}&destination=${mapDest}&travelmode=driving`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-sm border border-border bg-bg px-5 py-3 text-xs font-mono uppercase tracking-[0.18em] text-text transition-colors hover:border-border2 hover:bg-bg2"
                  >
                    <Navigation className="h-4 w-4" />
                    Open External Navigation
                  </a>
                </div>
              ) : (
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0, borderRadius: "8px" }}
                  src={`https://www.google.com/maps/embed/v1/directions?key=${mapsKey}&origin=${mapOrigin}&destination=${mapDest}&mode=driving`}
                  allowFullScreen
                />
              )}

              <div className="absolute bottom-6 left-6 rounded-sm border border-border bg-bg/95 px-4 py-3 backdrop-blur-sm">
                <div className="mb-1 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                  Vehicle telemetry
                </div>
                <div className="text-2xl font-semibold text-text">
                  {gps ? gps.speed : "--"} <span className="text-sm font-normal text-text-muted">km/h</span>
                </div>
                <div className="mt-1 text-sm text-text-dim">
                  {distance !== null ? `${distance} m to signal target` : "Distance unavailable"}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex min-h-28 flex-wrap items-center gap-4 border-t border-border bg-bg px-4 py-4">
          {caseStatus !== "EN_ROUTE_HOSPITAL" && caseStatus !== "ARRIVING" && (
            <button
              onClick={() => updateStatus("PATIENT_PICKED", 180)}
              className="inline-flex items-center gap-3 rounded-sm border border-amber/40 bg-amber/10 px-6 py-3 text-sm font-mono uppercase tracking-[0.18em] text-amber transition-colors hover:bg-amber/15"
            >
              <CheckCircle className="h-4 w-4" />
              Confirm Patient Pickup
            </button>
          )}
          {(caseStatus === "PATIENT_PICKED" || caseStatus === "EN_ROUTE_HOSPITAL") && (
            <button
              onClick={() => updateStatus("EN_ROUTE_HOSPITAL", 320)}
              className="inline-flex items-center gap-3 rounded-sm border border-green/40 bg-green/10 px-6 py-3 text-sm font-mono uppercase tracking-[0.18em] text-green transition-colors hover:bg-green/15"
            >
              <Navigation className="h-4 w-4" />
              Depart For Hospital
            </button>
          )}
          {caseStatus === "EN_ROUTE_HOSPITAL" && distance !== null && distance < 2000 && (
            <button
              onClick={() => updateStatus("ARRIVING", 60)}
              className="inline-flex items-center gap-3 rounded-sm border border-red/40 bg-red/10 px-6 py-3 text-sm font-mono uppercase tracking-[0.18em] text-red transition-colors hover:bg-red/15"
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

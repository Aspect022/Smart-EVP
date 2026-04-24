"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, Download, HeartPulse, MapPin, Siren, Timer } from "lucide-react"

import type { CaseStatus, Hospital, HospitalRecommendation } from "@/hooks/use-socket"

interface HospitalViewProps {
  brief: any
  transcript: string
  activeCase: any
  distance: number | null
  connected: boolean
  caseStatus: CaseStatus
  etaSeconds: number | null
  selectedHospital: Hospital | null
  hospitalRecommendation: HospitalRecommendation | null
}

interface IncomingCase {
  id: string
  patientName: string
  severity: string
  location: string
  complaint: string
  status: CaseStatus
  etaSeconds: number | null
  distance: number | null
  brief: any
  transcript: string
  createdAt: number
}

interface TimelineEntry {
  key: string
  label: string
  detail: string
  done: boolean
  active: boolean
}

function formatEta(seconds: number | null) {
  if (seconds === null || seconds <= 0) return "--:--"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function safeText(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not available"
  return String(value)
}

function toHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function buildPatientName(caseData: any, briefData: any, fallbackIndex: number) {
  const fromBrief = briefData?.patientName || briefData?.name
  if (fromBrief) return String(fromBrief)
  const caseId = caseData?.id || caseData?.case_id
  if (caseId) return `Patient ${caseId}`
  return `Patient ${fallbackIndex + 1}`
}

function buildTimeline(caseData: IncomingCase): TimelineEntry[] {
  const status = caseData.status
  const hasClinicalData = Boolean(caseData.transcript || caseData.brief)

  return [
    {
      key: "call",
      label: "Call received",
      detail: `Control center received an emergency request from ${caseData.location}.`,
      done: true,
      active: status === "CALL_RECEIVED",
    },
    {
      key: "dispatch",
      label: "Ambulance dispatched",
      detail: "Nearest ambulance was routed to the patient home.",
      done: status !== "CALL_RECEIVED",
      active: status === "DISPATCHED" || status === "EN_ROUTE_PATIENT",
    },
    {
      key: "patient",
      label: "Patient reached",
      detail: "Crew reached the requested address and began field assessment.",
      done: status === "PATIENT_PICKED" || status === "EN_ROUTE_HOSPITAL" || status === "ARRIVING",
      active: status === "PATIENT_PICKED",
    },
    {
      key: "intake",
      label: "Medical intake prepared",
      detail: hasClinicalData ? "Transcript and structured brief are available." : "Waiting for transcript and brief from the ambulance.",
      done: hasClinicalData,
      active: !hasClinicalData && (status === "PATIENT_PICKED" || status === "EN_ROUTE_HOSPITAL"),
    },
    {
      key: "route",
      label: "Hospital route active",
      detail: "Patient is now on the hospital-bound leg.",
      done: status === "EN_ROUTE_HOSPITAL" || status === "ARRIVING",
      active: status === "EN_ROUTE_HOSPITAL",
    },
    {
      key: "arrival",
      label: "Final approach",
      detail: "Ambulance is approaching the hospital handoff point.",
      done: status === "ARRIVING",
      active: status === "ARRIVING",
    },
  ]
}

export function HospitalView({
  brief,
  transcript,
  activeCase,
  distance,
  connected,
  caseStatus,
  etaSeconds,
  selectedHospital,
  hospitalRecommendation,
}: HospitalViewProps) {
  const [cases, setCases] = useState<IncomingCase[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [alertMessage, setAlertMessage] = useState<string>("")
  const seenCaseIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!activeCase) return

    const caseId = String(activeCase.id || activeCase.case_id || `CASE-${Date.now()}`)
    const didCreate = !seenCaseIdsRef.current.has(caseId)
    if (didCreate) seenCaseIdsRef.current.add(caseId)

    setCases((prev) => {
      const exists = prev.some((item) => item.id === caseId)
      if (exists) {
        return prev.map((item) =>
          item.id === caseId
            ? {
                ...item,
                location: activeCase.location || item.location,
                severity: activeCase.severity || item.severity,
                complaint: activeCase.complaint || item.complaint,
                status: caseStatus,
                etaSeconds: etaSeconds ?? item.etaSeconds,
                distance: distance ?? item.distance,
                brief: brief || item.brief,
                transcript: transcript || item.transcript,
              }
            : item,
        )
      }

      const newCase: IncomingCase = {
        id: caseId,
        patientName: buildPatientName(activeCase, brief, prev.length),
        severity: activeCase.severity || "PENDING",
        location: activeCase.location || "Unknown",
        complaint: activeCase.complaint || "Incoming patient",
        status: caseStatus,
        etaSeconds: etaSeconds ?? null,
        distance: distance ?? null,
        brief: brief || null,
        transcript: transcript || "",
        createdAt: Date.now(),
      }
      return [newCase, ...prev]
    })

    if (didCreate) {
      const incomingName = buildPatientName(activeCase, brief, 0)
      setSelectedCaseId(caseId)
      setAlertMessage(`Control room linked ${incomingName} to this hospital`)
      const timeout = window.setTimeout(() => setAlertMessage(""), 4200)
      return () => window.clearTimeout(timeout)
    }
  }, [activeCase, caseStatus, etaSeconds, distance, brief, transcript])

  useEffect(() => {
    if (cases.length === 0) {
      setSelectedCaseId(null)
      return
    }
    if (!selectedCaseId || !cases.some((item) => item.id === selectedCaseId)) {
      setSelectedCaseId(cases[0].id)
    }
  }, [cases, selectedCaseId])

  useEffect(() => {
    if (
      !activeCase &&
      !brief &&
      !transcript &&
      etaSeconds === null &&
      distance === null &&
      caseStatus === "CALL_RECEIVED"
    ) {
      setCases([])
      setSelectedCaseId(null)
      setAlertMessage("")
      seenCaseIdsRef.current.clear()
    }
  }, [activeCase, brief, transcript, etaSeconds, distance, caseStatus])

  const selectedCase = useMemo(() => {
    if (!selectedCaseId) return null
    return cases.find((item) => item.id === selectedCaseId) || null
  }, [cases, selectedCaseId])
  const timeline = useMemo(() => (selectedCase ? buildTimeline(selectedCase) : []), [selectedCase])

  const exportCasePdf = () => {
    if (!selectedCase) return

    const lines = [
      "SmartEVP Hospital Intake Summary",
      "===============================",
      "",
      `Case ID: ${selectedCase.id}`,
      `Patient: ${selectedCase.patientName}`,
      `Status: ${selectedCase.status.replaceAll("_", " ")}`,
      `Priority: ${safeText(selectedCase.brief?.priority || selectedCase.severity)}`,
      `ETA: ${formatEta(selectedCase.etaSeconds)}`,
      `Location: ${safeText(selectedCase.location)}`,
      `Distance: ${selectedCase.distance ? `${selectedCase.distance} m` : "Not available"}`,
      "",
      `Complaint: ${safeText(selectedCase.complaint)}`,
      `Suspected Diagnosis: ${safeText(selectedCase.brief?.suspectedDiagnosis)}`,
      `Heart Risk / Cardiac Context: ${safeText(selectedCase.brief?.notes)}`,
      "",
      `BP: ${safeText(selectedCase.brief?.vitals?.bp)}`,
      `HR: ${safeText(selectedCase.brief?.vitals?.hr)}`,
      `SpO2: ${safeText(selectedCase.brief?.vitals?.spo2)}`,
      `GCS: ${safeText(selectedCase.brief?.vitals?.gcs)}`,
      "",
      `Medications: ${safeText(selectedCase.brief?.medications)}`,
      `Allergies: ${safeText(selectedCase.brief?.allergies)}`,
      "",
      "Transcript:",
      selectedCase.transcript || "Not available",
    ]

    const printWindow = window.open("", "_blank", "width=1000,height=720")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Case ${toHtml(selectedCase.id)}</title>
          <style>
            body { font-family: "Segoe UI", Arial, sans-serif; margin: 30px; color: #111; }
            h1 { font-size: 18px; margin-bottom: 12px; }
            pre { white-space: pre-wrap; line-height: 1.5; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>Case ${toHtml(selectedCase.id)} - Hospital Intake Summary</h1>
          <pre>${toHtml(lines.join("\n"))}</pre>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    window.setTimeout(() => printWindow.print(), 250)
  }

  if (cases.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-bg2 px-6">
        <div className="w-full max-w-3xl rounded-md border border-border bg-bg p-10">
          <div className="mb-4 flex items-center gap-2 text-text">
            <Siren className="h-5 w-5 text-red" />
            <h2 className="font-mono text-2xl font-semibold uppercase tracking-[0.1em]">
              Waiting For Incoming Cases
            </h2>
          </div>
          <p className="text-sm text-text-dim">
            New cases will appear on the right as live alerts. Select a case to open full patient, route, ETA, and clinical details.
          </p>
          <div className="mt-6 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
            Backend link: {connected ? "Connected" : "Offline"}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden bg-bg">
      {alertMessage && (
        <div className="flex items-center gap-2 border-b border-red/40 bg-red/10 px-5 py-2">
          <AlertTriangle className="h-4 w-4 text-red" />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-red">{alertMessage}</span>
        </div>
      )}

      <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-h-0 overflow-y-auto border-r border-border px-6 py-5">
          {selectedCase ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4 rounded-sm border border-border bg-bg2 p-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                    Selected Case
                  </div>
                  <h3 className="mt-1 font-mono text-2xl font-semibold uppercase tracking-[0.08em] text-text">
                    {selectedCase.patientName}
                  </h3>
                  <div className="mt-2 text-sm text-text-dim">
                    Case {selectedCase.id} · {selectedCase.status.replaceAll("_", " ")}
                  </div>
                </div>
                <button
                  onClick={exportCasePdf}
                  className="inline-flex items-center gap-2 rounded-sm border border-border bg-bg px-3 py-2 text-xs font-mono uppercase tracking-[0.18em] text-text transition-colors hover:border-border2"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-sm border border-border bg-bg2 p-4">
                  <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">ETA</div>
                  <div className="font-mono text-2xl text-text">{formatEta(selectedCase.etaSeconds)}</div>
                  {selectedCase.etaSeconds !== null && selectedCase.etaSeconds > 0 && (
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full bg-cyan transition-all duration-1000"
                        style={{ width: `${Math.max(5, Math.min(100, 100 - (selectedCase.etaSeconds / 300) * 100))}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="rounded-sm border border-border bg-bg2 p-4">
                  <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">Priority</div>
                  <div className="font-mono text-2xl text-text">{safeText(selectedCase.brief?.priority || selectedCase.severity)}</div>
                </div>
                <div className="rounded-sm border border-border bg-bg2 p-4">
                  <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">Distance</div>
                  <div className="font-mono text-2xl text-text">
                    {selectedCase.distance ? `${selectedCase.distance} m` : "--"}
                  </div>
                </div>
                <div className="rounded-sm border border-border bg-bg2 p-4">
                  <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">Backend</div>
                  <div className={`font-mono text-lg ${connected ? "text-green" : "text-red"}`}>
                    {connected ? "Connected" : "Offline"}
                  </div>
                </div>
              </div>

              {/* Hospital destination card */}
              {selectedHospital && (
                <div className="rounded-sm border border-green/30 bg-green/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-mono uppercase tracking-[0.18em] text-green">Destination Hospital</div>
                    {hospitalRecommendation?.ai_model_used && (
                      <span className="text-[9px] font-mono text-purple-400">
                        ● {hospitalRecommendation.ai_model_used.toUpperCase()} ranked
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-lg font-bold text-text">{selectedHospital.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-text-muted">
                    {selectedHospital.distance_km != null && (
                      <span>{selectedHospital.distance_km}km from patient</span>
                    )}
                    {selectedHospital.type && <span>· {selectedHospital.type}</span>}
                    {selectedHospital.beds_icu && <span>· {selectedHospital.beds_icu} ICU beds</span>}
                  </div>
                  {selectedHospital.reasoning && (
                    <p className="mt-2 text-xs text-text-muted leading-relaxed">
                      {selectedHospital.reasoning}
                    </p>
                  )}
                  {selectedHospital.specialties?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedHospital.specialties.map((s: string) => (
                        <span key={s} className="text-[10px] font-mono px-1.5 py-0.5 bg-green/10 text-green border border-green/20 rounded-sm">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-sm border border-border bg-bg2 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                    <MapPin className="h-4 w-4 text-green" />
                    Route + Patient
                  </div>
                  <div className="space-y-2 text-sm text-text-dim">
                    <p><span className="text-text">Location:</span> {safeText(selectedCase.location)}</p>
                    <p><span className="text-text">Complaint:</span> {safeText(selectedCase.complaint)}</p>
                    <p><span className="text-text">Suspected diagnosis:</span> {safeText(selectedCase.brief?.suspectedDiagnosis)}</p>
                  </div>
                </div>

                <div className="rounded-sm border border-border bg-bg2 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                    <HeartPulse className="h-4 w-4 text-red" />
                    Vitals / Cardiac Context
                  </div>
                  <div className="grid gap-2 text-sm text-text-dim">
                    <p><span className="text-text">BP:</span> {safeText(selectedCase.brief?.vitals?.bp)}</p>
                    <p><span className="text-text">HR:</span> {safeText(selectedCase.brief?.vitals?.hr)}</p>
                    <p><span className="text-text">SpO2:</span> {safeText(selectedCase.brief?.vitals?.spo2)}</p>
                    <p><span className="text-text">GCS:</span> {safeText(selectedCase.brief?.vitals?.gcs)}</p>
                    <p><span className="text-text">Heart disease notes:</span> {safeText(selectedCase.brief?.notes)}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-sm border border-border bg-bg2 p-4">
                  <div className="mb-3 text-sm font-semibold text-text">Incident Timeline</div>
                  <div className="space-y-3">
                    {timeline.map((item) => (
                      <div key={item.key} className="flex gap-3">
                        <div
                          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: item.done ? "#22c55e" : item.active ? "#f59e0b" : "#475569",
                          }}
                        />
                        <div>
                          <div className={`text-sm ${item.done || item.active ? "text-text" : "text-text-dim"}`}>
                            {item.label}
                          </div>
                          <div className="mt-1 text-xs text-text-dim">{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-sm border border-border bg-bg2 p-4">
                  <div className="mb-3 text-sm font-semibold text-text">Medication / Allergy</div>
                  <div className="space-y-2 text-sm text-text-dim">
                    <p><span className="text-text">Medications:</span> {safeText(selectedCase.brief?.medications)}</p>
                    <p><span className="text-text">Allergies:</span> {safeText(selectedCase.brief?.allergies)}</p>
                  </div>
                </div>

                <div className="rounded-sm border border-border bg-bg2 p-4">
                  <div className="mb-3 text-sm font-semibold text-text">Required Resources</div>
                  <div className="space-y-2 text-sm text-text-dim">
                    {(selectedCase.brief?.resources?.length ? selectedCase.brief.resources : ["ER bed", "Cardiac monitor", "On-call physician"]).map(
                      (item: string, index: number) => (
                        <p key={`${item}-${index}`}>- {item}</p>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-sm border border-border bg-bg2 p-4">
                <div className="mb-3 text-sm font-semibold text-text">Paramedic Transcript</div>
                <div className="rounded-sm border border-border bg-bg p-4 font-mono text-sm leading-7 text-text-dim">
                  {selectedCase.transcript || "Waiting for transcript..."}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="min-h-0 overflow-y-auto bg-bg2 px-4 py-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-text-muted">
            <Siren className="h-4 w-4 text-red" />
            Incoming Case Alerts
          </div>

          <div className="space-y-2">
            {cases.map((item) => {
              const isSelected = item.id === selectedCaseId
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedCaseId(item.id)}
                  className={`w-full rounded-sm border p-3 text-left transition-colors ${
                    isSelected ? "border-cyan/50 bg-cyan/10" : "border-border bg-bg hover:border-border2"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-mono text-xs uppercase tracking-[0.18em] text-text">{item.id}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                      <Timer className="mr-1 inline h-3 w-3" />
                      {formatEta(item.etaSeconds)}
                    </span>
                  </div>
                  <div className="text-sm text-text">
                    {item.status === "EN_ROUTE_HOSPITAL" || item.status === "ARRIVING"
                      ? `${item.patientName} inbound`
                      : `${item.patientName} linked`}
                  </div>
                  <div className="mt-1 text-xs text-text-dim">
                    {item.location} · {item.status.replaceAll("_", " ")}
                  </div>
                  {selectedHospital && item.id === selectedCaseId && (
                    <div className="mt-1 text-[10px] font-mono text-green">
                      → {selectedHospital.short_name ?? selectedHospital.name}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, Download, HeartPulse, MapPin, Siren, Timer } from "lucide-react"

import type { CaseStatus } from "@/hooks/use-socket"

interface HospitalViewProps {
  brief: any
  transcript: string
  activeCase: any
  distance: number | null
  connected: boolean
  caseStatus: CaseStatus
  etaSeconds: number | null
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

export function HospitalView({
  brief,
  transcript,
  activeCase,
  distance,
  connected,
  caseStatus,
  etaSeconds,
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
      setAlertMessage(`Alert: ${incomingName} is coming to hospital`)
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
                  <div className="text-sm text-text">{item.patientName} is coming</div>
                  <div className="mt-1 text-xs text-text-dim">
                    {item.location} · {item.status.replaceAll("_", " ")}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}

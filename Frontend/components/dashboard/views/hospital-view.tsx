"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Ambulance,
  Brain,
  CheckCircle2,
  ClipboardList,
  Heart,
  MapPin,
  Mic,
  ShieldAlert,
} from "lucide-react"

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

const ACTIVATION_STATES: CaseStatus[] = ["PATIENT_PICKED", "EN_ROUTE_HOSPITAL", "ARRIVING"]

function formatEta(seconds: number | null) {
  if (!seconds || seconds <= 0) return "--:--"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
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
  const [localEta, setLocalEta] = useState<number | null>(etaSeconds)

  useEffect(() => {
    if (etaSeconds !== null) setLocalEta(etaSeconds)
  }, [etaSeconds])

  useEffect(() => {
    if (localEta === null || localEta <= 0) return
    const interval = setInterval(() => {
      setLocalEta((prev) => (prev && prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [localEta])

  const isActive = activeCase && ACTIVATION_STATES.includes(caseStatus)
  const isUrgent = caseStatus === "ARRIVING" || (localEta !== null && localEta <= 90)
  const priorityLabel = brief?.priority || activeCase?.severity || "Pending"
  const resourceList = brief?.resources || []

  const readinessItems = useMemo(() => {
    if (resourceList.length > 0) return resourceList
    return ["Resuscitation bay", "ER intake team", "Cardiac monitoring"]
  }, [resourceList])

  if (!isActive) {
    return (
      <div className="flex h-full items-center justify-center bg-bg2 px-6">
        <div className="w-full max-w-3xl rounded-md border border-border bg-bg p-10">
          <div className="mb-6 flex items-center gap-3 text-text">
            <Ambulance className="h-5 w-5 text-green" />
            <h2 className="font-sans text-2xl font-bold tracking-tight">
              Hospital Station On Standby
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-text-dim">
            This console stays quiet until the ambulance confirms patient pickup.
            Once transport to hospital begins, the screen will activate with ETA,
            transcript, clinical brief, and preparation tasks for the receiving team.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-sm border border-border bg-bg2 p-4">
              <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                Connection
              </div>
              <div className={connected ? "text-green" : "text-red"}>
                {connected ? "Linked to backend" : "Waiting for backend"}
              </div>
            </div>
            <div className="rounded-sm border border-border bg-bg2 p-4">
              <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                Activation Rule
              </div>
              <div className="text-text">Patient picked or hospital-bound</div>
            </div>
            <div className="rounded-sm border border-border bg-bg2 p-4">
              <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                Current State
              </div>
              <div className="text-text">{caseStatus.replaceAll("_", " ")}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0b0f16]">
      <div
        className={`border-b px-6 py-4 ${
          isUrgent ? "border-amber/40 bg-amber/10" : "border-border bg-bg"
        }`}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6">
          <div>
            <div className="mb-1 text-xs font-mono uppercase tracking-[0.2em] text-text-muted">
              Incoming Patient Alert
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-5 w-5 ${isUrgent ? "text-amber" : "text-green"}`} />
              <h2 className="font-sans text-2xl font-bold tracking-tight text-text">
                Prepare Receiving Team
              </h2>
            </div>
            <p className="mt-2 text-sm text-text-dim">
              {isUrgent
                ? "Arrival is approaching. Confirm room, staff, and equipment readiness."
                : "Transport is active. Review case details and prepare the receiving area."}
            </p>
          </div>
          <div className="grid gap-2 text-right">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
              ETA
            </span>
            <span className={`font-sans text-4xl font-bold ${isUrgent ? "text-amber" : "text-text"}`}>
              {formatEta(localEta)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-border bg-bg px-6 py-3 md:grid-cols-4">
        <div className="rounded-sm border border-border bg-bg2 p-4">
          <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
            Transport status
          </div>
          <div className="text-sm font-semibold text-text">{caseStatus.replaceAll("_", " ")}</div>
        </div>
        <div className="rounded-sm border border-border bg-bg2 p-4">
          <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
            Priority
          </div>
          <div className="text-sm font-semibold text-text">{priorityLabel}</div>
        </div>
        <div className="rounded-sm border border-border bg-bg2 p-4">
          <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
            Distance
          </div>
          <div className="text-sm font-semibold text-text">{distance ? `${distance} m` : "Unknown"}</div>
        </div>
        <div className="rounded-sm border border-border bg-bg2 p-4">
          <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
            Connectivity
          </div>
          <div className="text-sm font-semibold text-text">{connected ? "Live backend link" : "Offline"}</div>
        </div>
      </div>

      <div className="mx-auto grid h-full w-full max-w-[1500px] gap-0 overflow-hidden lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="border-r border-border bg-bg2">
          <div className="space-y-4 p-5">
            <div className="rounded-sm border border-border bg-bg p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                <Heart className="h-4 w-4 text-red" />
                Clinical Snapshot
              </div>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-text-muted">Complaint</dt>
                  <dd className="max-w-[160px] text-right text-text">
                    {brief?.chiefComplaint || activeCase?.complaint || "Pending"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-text-muted">Diagnosis</dt>
                  <dd className="max-w-[160px] text-right text-text">
                    {brief?.suspectedDiagnosis || "Awaiting brief"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-sm border border-border bg-bg p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                <ClipboardList className="h-4 w-4 text-cyan" />
                Prep Checklist
              </div>
              <ul className="space-y-3">
                {readinessItems.map((item: string, index: number) => (
                  <li key={`${item}-${index}`} className="flex items-start gap-3 text-sm text-text-dim">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-sm border border-border bg-bg p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                <ShieldAlert className="h-4 w-4 text-amber" />
                Medication / Allergy Notes
              </div>
              <div className="space-y-2 text-sm text-text-dim">
                <p><span className="text-text">Medications:</span> {brief?.medications || "Not available"}</p>
                <p><span className="text-text">Allergies:</span> {brief?.allergies || "Not available"}</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="overflow-y-auto bg-bg px-6 py-5">
          <div className="grid gap-5">
            <div className="rounded-sm border border-border bg-bg2 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="mb-1 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                    Active Case
                  </div>
                  <h3 className="font-sans text-3xl font-bold tracking-tight text-text">
                    {brief?.suspectedDiagnosis || activeCase?.complaint || "Incoming patient"}
                  </h3>
                </div>
                <div className="rounded-sm border border-border bg-bg px-3 py-2 text-right">
                  <div className="text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                    Case ID
                  </div>
                  <div className="text-sm font-semibold text-text">
                    {activeCase?.id || "Pending"}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-sm border border-border bg-bg p-4">
                  <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                    Blood Pressure
                  </div>
                  <div className="text-2xl font-semibold text-text">{brief?.vitals?.bp || "--"}</div>
                </div>
                <div className="rounded-sm border border-border bg-bg p-4">
                  <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                    Heart Rate
                  </div>
                  <div className="text-2xl font-semibold text-red">{brief?.vitals?.hr || "--"}</div>
                </div>
                <div className="rounded-sm border border-border bg-bg p-4">
                  <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                    SpO2
                  </div>
                  <div className="text-2xl font-semibold text-amber">{brief?.vitals?.spo2 || "--"}</div>
                </div>
                <div className="rounded-sm border border-border bg-bg p-4">
                  <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                    GCS
                  </div>
                  <div className="text-2xl font-semibold text-text">{brief?.vitals?.gcs || "--"}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-sm border border-border bg-bg2 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                  <Brain className="h-4 w-4 text-cyan" />
                  Clinical Brief
                </div>
                <div className="grid gap-4 text-sm text-text-dim">
                  <div>
                    <div className="mb-1 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                      Suspected Diagnosis
                    </div>
                    <p className="text-base text-text">
                      {brief?.suspectedDiagnosis || "Awaiting structured brief"}
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                      Notes
                    </div>
                    <p>{brief?.notes || "No additional notes available yet."}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-sm border border-border bg-bg2 p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                  <MapPin className="h-4 w-4 text-green" />
                  Arrival Context
                </div>
                <div className="space-y-3 text-sm text-text-dim">
                  <p><span className="text-text">Route status:</span> {caseStatus.replaceAll("_", " ")}</p>
                  <p><span className="text-text">Location:</span> {activeCase?.location || "Pending"}</p>
                  <p><span className="text-text">Team action:</span> Prepare room, intake staff, and monitoring equipment.</p>
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-border bg-bg2 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                <Mic className="h-4 w-4 text-cyan" />
                Paramedic Transcript
              </div>
              <div className="rounded-sm border border-border bg-bg p-4 font-mono text-sm leading-7 text-text-dim">
                {transcript ? transcript : "Waiting for paramedic report..."}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

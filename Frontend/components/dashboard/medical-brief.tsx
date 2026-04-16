"use client"

import { Activity, Brain, Clock, Droplets, Heart } from "lucide-react"

interface MedicalBriefData {
  age: number
  gender: string
  priority: "P1" | "P2" | "P3"
  chiefComplaint: string
  suspectedDiagnosis: string
  vitals: {
    bp: string
    hr: string
    spo2: string
    gcs: number
  }
  resources: string[]
  medications: string
  allergies: string
  notes: string
  eta: number
}

interface MedicalBriefProps {
  brief: MedicalBriefData | null
  transcript: string
}

function formatEta(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function shortTranscript(text: string) {
  if (!text) return "Transcript not available yet."
  return text.length > 160 ? `${text.slice(0, 157)}...` : text
}

export function MedicalBrief({ brief, transcript }: MedicalBriefProps) {
  if (!brief) {
    return (
      <div className="flex h-full items-center justify-center bg-bg px-8">
        <div className="w-full max-w-3xl rounded-md border border-border bg-bg2 p-6">
          <h3 className="font-mono text-xl font-semibold uppercase tracking-[0.12em] text-text">
            Waiting For Structured Intake
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-text-dim">
            Once the audio pipeline completes, the receiving team will see vitals,
            priority, ETA, transcript summary, and required resources here.
          </p>
          {transcript && (
            <div className="mt-6 rounded-sm border border-border bg-bg p-4 font-mono text-sm leading-7 text-text-dim">
              {shortTranscript(transcript)}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-bg p-5">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-border bg-bg2 p-4">
          <div>
            <h3 className="font-mono text-xl font-semibold uppercase tracking-[0.12em] text-text">
              {brief.suspectedDiagnosis}
            </h3>
            <p className="mt-2 text-sm text-text-dim">
              {brief.age} years · {brief.gender} · {brief.chiefComplaint}
            </p>
          </div>
          <div className="rounded-sm border border-border bg-bg px-4 py-3 text-right">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
              <Clock className="h-3.5 w-3.5" />
              ETA
            </div>
            <div className="mt-1 text-2xl font-semibold text-cyan">{formatEta(brief.eta)}</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-sm border border-border bg-bg2 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
              <Activity className="h-3.5 w-3.5" />
              BP
            </div>
            <div className="text-lg font-semibold text-text">{brief.vitals.bp}</div>
          </div>
          <div className="rounded-sm border border-border bg-bg2 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
              <Heart className="h-3.5 w-3.5" />
              HR
            </div>
            <div className="text-lg font-semibold text-red">{brief.vitals.hr}</div>
          </div>
          <div className="rounded-sm border border-border bg-bg2 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
              <Droplets className="h-3.5 w-3.5" />
              SpO2
            </div>
            <div className="text-lg font-semibold text-amber">{brief.vitals.spo2}</div>
          </div>
          <div className="rounded-sm border border-border bg-bg2 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
              <Brain className="h-3.5 w-3.5" />
              GCS
            </div>
            <div className="text-lg font-semibold text-text">{brief.vitals.gcs}</div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-sm border border-border bg-bg2 p-4">
            <div className="mb-3 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
              Transcript Summary
            </div>
            <div className="font-mono text-sm leading-7 text-text-dim">
              {shortTranscript(transcript)}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-sm border border-amber/30 bg-amber/10 p-4">
              <div className="mb-3 text-xs font-mono uppercase tracking-[0.18em] text-amber">
                Required Resources
              </div>
              <ul className="space-y-2 text-sm">
                {brief.resources.map((resource, index) => (
                  <li
                    key={`${resource}-${index}`}
                    className="rounded-sm border border-amber/30 bg-bg px-3 py-2 font-mono text-text"
                  >
                    {resource}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-sm border border-border bg-bg2 p-4 text-sm text-text-dim">
              <p><span className="text-text">Priority:</span> {brief.priority}</p>
              <p className="mt-3"><span className="text-text">Medications:</span> {brief.medications}</p>
              <p className="mt-3"><span className="text-text">Allergies:</span> {brief.allergies}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { Ambulance, MapPin, MessageSquare, PhoneCall } from "lucide-react"

interface CaseData {
  id: string
  severity: "CRITICAL" | "HIGH" | "MEDIUM"
  location: string
  complaint: string
  ambulanceId: string
  timestamp: number
}

interface CaseCardProps {
  caseData: CaseData | null
}

export function CaseCard({ caseData }: CaseCardProps) {
  if (!caseData) {
    return (
      <div className="flex h-full flex-col justify-center bg-bg2 p-4">
        <div className="rounded-md border border-border bg-bg p-5">
          <div className="mb-4 flex items-center gap-3">
            <Ambulance className="h-5 w-5 text-text-muted" />
            <h3 className="font-mono text-lg font-semibold uppercase tracking-[0.12em] text-text">No Active Case</h3>
          </div>
          <p className="text-sm leading-6 text-text-dim">
            The dispatch desk is waiting for a new emergency call. When a call arrives,
            the case summary, location, and assigned unit will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-bg2 p-4">
      <div className="rounded-md border border-border bg-bg p-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
              Active incident
            </div>
            <h2 className="mt-1 font-mono text-xl font-semibold uppercase tracking-[0.1em] text-text">Case #{caseData.id}</h2>
          </div>
          <span className="rounded-sm border border-red/30 bg-red/10 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-red">
            {caseData.severity}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-text-muted" />
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                Location
              </div>
              <div className="mt-1 text-text">{caseData.location}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <PhoneCall className="mt-0.5 h-4 w-4 text-text-muted" />
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                Intake status
              </div>
              <div className="mt-1 text-text">Call logged and dispatch initiated</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageSquare className="mt-0.5 h-4 w-4 text-text-muted" />
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                Complaint
              </div>
              <div className="mt-1 text-text-dim">{caseData.complaint}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Ambulance className="mt-0.5 h-4 w-4 text-cyan" />
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                Assigned unit
              </div>
              <div className="mt-1 text-text">{caseData.ambulanceId}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useRef } from "react"

interface AuditEvent {
  ts: string
  event: string
  data: string
}

interface AuditLogProps {
  events: AuditEvent[]
}

const eventTone: Record<string, string> = {
  SYSTEM: "text-text-muted border-border bg-bg2",
  CASE_OPENED: "text-red border-red/30 bg-red/10",
  STATUS_UPDATE: "text-cyan border-cyan/30 bg-cyan/10",
  SMS_SENT: "text-green border-green/30 bg-green/10",
  MEDICAL_BRIEF: "text-amber border-amber/30 bg-amber/10",
  SIGNAL_GREEN: "text-green border-green/30 bg-green/10",
  SIGNAL_RESET: "text-text border-border bg-bg2",
}

export function AuditLog({ events }: AuditLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [events])

  if (events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-bg p-8">
        <span className="text-sm text-text-muted">No operational events recorded yet.</span>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="h-full overflow-auto bg-bg p-4">
      <div className="space-y-2">
        {events.map((event, index) => {
          const tone = eventTone[event.event] || eventTone.SYSTEM

          return (
            <div
              key={`${event.ts}-${index}`}
              className="grid grid-cols-[80px_160px_minmax(0,1fr)] gap-3 rounded-sm border border-border bg-bg2 px-3 py-3 text-sm"
            >
              <div className="font-mono text-xs text-text-muted">{event.ts}</div>
              <div>
                <span className={`inline-flex rounded-sm border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${tone}`}>
                  {event.event.replaceAll("_", " ")}
                </span>
              </div>
              <div className="text-text-dim">{event.data}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

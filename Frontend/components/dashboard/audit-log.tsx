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

const eventColors: Record<string, string> = {
  SIGNAL_GREEN: "green",
  SIGNAL_RED: "red",
  GPS_UPDATE: "cyan",
  SMS_SENT: "amber",
  CASE_OPENED: "red",
  CALL_INTAKE: "purple",
  MEDICAL_BRIEF: "purple",
  PREEMPTION: "green",
  SYSTEM: "text-dim",
}

export function AuditLog({ events }: AuditLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to newest entry
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [events])

  if (events.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <span className="text-text-muted font-mono text-sm">No events logged yet...</span>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="h-full overflow-auto p-4 hide-scrollbar">
      <div className="space-y-1">
        {events.map((event, i) => {
          const colorKey = Object.keys(eventColors).find((key) => 
            event.event.includes(key)
          ) || "SYSTEM"
          const color = eventColors[colorKey]

          return (
            <div
              key={`${event.ts}-${i}`}
              className="flex items-start gap-3 py-2 px-3 rounded-sm hover:bg-bg3/50 transition-colors"
              style={{
                animation: i === 0 ? "slide-in-bottom 200ms ease-out" : undefined,
              }}
            >
              {/* Timestamp */}
              <span className="font-mono text-xs text-text-muted whitespace-nowrap">
                {event.ts}
              </span>

              {/* Event Badge */}
              <span
                className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-sm whitespace-nowrap"
                style={{
                  backgroundColor: `rgba(var(--${color === 'green' ? '74, 222, 128' : color === 'red' ? '255, 59, 59' : color === 'cyan' ? '34, 211, 238' : color === 'amber' ? '245, 158, 11' : color === 'purple' ? '167, 139, 250' : '100, 116, 139'}), 0.1)`,
                  color: `var(--${color})`,
                  border: `1px solid rgba(var(--${color === 'green' ? '74, 222, 128' : color === 'red' ? '255, 59, 59' : color === 'cyan' ? '34, 211, 238' : color === 'amber' ? '245, 158, 11' : color === 'purple' ? '167, 139, 250' : '100, 116, 139'}), 0.3)`,
                }}
              >
                {event.event}
              </span>

              {/* Event Data */}
              <span className="font-mono text-sm text-text-dim flex-1">
                {event.data}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

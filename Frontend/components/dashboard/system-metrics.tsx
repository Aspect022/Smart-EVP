"use client"

import { Clock, Radio, Satellite, Wifi } from "lucide-react"

interface SystemMetricsProps {
  latency: number | null
  connected: boolean
}

export function SystemMetrics({ latency, connected }: SystemMetricsProps) {
  const items = [
    {
      label: "Latency",
      value: latency ? `${(latency / 1000).toFixed(1)}s` : "--",
      tone: "text-cyan",
      icon: Clock,
    },
    {
      label: "Link",
      value: connected ? "LIVE" : "OFFLINE",
      tone: connected ? "text-green" : "text-red",
      icon: Wifi,
    },
    {
      label: "GPS",
      value: "FEED",
      tone: "text-amber",
      icon: Satellite,
    },
    {
      label: "Console",
      value: "ACTIVE",
      tone: "text-purple",
      icon: Radio,
    },
  ]

  return (
    <div className="h-full overflow-auto bg-bg p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-sm border border-border bg-bg2 px-3 py-3">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
                <Icon className={`h-3.5 w-3.5 ${item.tone}`} />
                {item.label}
              </div>
              <div className={`font-mono text-sm font-semibold ${item.tone}`}>{item.value}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

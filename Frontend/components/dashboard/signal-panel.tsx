"use client"

interface SignalPanelProps {
  state: "RED" | "AMBER" | "GREEN"
  latency: number | null
  preemptionCount: number
}

const stateConfig = {
  RED: {
    label: "Normal traffic mode",
    color: "text-red",
    border: "border-red/30",
    bg: "bg-red/10",
  },
  AMBER: {
    label: "Transition state",
    color: "text-amber",
    border: "border-amber/30",
    bg: "bg-amber/10",
  },
  GREEN: {
    label: "Emergency preemption active",
    color: "text-green",
    border: "border-green/30",
    bg: "bg-green/10",
  },
}

export function SignalPanel({ state, latency, preemptionCount }: SignalPanelProps) {
  const config = stateConfig[state]

  return (
    <div className="bg-bg2 p-4">
      <div className="mb-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
          Intersection Control
        </div>
        <h2 className="mt-1 font-mono text-xl font-semibold uppercase tracking-[0.12em] text-text">INT-01</h2>
      </div>

      <div className={`rounded-sm border p-3 ${config.border} ${config.bg}`}>
        <div className="mb-1 text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
          Current state
        </div>
        <div className={`text-2xl font-semibold ${config.color}`}>{state}</div>
        <p className="mt-1 text-xs text-text-dim">{config.label}</p>
      </div>

      <div className="mt-4 rounded-sm border border-border bg-bg p-3">
        <div className="mb-3 text-[10px] font-mono uppercase tracking-[0.18em] text-text-muted">
          Operational metrics
        </div>
        <dl className="space-y-3 text-xs">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-text-muted">Latest latency</dt>
            <dd className="text-text">{latency !== null ? `${(latency / 1000).toFixed(1)}s` : "--"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-text-muted">Preemptions today</dt>
            <dd className="text-text">{preemptionCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-text-muted">Controller status</dt>
            <dd className="text-text">{state === "GREEN" ? "Override granted" : "Monitoring"}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

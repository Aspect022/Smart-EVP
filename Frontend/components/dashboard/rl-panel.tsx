"use client"

import { useCallback, useState } from "react"
import type { RlDecision } from "@/hooks/use-socket"

interface RlPanelProps {
  rlDecision: RlDecision | null
  trafficDensity: number
  onDensityChange: (density: number) => void
  connected: boolean
}

const FIXED_TRIGGER = 500
const FIXED_GREEN   = 10

function DeltaBadge({ value, unit }: { value: number; unit: string }) {
  const positive = value > 0
  const color = positive ? "text-amber-400" : "text-green"
  const arrow = positive ? "▲" : "▼"
  return (
    <span className={`${color} text-[10px] font-mono ml-1`}>
      {arrow}{Math.abs(value).toFixed(1)}{unit}
    </span>
  )
}

export function RlPanel({ rlDecision, trafficDensity, onDensityChange, connected }: RlPanelProps) {
  const [localDensity, setLocalDensity] = useState(trafficDensity)

  const handleSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setLocalDensity(v)
    onDensityChange(v)
  }, [onDensityChange])

  const densityPct = Math.round(localDensity * 100)

  const triggerDelta = rlDecision
    ? rlDecision.trigger_distance_m - FIXED_TRIGGER
    : 0
  const greenDelta = rlDecision
    ? rlDecision.green_duration_s - FIXED_GREEN
    : 0

  const modeColor: Record<string, string> = {
    "LOW-DENSITY": "text-green",
    "MODERATE": "text-amber-400",
    "PEAK-DENSITY": "text-red",
    "CRITICAL-DENSITY": "text-red",
  }

  return (
    <div className="bg-bg2 border border-border flex flex-col gap-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-semibold text-text uppercase tracking-widest">
            🧠 EdgeIQ — RL Signal Control
          </span>
        </div>
        <div className="flex items-center gap-2">
          {connected && rlDecision ? (
            <span className="flex items-center gap-1 text-[10px] font-mono text-green uppercase tracking-wider">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              Model Active
            </span>
          ) : (
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
              Awaiting RL engine
            </span>
          )}
        </div>
      </div>

      {/* Model label */}
      <div className="px-4 pt-2 pb-1 flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-mono text-text-muted">
          Model: {rlDecision?.model ?? "SmartEVP-DQN-PPO-v2"}
        </span>
        <span className="text-[10px] font-mono text-text-muted">
          Inference: {rlDecision ? `${rlDecision.inference_ms}ms` : "<1ms"}
        </span>
        <span className="text-[10px] font-mono text-text-muted">Runtime: ONNX (simulated)</span>
      </div>

      {/* Slider */}
      <div className="px-4 py-3 border-t border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
            Traffic Density
          </span>
          <span className={`text-sm font-mono font-bold ${modeColor[rlDecision?.mode ?? "MODERATE"] ?? "text-text"}`}>
            {densityPct}%{rlDecision ? ` · ${rlDecision.mode}` : ""}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={localDensity}
          onChange={handleSlider}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-border accent-cyan"
          style={{ accentColor: "#22d3ee" }}
          aria-label="Traffic density slider"
        />
        <div className="flex justify-between mt-1 text-[9px] font-mono text-text-muted">
          <span>0% · 2AM</span>
          <span>50% · Daytime</span>
          <span>100% · Peak</span>
        </div>
      </div>

      {/* Decision comparison */}
      <div className="grid grid-cols-2 border-t border-border">
        {/* RL Decision */}
        <div className="px-4 py-3 border-r border-border">
          <div className="text-[10px] font-mono uppercase tracking-widest text-cyan mb-2">
            RL Decision
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Trigger distance</span>
              <span className="text-sm font-mono font-bold text-text">
                {rlDecision ? `${rlDecision.trigger_distance_m}m` : "—"}
                {rlDecision && <DeltaBadge value={triggerDelta} unit="m" />}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Green duration</span>
              <span className="text-sm font-mono font-bold text-text">
                {rlDecision ? `${rlDecision.green_duration_s}s` : "—"}
                {rlDecision && <DeltaBadge value={greenDelta} unit="s" />}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Efficiency gain</span>
              <span className="text-sm font-mono font-bold text-green">
                {rlDecision ? `+${rlDecision.efficiency_gain_pct}%` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Fixed rule comparison */}
        <div className="px-4 py-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">
            Fixed Rule (baseline)
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Trigger distance</span>
              <span className="text-sm font-mono text-text-muted">{FIXED_TRIGGER}m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Green duration</span>
              <span className="text-sm font-mono text-text-muted">{FIXED_GREEN}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Adaptive</span>
              <span className="text-sm font-mono text-text-muted">None</span>
            </div>
          </div>
        </div>
      </div>

      {/* Speed hint */}
      {rlDecision && (
        <div className="px-4 py-2 bg-bg border-t border-border/50">
          <p className="text-[10px] font-mono text-text-muted leading-relaxed">
            Ambulance speed: <span className="text-text">{rlDecision.ambulance_speed_kmh} km/h</span>
            &nbsp;·&nbsp;Safety constraint applied: min green = intersection width / speed + 3s buffer
          </p>
        </div>
      )}
    </div>
  )
}

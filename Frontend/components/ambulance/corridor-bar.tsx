"use client"

interface CorridorBarProps {
  signal: "RED" | "AMBER" | "GREEN"
  distance: number | null
  triggerDistance?: number
}

export function CorridorBar({ signal, distance, triggerDistance }: CorridorBarProps) {
  const isGreen = signal === "GREEN"
  const isAmber = signal === "AMBER"

  const progressPct = distance != null && triggerDistance
    ? Math.max(0, Math.min(100, (1 - distance / (triggerDistance * 2)) * 100))
    : null

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "56px" }}>
      {/* Background */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          isGreen ? "bg-green/10" : isAmber ? "bg-amber/10" : "bg-red/5"
        }`}
      />

      {/* Sweep animation for GREEN */}
      {isGreen && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-green/25 to-transparent"
          style={{
            animation: "corridorSweep 1.5s ease-in-out infinite",
          }}
        />
      )}

      {/* Border glow */}
      <div
        className={`absolute inset-0 border-y-2 transition-colors duration-700 ${
          isGreen ? "border-green/60" : isAmber ? "border-amber/40" : "border-red/20"
        }`}
      />

      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-6">
        {/* Left: Status */}
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full transition-colors duration-500 ${
              isGreen ? "bg-green shadow-[0_0_12px_#4ade80]" :
              isAmber ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]" :
              "bg-red shadow-[0_0_8px_#ff3b3b]"
            } ${isGreen ? "animate-pulse" : ""}`}
          />
          <span className={`font-mono text-sm font-bold uppercase tracking-widest transition-colors duration-500 ${
            isGreen ? "text-green" : isAmber ? "text-amber-400" : "text-red/70"
          }`}>
            {isGreen ? "🟢 GREEN CORRIDOR ACTIVE — PATH CLEAR" :
             isAmber ? "🟡 SIGNAL TRANSITIONING" :
             "🔴 RED — AWAITING PREEMPTION"}
          </span>
        </div>

        {/* Right: Distance indicator */}
        {distance != null && (
          <div className="text-right">
            <div className="font-mono text-xs text-text-muted uppercase tracking-wider">To Intersection</div>
            <div className={`font-mono text-lg font-bold tabular-nums ${isGreen ? "text-green" : "text-text"}`}>
              {distance > 1000 ? `${(distance / 1000).toFixed(1)}km` : `${distance}m`}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar (ambulance approach) */}
      {progressPct != null && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-cyan/60 transition-all duration-1000"
          style={{ width: `${progressPct}%` }}
        />
      )}

      <style jsx>{`
        @keyframes corridorSweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

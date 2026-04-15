"use client"

import { useEffect, useState } from "react"

interface SignalPanelProps {
  state: "RED" | "AMBER" | "GREEN"
  latency: number | null
  preemptionCount: number
}

export function SignalPanel({ state, latency, preemptionCount }: SignalPanelProps) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayLatency, setDisplayLatency] = useState<number | null>(null)

  // Animate latency counter
  useEffect(() => {
    if (state === "GREEN" && latency !== null) {
      setIsTransitioning(true)
      
      // Animate latency counting up
      const duration = 300
      const startTime = performance.now()
      const animate = (time: number) => {
        const elapsed = time - startTime
        const progress = Math.min(elapsed / duration, 1)
        setDisplayLatency(Math.round(progress * latency))
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)

      const timeout = setTimeout(() => setIsTransitioning(false), 1200)
      return () => clearTimeout(timeout)
    }
  }, [state, latency])

  const getSignalColor = () => {
    switch (state) {
      case "GREEN": return "var(--green)"
      case "AMBER": return "var(--amber)"
      default: return "var(--red)"
    }
  }

  const getGlowStyle = () => {
    switch (state) {
      case "GREEN": return "0 0 40px rgba(74, 222, 128, 0.5), 0 0 80px rgba(74, 222, 128, 0.3)"
      case "AMBER": return "0 0 40px rgba(245, 158, 11, 0.5), 0 0 80px rgba(245, 158, 11, 0.3)"
      default: return "0 0 30px rgba(255, 59, 59, 0.4)"
    }
  }

  const getStatusText = () => {
    switch (state) {
      case "GREEN": return "PREEMPTION ACTIVE"
      case "AMBER": return "TRANSITIONING..."
      default: return "AWAITING DISPATCH"
    }
  }

  return (
    <div 
      className={`h-full flex flex-col p-6 transition-all duration-300 ${
        isTransitioning ? "animate-preemption-flash" : ""
      }`}
      style={{
        borderLeft: `2px solid ${state === "GREEN" ? "var(--green)" : state === "AMBER" ? "var(--amber)" : "var(--border)"}`,
        transition: "border-color 0.3s ease",
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <span className="eyebrow">INTERSECTION</span>
        <h2 className="font-sans font-bold text-2xl text-text mt-1">INT-01</h2>
      </div>

      {/* Signal Light */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* Glow ring */}
          <div 
            className="absolute inset-0 rounded-full transition-all duration-500"
            style={{
              background: `radial-gradient(circle, ${getSignalColor()}20 0%, transparent 70%)`,
              transform: "scale(1.5)",
            }}
          />
          
          {/* Main light */}
          <div 
            className="relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              backgroundColor: getSignalColor(),
              boxShadow: getGlowStyle(),
            }}
          >
            <span className="font-sans font-bold text-2xl text-bg">
              {state}
            </span>
          </div>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center mb-6">
        <p 
          className="font-sans font-semibold text-lg transition-all duration-300"
          style={{ color: getSignalColor() }}
        >
          {getStatusText()}
        </p>
      </div>

      {/* Stats */}
      <div className="space-y-4 pt-4 border-t border-border">
        {state === "GREEN" && displayLatency !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Latency</span>
            <span className="font-mono font-semibold text-green">
              {(displayLatency / 1000).toFixed(1)}s
            </span>
          </div>
        )}

        {state === "GREEN" && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Auth</span>
            <span className="font-mono text-sm text-green">ECC-256 VERIFIED</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Preemptions</span>
          <span className="font-mono font-semibold text-text">{preemptionCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Avg Latency</span>
          <span className="font-mono text-text-dim">
            {preemptionCount > 0 && latency ? `${(latency / 1000).toFixed(1)}s` : "—"}
          </span>
        </div>
      </div>
    </div>
  )
}

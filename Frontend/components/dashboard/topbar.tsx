"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { RotateCcw } from "lucide-react"

export type ViewType = "admin" | "ambulance" | "hospital"

interface TopbarProps {
  connected: boolean
  latency: number | null
  activeCase: { id: string; severity: string } | null
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  onReset: () => void
}

export function Topbar({ connected, latency, activeCase, activeView, onViewChange, onReset }: TopbarProps) {
  const [currentTime, setCurrentTime] = useState<string>("")

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour12: false }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-bg2 border-b border-border">
      {/* Left: Logo + Status */}
      <div className="flex items-center gap-6">
        <Link href="/" className="font-sans font-bold text-xl text-text">
          SmartEVP<span className="text-red">+</span>
          <span className="text-text-muted ml-2 text-sm font-mono">ERIS v2.0</span>
        </Link>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <span className="live-dot" />
              <span className="text-green text-xs font-mono uppercase tracking-wider">LIVE</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-red" />
              <span className="text-red text-xs font-mono uppercase tracking-wider">OFFLINE</span>
            </>
          )}
        </div>
      </div>

      {/* Center: Case + Latency */}
      <div className="flex items-center gap-8">
        {activeCase && (
          <div className="flex items-center gap-3">
            <span className="text-text-dim text-sm font-mono">Case</span>
            <span className="text-text font-mono font-semibold">#{activeCase.id}</span>
            <span 
              className={`px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-sm ${
                activeCase.severity === "CRITICAL" 
                  ? "bg-red/10 text-red border border-red/30" 
                  : "bg-amber/10 text-amber border border-amber/30"
              }`}
            >
              {activeCase.severity}
            </span>
          </div>
        )}

        {latency !== null && (
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-xs font-mono uppercase tracking-wider">E2E Latency</span>
            <span 
              className={`font-sans font-bold text-lg ${
                latency < 5000 ? "text-green" : latency < 10000 ? "text-amber" : "text-red"
              }`}
            >
              {(latency / 1000).toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {/* View Toggles */}
      <div className="flex items-center mx-4 bg-bg3 border border-border rounded-sm p-1">
        {(["admin", "ambulance", "hospital"] as ViewType[]).map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors ${
              activeView === view
                ? "bg-bg text-text shadow-sm border border-border2"
                : "text-text-muted hover:text-text"
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Right: Time + Reset */}
      <div className="flex items-center gap-6">
        <span className="font-mono text-text-dim text-lg tabular-nums">
          {currentTime}
        </span>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-sm font-mono text-text-dim hover:text-text border border-border hover:border-border2 rounded-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>RESET DEMO</span>
        </button>
      </div>
    </header>
  )
}

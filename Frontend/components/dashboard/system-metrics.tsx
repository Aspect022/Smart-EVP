"use client"

import { useEffect, useState } from "react"
import { Clock, Wifi, Satellite, Radio } from "lucide-react"

interface SystemMetricsProps {
  latency: number | null
  connected: boolean
}

export function SystemMetrics({ latency, connected }: SystemMetricsProps) {
  const [uptime, setUptime] = useState(0)
  const [messageRate, setMessageRate] = useState(0)

  // Simulate uptime counter
  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Simulate message rate (would be real in production)
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageRate(Math.floor(Math.random() * 5) + 8) // 8-12 msg/s
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getLatencyColor = () => {
    if (!latency) return "text-text-muted"
    if (latency < 5000) return "text-green"
    if (latency < 10000) return "text-amber"
    return "text-red"
  }

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* E2E Latency */}
        <div className="p-4 bg-card border border-border rounded-sm card-green">
          <div className="flex items-center gap-2 text-text-muted mb-3">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider">E2E Latency</span>
          </div>
          <div className={`font-sans font-bold text-3xl ${getLatencyColor()}`}>
            {latency ? `${(latency / 1000).toFixed(1)}s` : "—"}
          </div>
          <div className="text-xs text-text-muted mt-1">
            {latency && latency < 5000 ? "Excellent" : latency && latency < 10000 ? "Good" : "—"}
          </div>
        </div>

        {/* System Uptime */}
        <div className="p-4 bg-card border border-border rounded-sm card-cyan">
          <div className="flex items-center gap-2 text-text-muted mb-3">
            <Wifi className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider">System Uptime</span>
          </div>
          <div suppressHydrationWarning className="font-sans font-bold text-3xl text-cyan tabular-nums">
            {formatUptime(uptime)}
          </div>
          <div suppressHydrationWarning className="text-xs text-text-muted mt-1">
            {connected ? "Connected" : "Disconnected"}
          </div>
        </div>

        {/* GPS Fix Quality */}
        <div className="p-4 bg-card border border-border rounded-sm card-amber">
          <div className="flex items-center gap-2 text-text-muted mb-3">
            <Satellite className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider">GPS Fix</span>
          </div>
          <div className="font-sans font-bold text-3xl text-amber">
            HDOP 0.9
          </div>
          <div className="text-xs text-text-muted mt-1">
            8 satellites
          </div>
        </div>

        {/* MQTT Message Rate */}
        <div className="p-4 bg-card border border-border rounded-sm card-purple">
          <div className="flex items-center gap-2 text-text-muted mb-3">
            <Radio className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider">MQTT Rate</span>
          </div>
          <div className="font-sans font-bold text-3xl text-purple">
            {messageRate} <span className="text-lg font-normal text-text-muted">msg/s</span>
          </div>
          <div className="text-xs text-text-muted mt-1">
            Active
          </div>
        </div>
      </div>
    </div>
  )
}

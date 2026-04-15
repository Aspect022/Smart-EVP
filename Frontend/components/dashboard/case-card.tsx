"use client"

import { useEffect, useState } from "react"
import { MapPin, MessageSquare, Ambulance, Smartphone, CheckCircle } from "lucide-react"

interface CaseData {
  id: string
  severity: "CRITICAL" | "HIGH" | "MEDIUM"
  location: string
  complaint: string
  ambulanceId: string
  smsDelivered: boolean
  driverNotified: boolean
  timestamp: number
}

interface CaseCardProps {
  caseData: CaseData | null
}

export function CaseCard({ caseData }: CaseCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [smsTimer, setSmsTimer] = useState<string | null>(null)

  useEffect(() => {
    if (caseData) {
      // Trigger slide-in animation
      setIsVisible(true)

      // SMS timer
      if (caseData.smsDelivered) {
        const interval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - caseData.timestamp) / 1000)
          setSmsTimer(`${elapsed}s ago`)
        }, 1000)
        return () => clearInterval(interval)
      }
    } else {
      setIsVisible(false)
    }
  }, [caseData])

  if (!caseData) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-bg3 flex items-center justify-center mb-4">
          <Ambulance className="w-8 h-8 text-text-muted" />
        </div>
        <h3 className="font-sans font-semibold text-lg text-text-dim mb-2">
          No Active Case
        </h3>
        <p className="text-sm text-text-muted">
          Awaiting emergency dispatch...
        </p>
      </div>
    )
  }

  return (
    <div 
      className={`h-full p-6 transition-all duration-400 ease-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-sans font-bold text-xl text-text">
          CASE #{caseData.id}
        </h2>
        <span 
          className={`px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-sm animate-pulse ${
            caseData.severity === "CRITICAL" 
              ? "bg-red/10 text-red border border-red/30" 
              : "bg-amber/10 text-amber border border-amber/30"
          }`}
        >
          {caseData.severity === "CRITICAL" ? "P1 — CRITICAL" : "P2 — HIGH"}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mb-6" />

      {/* Info Items */}
      <div className="space-y-4">
        {/* Location */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-text">{caseData.location}</p>
          </div>
        </div>

        {/* Complaint */}
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-text-dim">{caseData.complaint}</p>
          </div>
        </div>

        {/* Ambulance */}
        <div className="flex items-start gap-3">
          <Ambulance className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-text">
              <span className="text-cyan font-mono">{caseData.ambulanceId}</span> Dispatched
            </p>
          </div>
        </div>

        {/* SMS Status */}
        {caseData.smsDelivered && (
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-green flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-text">
                SMS Delivered — <span className="text-text-muted">{smsTimer}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Driver Notified Status */}
      {caseData.driverNotified && (
        <div className="mt-8 p-4 bg-green/5 border border-green/20 rounded-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green" />
            <span className="text-sm font-mono text-green uppercase tracking-wider">
              DRIVER NOTIFIED
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

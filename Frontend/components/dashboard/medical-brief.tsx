"use client"

import { useEffect, useState, useRef } from "react"
import { Activity, Heart, Droplets, Brain, Clock, AlertCircle } from "lucide-react"

interface MedicalBriefData {
  age: number
  gender: string
  priority: "P1" | "P2" | "P3"
  chiefComplaint: string
  suspectedDiagnosis: string
  vitals: {
    bp: string
    hr: string
    spo2: string
    gcs: number
  }
  resources: string[]
  medications: string
  allergies: string
  notes: string
  eta: number // in seconds
}

interface MedicalBriefProps {
  brief: MedicalBriefData | null
  transcript: string
}

export function MedicalBrief({ brief, transcript }: MedicalBriefProps) {
  const [revealedFields, setRevealedFields] = useState<number>(0)
  const [etaCountdown, setEtaCountdown] = useState<number>(0)
  const fieldsRef = useRef<HTMLDivElement>(null)

  // Stagger reveal animation when brief arrives
  useEffect(() => {
    if (brief) {
      setRevealedFields(0)
      const totalFields = 8 // Number of field groups
      let currentField = 0

      const revealInterval = setInterval(() => {
        currentField++
        setRevealedFields(currentField)
        if (currentField >= totalFields) {
          clearInterval(revealInterval)
        }
      }, 60)

      return () => clearInterval(revealInterval)
    }
  }, [brief])

  // ETA countdown
  useEffect(() => {
    if (brief?.eta) {
      setEtaCountdown(brief.eta)
      const interval = setInterval(() => {
        setEtaCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [brief?.eta])

  const formatEta = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const etaProgress = brief ? ((brief.eta - etaCountdown) / brief.eta) * 100 : 0

  if (!brief) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="live-dot-cyan w-3 h-3" />
          <span className="text-cyan font-mono text-sm">Awaiting en-route audio...</span>
        </div>
        {transcript && (
          <div className="mt-4 p-4 bg-bg3 border border-border rounded-sm max-w-2xl">
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-2">
              Live Transcript
            </span>
            <p className="text-sm text-text-dim font-mono">{transcript}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={fieldsRef} className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-sans font-bold text-xl text-text">PRE-ARRIVAL INTELLIGENCE</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="live-dot w-2 h-2 bg-purple" style={{ animation: "pulse-glow 2s ease-in-out infinite" }} />
            <span className="text-xs font-mono text-purple uppercase tracking-wider">
              GEMMA 4 — EDGE AI — ON-DEVICE
            </span>
          </div>
        </div>

        {/* ETA */}
        <div className="text-right">
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider block">ETA</span>
          <span 
            className={`font-sans font-bold text-3xl ${etaCountdown === 0 ? "text-green animate-pulse" : "text-amber"}`}
          >
            {etaCountdown === 0 ? "ARRIVING" : formatEta(etaCountdown)}
          </span>
        </div>
      </div>

      {/* Content with staggered reveal */}
      <div className="space-y-6 border-l-2 border-purple pl-4">
        {/* Patient Info */}
        <div 
          className={`brief-field transition-all duration-250 ${revealedFields >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          <div className="flex items-center gap-6 text-sm">
            <span className="text-text-muted">Age:</span>
            <span className="text-text font-semibold">{brief.age}</span>
            <span className="text-text-muted">Gender:</span>
            <span className="text-text font-semibold">{brief.gender}</span>
            <span className="text-text-muted">Priority:</span>
            <span className={`font-semibold ${brief.priority === "P1" ? "text-red" : "text-amber"}`}>
              {brief.priority} — {brief.priority === "P1" ? "IMMEDIATE" : "URGENT"}
            </span>
          </div>
        </div>

        {/* Chief Complaint */}
        <div 
          className={`brief-field transition-all duration-250 ${revealedFields >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-1">
            Chief Complaint
          </span>
          <p className="text-text font-semibold">{brief.chiefComplaint}</p>
        </div>

        {/* Suspected Diagnosis */}
        <div 
          className={`brief-field transition-all duration-250 ${revealedFields >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-1">
            Suspected
          </span>
          <p className="text-amber font-semibold">{brief.suspectedDiagnosis}</p>
        </div>

        {/* Vitals Grid */}
        <div 
          className={`brief-field transition-all duration-250 ${revealedFields >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-3">
            Vitals
          </span>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 bg-bg3 border border-border rounded-sm">
              <div className="flex items-center gap-2 text-text-muted mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-mono">BP</span>
              </div>
              <span className="font-mono font-semibold text-text">{brief.vitals.bp}</span>
            </div>
            <div className="p-3 bg-bg3 border border-border rounded-sm">
              <div className="flex items-center gap-2 text-text-muted mb-1">
                <Heart className="w-4 h-4" />
                <span className="text-xs font-mono">HR</span>
              </div>
              <span className="font-mono font-semibold text-red">{brief.vitals.hr}</span>
            </div>
            <div className="p-3 bg-bg3 border border-border rounded-sm">
              <div className="flex items-center gap-2 text-text-muted mb-1">
                <Droplets className="w-4 h-4" />
                <span className="text-xs font-mono">SpO2</span>
              </div>
              <span className="font-mono font-semibold text-amber">{brief.vitals.spo2}</span>
            </div>
            <div className="p-3 bg-bg3 border border-border rounded-sm">
              <div className="flex items-center gap-2 text-text-muted mb-1">
                <Brain className="w-4 h-4" />
                <span className="text-xs font-mono">GCS</span>
              </div>
              <span className="font-mono font-semibold text-text">{brief.vitals.gcs}</span>
            </div>
          </div>
        </div>

        {/* Resources Required */}
        <div 
          className={`brief-field transition-all duration-250 ${revealedFields >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-3">
            Resources Required
          </span>
          <div className="flex flex-wrap gap-2">
            {brief.resources.map((resource, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-green/10 text-green border border-green/30 text-sm font-mono rounded-sm"
                style={{
                  animation: `scale-in 150ms ease-out ${i * 50}ms both`,
                }}
              >
                {resource}
              </span>
            ))}
          </div>
        </div>

        {/* Medications & Allergies */}
        <div 
          className={`brief-field transition-all duration-250 ${revealedFields >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          <div className="flex gap-8">
            <div>
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-1">
                Medications
              </span>
              <span className="text-text text-sm">{brief.medications}</span>
            </div>
            <div>
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-1">
                Allergies
              </span>
              <span className="text-text text-sm">{brief.allergies}</span>
            </div>
          </div>
        </div>

        {/* ETA Progress Bar */}
        <div 
          className={`brief-field transition-all duration-250 ${revealedFields >= 7 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          <div className="flex items-center gap-4">
            <Clock className="w-5 h-5 text-text-muted" />
            <div className="flex-1">
              <div className="h-2 bg-bg3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber to-green transition-all duration-1000"
                  style={{ width: `${etaProgress}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-mono text-text-muted">{Math.round(etaProgress)}%</span>
          </div>
        </div>

        {/* Notes */}
        <div 
          className={`brief-field transition-all duration-250 ${revealedFields >= 8 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-1">
            Notes
          </span>
          <p className="text-text-dim text-sm">{brief.notes}</p>
        </div>
      </div>
    </div>
  )
}

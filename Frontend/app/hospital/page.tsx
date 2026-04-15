"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Activity, Heart, Droplets, Brain, Clock, Building, AlertTriangle } from "lucide-react"

// Demo data - same as dashboard
const DEMO_BRIEF = {
  age: 58,
  gender: "Male",
  priority: "P1" as const,
  chiefComplaint: "Acute chest pain radiating to left arm",
  suspectedDiagnosis: "STEMI (ST-Elevation Myocardial Infarction)",
  vitals: {
    bp: "90/60 mmHg",
    hr: "112 bpm (IRREG)",
    spo2: "94%",
    gcs: 15,
  },
  resources: ["Cardiologist", "Defibrillator", "ICU Bed", "Cath Lab Team"],
  medications: "Aspirin 75mg daily",
  allergies: "None known",
  notes: "Diaphoretic. EMS Aspirin 325mg given. Onset approximately 20 minutes ago.",
  eta: 252,
}

export default function HospitalReadinessPage() {
  const [currentTime, setCurrentTime] = useState("")
  const [etaCountdown, setEtaCountdown] = useState(DEMO_BRIEF.eta)
  const [isArriving, setIsArriving] = useState(false)

  // Time update
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour12: false }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // ETA countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setEtaCountdown((prev) => {
        if (prev <= 1) {
          setIsArriving(true)
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatEta = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-bg2 border-b border-border">
        <div className="flex items-center gap-6">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-text-dim hover:text-text transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-mono text-sm">Back to Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-green" />
            <span className="font-sans font-bold text-lg text-text">HOSPITAL RECEPTION DASHBOARD</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-text-dim font-mono">Apollo Hospitals, Bengaluru</span>
          <span className="font-mono text-2xl text-text tabular-nums">{currentTime}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-8">
        {/* Arriving Banner */}
        {isArriving && (
          <div className="mb-8 p-6 bg-green/10 border-2 border-green text-center animate-pulse">
            <span className="font-sans font-bold text-3xl text-green tracking-wider">
              PATIENT ARRIVING
            </span>
          </div>
        )}

        {/* Patient Card */}
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between p-6 bg-bg3 border-b border-border">
            <div>
              <h1 className="font-sans font-bold text-2xl text-text mb-1">
                INCOMING PATIENT
              </h1>
              <div className="flex items-center gap-2">
                <span className="live-dot w-2 h-2" />
                <span className="text-xs font-mono text-green uppercase tracking-wider">
                  LIVE BRIEF
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-1">
                ETA
              </span>
              <span 
                className={`font-sans font-extrabold text-5xl ${isArriving ? "text-green" : "text-amber"}`}
              >
                {isArriving ? "NOW" : formatEta(etaCountdown)}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-6">
            {/* Diagnosis Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-sans font-bold text-3xl text-amber mb-2">
                  {DEMO_BRIEF.suspectedDiagnosis}
                </h2>
                <p className="text-text-dim text-lg">
                  {DEMO_BRIEF.gender}, {DEMO_BRIEF.age} years old
                </p>
              </div>
              <span className="px-4 py-2 bg-red/10 text-red border border-red/30 font-mono font-bold text-lg">
                {DEMO_BRIEF.priority} — IMMEDIATE
              </span>
            </div>

            {/* Chief Complaint */}
            <div className="p-4 bg-bg3 border-l-4 border-red">
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-2">
                Chief Complaint
              </span>
              <p className="text-text text-xl font-semibold">
                {DEMO_BRIEF.chiefComplaint}
              </p>
            </div>

            {/* Vitals Grid */}
            <div>
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-4">
                Vitals
              </span>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-6 bg-bg3 border border-border rounded-sm text-center">
                  <Activity className="w-8 h-8 text-text-muted mx-auto mb-3" />
                  <span className="text-xs font-mono text-text-muted block mb-1">BP</span>
                  <span className="font-sans font-bold text-2xl text-text">{DEMO_BRIEF.vitals.bp}</span>
                </div>
                <div className="p-6 bg-bg3 border border-red/30 rounded-sm text-center">
                  <Heart className="w-8 h-8 text-red mx-auto mb-3" />
                  <span className="text-xs font-mono text-text-muted block mb-1">HR</span>
                  <span className="font-sans font-bold text-2xl text-red">{DEMO_BRIEF.vitals.hr}</span>
                </div>
                <div className="p-6 bg-bg3 border border-amber/30 rounded-sm text-center">
                  <Droplets className="w-8 h-8 text-amber mx-auto mb-3" />
                  <span className="text-xs font-mono text-text-muted block mb-1">SpO2</span>
                  <span className="font-sans font-bold text-2xl text-amber">{DEMO_BRIEF.vitals.spo2}</span>
                </div>
                <div className="p-6 bg-bg3 border border-border rounded-sm text-center">
                  <Brain className="w-8 h-8 text-text-muted mx-auto mb-3" />
                  <span className="text-xs font-mono text-text-muted block mb-1">GCS</span>
                  <span className="font-sans font-bold text-2xl text-text">{DEMO_BRIEF.vitals.gcs}</span>
                </div>
              </div>
            </div>

            {/* Prepare Immediately */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-green" />
                <span className="font-sans font-bold text-lg text-green uppercase tracking-wider">
                  Prepare Immediately
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {DEMO_BRIEF.resources.map((resource, i) => (
                  <div
                    key={i}
                    className="px-6 py-4 bg-green/10 border-2 border-green text-green font-sans font-semibold text-lg rounded-sm"
                  >
                    {resource}
                  </div>
                ))}
              </div>
            </div>

            {/* Medications & Allergies */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-bg3 border border-border rounded-sm">
                <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-2">
                  Medications
                </span>
                <span className="text-text">{DEMO_BRIEF.medications}</span>
              </div>
              <div className="p-4 bg-bg3 border border-border rounded-sm">
                <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-2">
                  Allergies
                </span>
                <span className="text-text">{DEMO_BRIEF.allergies}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="p-4 bg-bg3 border border-border rounded-sm">
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-2">
                Notes
              </span>
              <p className="text-text-dim">{DEMO_BRIEF.notes}</p>
            </div>

            {/* AI Attribution */}
            <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
              <span className="w-2 h-2 rounded-full bg-purple animate-pulse" />
              <span className="text-xs font-mono text-purple uppercase tracking-wider">
                GENERATED BY GEMMA 4 — EDGE AI — ON-DEVICE INFERENCE
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

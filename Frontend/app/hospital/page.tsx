"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Activity, Heart, Droplets, Brain, Clock, Building, AlertTriangle } from "lucide-react"

import { useSocket } from "@/hooks/use-socket"

export default function HospitalReadinessPage() {
  const { brief, distance, connected } = useSocket()
  
  const [currentTime, setCurrentTime] = useState("")
  
  // Real ETA calculation based on real distance: Assuming ~10 m/s speed (36 km/h) globally roughly
  const estimatedSecondsLeft = distance ? Math.floor(distance / 10) : (brief ? brief.eta : 0);
  const isArriving = estimatedSecondsLeft <= 10 && distance !== null && distance < 100;

  // Time update
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour12: false }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatEta = (seconds: number) => {
    if (!seconds || seconds <= 0) return "--:--";
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Display waiting banner if no brief from backend yet
  if (!brief) {
      return (
          <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
              <Building className="w-16 h-16 text-text-dim mb-4" />
              <h2 className="text-xl font-mono text-text-muted">Awaiting Medical Intake...</h2>
              <p className="text-sm font-mono text-text-dim mt-2 tracking-widest">{connected ? 'SYSTEM CONNECTED' : 'SYSTEM OFFLINE'}</p>
              
              <Link href="/dashboard" className="mt-8 text-cyan hover:underline font-mono text-sm">
                Return to Dashboard
              </Link>
          </div>
      )
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
          {!connected && <span className="text-red font-bold font-mono">OFFLINE</span>}
          <span className="text-text-dim font-mono">Apollo Hospitals, Bengaluru</span>
          <span className="font-mono text-2xl text-text tabular-nums">{currentTime}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-8">
        {/* Arriving Banner */}
        {isArriving && (
          <div className="mb-8 p-6 bg-green/10 border-2 border-green text-center shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-pulse">
            <span className="font-sans font-bold text-3xl text-green tracking-wider">
              PATIENT ARRIVING NOW
            </span>
          </div>
        )}

        {/* Patient Card */}
        <div className="bg-card border border-border rounded-sm overflow-hidden shadow-2xl">
          {/* Card Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-bg3 border-b border-border">
            <div>
              <h1 className="font-sans font-bold text-2xl text-text mb-1">
                INCOMING PATIENT
              </h1>
              <div className="flex items-center gap-2">
                <span className="live-dot w-2 h-2" />
                <span className="text-xs font-mono text-green uppercase tracking-wider">
                  LIVE BRIEF • GEMMA 4 ACTIVE
                </span>
                {distance && (
                    <span className="text-xs font-mono text-blue-400 ml-4">
                      DIST: {distance}m
                    </span>
                )}
              </div>
            </div>
            <div className="text-right mt-4 md:mt-0">
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-1">
                ETA
              </span>
              <span 
                className={`font-sans font-extrabold text-5xl ${isArriving ? "text-green" : "text-amber"}`}
              >
                {isArriving ? "0:00" : formatEta(estimatedSecondsLeft)}
              </span>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-6">
            {/* Diagnosis Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-sans font-bold text-3xl text-amber mb-2">
                  {brief.suspectedDiagnosis}
                </h2>
                <p className="text-text-dim text-lg">
                  {brief.gender}, {brief.age} years old
                </p>
              </div>
              <span className={`px-4 py-2 border font-mono font-bold text-lg ${
                  brief.priority === 'P1' ? 'bg-red/10 text-red border-red/30' : 
                  brief.priority === 'P2' ? 'bg-amber/10 text-amber border-amber/30' : 
                  'bg-green/10 text-green border-green/30'
              }`}>
                {brief.priority} — {brief.priority === 'P1' ? 'IMMEDIATE' : brief.priority === 'P2' ? 'URGENT' : 'STANDARD'}
              </span>
            </div>

            {/* Chief Complaint */}
            <div className="p-4 bg-bg3 border-l-4 border-red">
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-2">
                Chief Complaint
              </span>
              <p className="text-text text-xl font-semibold">
                {brief.chiefComplaint}
              </p>
            </div>

            {/* Vitals Grid */}
            <div>
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-4">
                Vitals
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-6 bg-bg3 border border-border rounded-sm text-center">
                  <Activity className="w-8 h-8 text-text-muted mx-auto mb-3" />
                  <span className="text-xs font-mono text-text-muted block mb-1">BP</span>
                  <span className="font-sans font-bold text-2xl text-text">{brief.vitals?.bp || "--"}</span>
                </div>
                <div className="p-6 bg-bg3 border border-red/30 rounded-sm text-center">
                  <Heart className="w-8 h-8 text-red mx-auto mb-3" />
                  <span className="text-xs font-mono text-text-muted block mb-1">HR</span>
                  <span className="font-sans font-bold text-2xl text-red">{brief.vitals?.hr || "--"}</span>
                </div>
                <div className="p-6 bg-bg3 border border-amber/30 rounded-sm text-center">
                  <Droplets className="w-8 h-8 text-amber mx-auto mb-3" />
                  <span className="text-xs font-mono text-text-muted block mb-1">SpO2</span>
                  <span className="font-sans font-bold text-2xl text-amber">{brief.vitals?.spo2 || "--"}</span>
                </div>
                <div className="p-6 bg-bg3 border border-border rounded-sm text-center">
                  <Brain className="w-8 h-8 text-text-muted mx-auto mb-3" />
                  <span className="text-xs font-mono text-text-muted block mb-1">GCS</span>
                  <span className="font-sans font-bold text-2xl text-text">{brief.vitals?.gcs || "--"}</span>
                </div>
              </div>
            </div>

            {/* Prepare Immediately */}
            {brief.resources && brief.resources.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-green" />
                    <span className="font-sans font-bold text-lg text-green uppercase tracking-wider">
                      Prepare Immediately
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {brief.resources.map((resource: string, i: number) => (
                      <div
                        key={`resource-${i}`}
                        className="px-6 py-4 bg-green/10 border-2 border-green text-green font-sans font-semibold text-lg rounded-sm"
                      >
                        {resource}
                      </div>
                    ))}
                  </div>
                </div>
            )}

            {/* Medications & Allergies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-bg3 border border-border rounded-sm">
                <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-2">
                  Medications
                </span>
                <span className="text-text">{brief.medications || "None reported"}</span>
              </div>
              <div className="p-4 bg-bg3 border border-border rounded-sm">
                <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-2">
                  Allergies
                </span>
                <span className="text-text">{brief.allergies || "None reported"}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="p-4 bg-bg3 border border-border rounded-sm">
              <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-2">
                Notes
              </span>
              <p className="text-text-dim">{brief.notes || "No additional notes provided."}</p>
            </div>

            {/* AI Attribution */}
            <div className="flex items-center justify-center gap-2 p-4 border-t border-border bg-purple/5">
              <span className="w-2 h-2 rounded-full bg-purple animate-pulse" />
              <span className="text-xs font-mono text-purple uppercase tracking-wider font-bold">
                GENERATED BY GEMMA 4 — EDGE AI — ON-DEVICE INFERENCE
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

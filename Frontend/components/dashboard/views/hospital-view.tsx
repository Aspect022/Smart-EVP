"use client"

import { Activity, Heart, Droplets, Brain, AlertTriangle } from "lucide-react"

interface HospitalViewProps {
  brief: any
  distance: number | null
  connected: boolean
}

// ECG Wave Component
function EcgWave({ color = "#ef4444" }: { color?: string }) {
  return (
    <div className="w-full h-12 overflow-hidden flex items-center justify-start opacity-70">
       <svg
         viewBox="0 0 500 100"
         className="w-[200%] h-full ecg-wave-animate"
       >
          <path 
            d="M0,50 L50,50 L60,20 L75,90 L90,10 L100,50 L150,50 L160,20 L175,90 L190,10 L200,50 L250,50 L260,20 L275,90 L290,10 L300,50 L350,50 L360,20 L375,90 L390,10 L400,50 L500,50" 
            fill="none" 
            stroke={color} 
            strokeWidth="3" 
            strokeLinejoin="round" 
            strokeLinecap="round"
          />
       </svg>
    </div>
  )
}

export function HospitalView({ brief, distance, connected }: HospitalViewProps) {
  const estimatedSecondsLeft = distance ? Math.floor(distance / 10) : (brief ? brief.eta : 0);
  const isArriving = estimatedSecondsLeft <= 120; // Siren mode < 2 mins
  const isImminent = estimatedSecondsLeft <= 10 && distance !== null && distance < 100;

  const formatEta = (seconds: number) => {
    if (!seconds || seconds <= 0) return "--:--";
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!brief) {
      return (
          <div className="h-full bg-bg flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 border-2 border-border border-dashed rounded-full flex items-center justify-center mb-6">
                 <Activity className="w-10 h-10 text-text-dim" />
              </div>
              <h2 className="text-2xl font-sans font-bold text-text-muted mb-2">AWAITING MEDICAL INTAKE</h2>
              <p className="text-sm font-mono text-text-dim tracking-widest">{connected ? 'SYSTEM LINKED • STANDBY' : 'SYSTEM OFFLINE'}</p>
          </div>
      )
  }

  return (
    <div className={`flex flex-col flex-1 overflow-y-auto h-full p-8 transition-colors duration-700 ${isArriving && !isImminent ? "bg-red/5" : "bg-bg"}`}>
        {/* Arriving Banner Imminent */}
        {isImminent && (
          <div className="mb-6 p-4 bg-red/20 border-2 border-red text-center shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse rounded-sm">
            <span className="font-sans font-black text-3xl text-red tracking-widest uppercase">
              PATIENT ARRIVING NOW — CLEAR BAY 1
            </span>
          </div>
        )}

        {/* Header Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 p-6 bg-card border border-border rounded-sm shadow-lg flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                    <span className="live-dot w-2 h-2" />
                    <span className="text-xs font-mono text-green uppercase tracking-wider font-bold">
                        LIVE BRIEF • GEMMA 4 ACTIVE
                    </span>
                    {distance && (
                        <span className="text-xs font-mono text-cyan ml-4 border border-cyan/30 bg-cyan/10 px-2 py-0.5 rounded-sm">
                        DIST: {distance}m
                        </span>
                    )}
                </div>
                <h1 className="font-sans font-bold text-4xl text-amber mb-2">
                    {brief.suspectedDiagnosis}
                </h1>
                <p className="text-text-dim text-xl font-mono">
                    {brief.gender}, {brief.age} years old
                </p>
                <div className="mt-4 inline-block">
                    <span className={`px-4 py-1.5 border font-mono font-bold text-sm tracking-widest uppercase ${
                        brief.priority === 'P1' ? 'bg-red/10 text-red border-red/30' : 
                        brief.priority === 'P2' ? 'bg-amber/10 text-amber border-amber/30' : 
                        'bg-green/10 text-green border-green/30'
                    }`}>
                        {brief.priority} — {brief.priority === 'P1' ? 'IMMEDIATE' : brief.priority === 'P2' ? 'URGENT' : 'STANDARD'}
                    </span>
                </div>
            </div>

            {/* Huge ETA Countdown */}
            <div className={`p-6 border rounded-sm shadow-lg flex flex-col items-center justify-center text-center transition-colors ${
                isArriving ? "bg-red/10 border-red/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]" : "bg-card border-border"
            }`}>
               <span className="text-sm font-mono text-text-muted uppercase tracking-widest block mb-2">
                 Time to Arrival
               </span>
               <span className={`font-sans font-black text-6xl tabular-nums ${isArriving ? "text-red animate-pulse" : "text-text"}`}>
                 {isImminent ? "0:00" : formatEta(estimatedSecondsLeft)}
               </span>
               {isArriving && !isImminent && (
                   <span className="text-xs font-mono text-red uppercase tracking-widest mt-4 border border-red/30 px-2 py-1 bg-red/10 animate-pulse">SIREN MODE</span>
               )}
            </div>
        </div>

        {/* Chief Complaint */}
        <div className="p-5 bg-bg3 border-l-4 border-red mb-8">
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-2">
            Chief Complaint
            </span>
            <p className="text-text text-2xl font-sans font-semibold">
            {brief.chiefComplaint}
            </p>
        </div>

        {/* ECG Vitals Monitor */}
        <div className="mb-8">
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-4">
            Live Vitals Telemetry
            </span>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-card border border-border rounded-sm flex flex-col relative overflow-hidden">
                <div className="flex items-center gap-2 text-text-muted mb-2">
                    <Activity className="w-5 h-5" />
                    <span className="text-xs font-mono uppercase tracking-widest">NIBP</span>
                </div>
                <div className="font-sans font-bold text-3xl text-text mb-4 z-10">{brief.vitals?.bp || "--"}</div>
                <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30">
                    <EcgWave color="var(--text)" />
                </div>
            </div>
            
            <div className="p-6 bg-card border border-red/30 rounded-sm flex flex-col relative overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <div className="flex items-center gap-2 text-red mb-2">
                    <Heart className="w-5 h-5" />
                    <span className="text-xs font-mono uppercase tracking-widest text-red">HR</span>
                </div>
                <div className="font-sans font-bold text-3xl text-red mb-4 z-10">{brief.vitals?.hr || "--"} <span className="text-sm font-normal text-red/70">bpm</span></div>
                <div className="absolute bottom-0 left-0 right-0 h-10">
                    <EcgWave color="var(--red)" />
                </div>
            </div>

            <div className="p-6 bg-card border border-amber/30 rounded-sm flex flex-col relative overflow-hidden">
                <div className="flex items-center gap-2 text-amber mb-2">
                    <Droplets className="w-5 h-5" />
                    <span className="text-xs font-mono uppercase tracking-widest text-amber">SpO2</span>
                </div>
                <div className="font-sans font-bold text-3xl text-amber mb-4 z-10">{brief.vitals?.spo2 || "--"} <span className="text-sm font-normal text-amber/70">%</span></div>
                <div className="absolute bottom-0 left-0 right-0 h-10">
                    <EcgWave color="var(--amber)" />
                </div>
            </div>

            <div className="p-6 bg-card border border-border rounded-sm flex flex-col relative overflow-hidden">
                <div className="flex items-center gap-2 text-cyan mb-2">
                    <Brain className="w-5 h-5" />
                    <span className="text-xs font-mono uppercase tracking-widest text-cyan">GCS</span>
                </div>
                <div className="font-sans font-bold text-3xl text-cyan mb-4 z-10">{brief.vitals?.gcs || "--"} <span className="text-sm font-normal text-cyan/70">/15</span></div>
            </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resources to Prepare */}
            {brief.resources && brief.resources.length > 0 && (
                <div>
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-green" />
                    <span className="font-mono font-bold text-sm text-green uppercase tracking-wider">
                    Required Resources
                    </span>
                </div>
                <div className="flex flex-col gap-3">
                    {brief.resources.map((resource: string, i: number) => (
                    <div
                        key={`resource-${i}`}
                        className="px-5 py-4 bg-bg3 border border-border text-text font-mono text-sm rounded-sm flex items-center justify-between"
                    >
                        <span>{resource}</span>
                        <div className="w-4 h-4 rounded-full border border-text-muted" />
                    </div>
                    ))}
                </div>
                </div>
            )}

            {/* Meds & Notes */}
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-bg3 border border-border rounded-sm">
                        <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-2">
                        Medications Given
                        </span>
                        <span className="text-text font-mono text-sm">{brief.medications || "None"}</span>
                    </div>
                    <div className="p-5 bg-bg3 border border-border rounded-sm">
                        <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-2">
                        Known Allergies
                        </span>
                        <span className="text-text font-mono text-sm">{brief.allergies || "None"}</span>
                    </div>
                </div>
                <div className="p-5 bg-bg3 border border-border rounded-sm">
                    <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-2">
                    Paramedic Notes
                    </span>
                    <p className="text-text-dim text-sm font-mono leading-relaxed">{brief.notes || "-"}</p>
                </div>
            </div>
        </div>
    </div>
  )
}

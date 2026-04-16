"use client"

import { useState, useEffect } from "react"
import { Activity, Heart, Droplets, Brain, AlertTriangle, User, FileText, CheckCircle, ShieldAlert } from "lucide-react"
import type { CaseStatus } from "@/hooks/use-socket"

interface HospitalViewProps {
  brief: any
  transcript: string
  activeCase: any
  distance: number | null
  connected: boolean
  caseStatus: CaseStatus
  etaSeconds: number | null
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

export function HospitalView({ brief, transcript, activeCase, distance, connected, caseStatus, etaSeconds }: HospitalViewProps) {
  const [localEta, setLocalEta] = useState<number | null>(etaSeconds)
  const [modalOpen, setModalOpen] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)
  
  // Track arriving states
  const isEnRoute = caseStatus === "EN_ROUTE_HOSPITAL" || caseStatus === "ARRIVING"
  const isArriving = isEnRoute && (localEta !== null && localEta <= 120) // Siren mode < 2 mins OR distance < 2000m
  const isImminent = caseStatus === "ARRIVING" && (localEta !== null && localEta <= 10)

  useEffect(() => {
    if (etaSeconds !== null) setLocalEta(etaSeconds)
  }, [etaSeconds])

  useEffect(() => {
    if (localEta === null || localEta <= 0) return
    const interval = setInterval(() => setLocalEta(prev => (prev && prev > 0 ? prev - 1 : 0)), 1000)
    return () => clearInterval(interval)
  }, [localEta])

  // Look for alert triggering condition
  useEffect(() => {
    if (isEnRoute && !alertDismissed && !modalOpen) {
       // Show alert banner, maybe play an audio chime here if needed
    }
  }, [isEnRoute, alertDismissed, modalOpen])

  const formatEta = (seconds: number) => {
    if (!seconds || seconds <= 0) return "--:--";
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Generate generic data if brief isn't ready
  const priority = brief?.priority || activeCase?.severity || "PENDING"
  const diagnosis = brief?.diagnosis || activeCase?.complaint || "Awaiting medical brief..."
  const colorMode = priority === "CRITICAL" ? "red" : priority === "HIGH" ? "amber" : "green"

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-1000 ${
        isArriving ? "bg-red/10" : "bg-bg" 
    }`}>
      
      {/* Imminent Arrival Siren Overlays */}
      {isArriving && (
          <div className="absolute inset-0 pointer-events-none z-0">
             <div className="absolute inset-0 border-[8px] border-red opacity-30 animate-pulse" />
             <div className="absolute top-1/2 left-0 w-full h-[10vh] bg-red/5 blur-3xl" />
          </div>
      )}

      {isImminent && (
          <div className="absolute inset-0 bg-red z-50 flex items-center justify-center animate-pulse pointer-events-none mix-blend-screen">
             <h1 className="text-white font-sans font-black text-8xl tracking-tight uppercase">PATIENT ARRIVING</h1>
          </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 flex-1 grid grid-cols-12 gap-0 overflow-y-auto">
        
        {/* Left Column - Realtime Telemetry Grid */}
        <div className="col-span-12 lg:col-span-4 border-r border-border flex flex-col bg-bg2">
           <div className="p-6 border-b border-border bg-bg/50 backdrop-blur-md">
             <div className="flex justify-between items-center mb-2">
                 <h2 className="text-xl font-sans font-bold text-text flex items-center gap-2">
                    <Activity className="text-cyan w-5 h-5" /> 
                    Live Vitals
                 </h2>
                 <span className={`px-2 py-1 text-[10px] font-mono tracking-widest uppercase rounded-sm border ${
                   connected ? "border-green/30 text-green bg-green/10" : "border-red/30 text-red bg-red/10 animate-pulse"
                 }`}>
                   {connected ? "TELEMETRY LINKED" : "OFFLINE"}
                 </span>
             </div>
             <p className="text-xs text-text-muted font-mono uppercase tracking-widest">
                Source: Unit AMB-001
             </p>
           </div>

           <div className="flex-1 p-6 grid grid-cols-1 gap-6">
              {/* Heart Rate / ECG */}
              <div className="bg-bg border border-border rounded-md p-4 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-3 opacity-30 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-8 h-8 text-red" />
                 </div>
                 <div className="text-xs text-text-muted font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red animate-pulse" />
                    Heart Rate
                 </div>
                 <div className="flex items-end gap-2 mb-4">
                    <div className="text-5xl font-sans font-black text-red tabular-nums leading-none">112</div>
                    <div className="text-sm font-mono text-text-muted mb-1">BPM</div>
                 </div>
                 <div className="h-16 w-full -ml-4">
                    <EcgWave color="#ef4444" />
                 </div>
              </div>

              {/* BP & SpO2 */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-bg border border-border rounded-md p-4">
                    <div className="text-xs text-text-muted font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Activity className="w-3 h-3 text-cyan" /> BP
                    </div>
                    <div className="text-3xl font-sans font-black text-cyan tabular-nums">90/60</div>
                 </div>
                 <div className="bg-bg border border-border rounded-md p-4">
                    <div className="text-xs text-text-muted font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Droplets className="w-3 h-3 text-amber" /> SpO2
                    </div>
                    <div className="text-3xl font-sans font-black text-amber tabular-nums">94<span className="text-base font-normal">%</span></div>
                 </div>
              </div>

              {/* Glasgow Scale */}
              <div className="bg-bg border border-border rounded-md p-4">
                 <div className="text-xs text-text-muted font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Brain className="w-3 h-3 text-purple" /> GCS
                 </div>
                 <div className="text-3xl font-sans font-black text-purple tabular-nums">15 <span className="text-sm font-normal text-text-muted tracking-wider uppercase">Conscious</span></div>
              </div>
           </div>
        </div>

        {/* Right Column - Medical Brief & Timeline */}
        <div className="col-span-12 lg:col-span-8 flex flex-col bg-bg">
           
           {/* Top Sticky Alert Header (if incoming) */}
           {isEnRoute && (
              <div className={`p-4 border-b border-${colorMode} bg-${colorMode}/10 shadow-md`}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className={`bg-${colorMode}/20 p-3 rounded-full animate-pulse`}>
                          <AlertTriangle className={`w-6 h-6 text-${colorMode}`} />
                       </div>
                       <div>
                          <h2 className={`font-sans font-bold text-xl text-${colorMode} tracking-tight uppercase`}>Incoming Patient</h2>
                          <p className="text-sm font-mono text-text">Unit AMB-001 • {brief ? "Code 3 ETA Updated" : "Awaiting Medical Brief..."}</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <div className={`text-xs font-mono text-${colorMode} uppercase tracking-widest mb-1`}>Live ETA</div>
                          <div className={`text-3xl font-sans font-bold text-${colorMode} tabular-nums leading-none`}>
                             {localEta !== null ? formatEta(localEta) : "--:--"}
                          </div>
                       </div>
                       <button 
                         onClick={() => setModalOpen(true)}
                         className={`px-6 py-3 bg-${colorMode} text-white font-bold font-mono text-sm uppercase tracking-widest rounded-sm shadow-[0_0_20px_rgba(var(--${colorMode}-rgb),0.5)] hover:-translate-y-0.5 transition-transform`}
                       >
                         View Case Details →
                       </button>
                    </div>
                 </div>
              </div>
           )}

           {/* Transcript & AI Core Content */}
           <div className="flex-1 p-8 overflow-y-auto">
              {!brief && !transcript && !activeCase ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                     <FileText className="w-16 h-16 mb-4" />
                     <p className="font-mono text-lg uppercase tracking-widest">No Active Patient Intakes</p>
                  </div>
              ) : (
                 <div className="max-w-4xl mx-auto space-y-8">
                    
                    {/* Patient Context Head */}
                    <div className="flex items-start justify-between">
                       <div>
                         <h1 className="text-4xl font-sans font-black text-text mb-2">Patient #8291-A</h1>
                         <p className="font-mono text-cyan uppercase tracking-widest flex items-center gap-2">
                           <User className="w-4 h-4"/> 58 YO MALE
                         </p>
                       </div>
                       <div className={`px-4 py-2 border-2 border-${colorMode} text-${colorMode} font-black text-xl uppercase tracking-widest rounded-sm`}>
                         {priority} PRIORITY
                       </div>
                    </div>

                    {/* AI Diagnosis Summary */}
                    <div className="bg-bg2 p-6 border-l-4 border-cyan rounded-r-md">
                       <h3 className="text-xs text-text-muted font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                         <Brain className="w-4 h-4"/> AI Assessed Complaint
                       </h3>
                       <p className="text-2xl text-text font-serif leading-relaxed">
                         {diagnosis}
                       </p>
                    </div>

                    {/* The Full Medical Brief */}
                    {brief && (
                        <div className="grid grid-cols-2 gap-6 pt-4">
                           <div className="col-span-2 md:col-span-1 p-5 border border-border bg-bg relative">
                              <h3 className="text-xs text-text-muted font-mono uppercase tracking-widest mb-4">Required Resources</h3>
                              <ul className="space-y-4">
                                {(brief.resources || []).map((res: string, i: number) => (
                                   <li key={i} className="flex items-start gap-3">
                                      <CheckCircle className="w-5 h-5 text-green shrink-0 mt-0.5" />
                                      <span className="font-sans text-text">{res}</span>
                                   </li>
                                ))}
                              </ul>
                           </div>
                           
                           <div className="col-span-2 md:col-span-1 p-5 border border-border bg-bg">
                              <h3 className="text-xs text-text-muted font-mono uppercase tracking-widest mb-4">Vitals Summary & Interventions</h3>
                               <p className="text-sm font-sans text-text-muted leading-relaxed mb-4">
                                 {brief.vitals_summary}
                               </p>
                               {brief.allergies && brief.allergies !== "None reported" && (
                                  <div className="p-3 bg-red/10 border border-red/30 rounded-sm">
                                     <h4 className="text-[10px] text-red font-mono uppercase tracking-widest mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Fast Alerts</h4>
                                     <p className="text-xs text-white font-sans">{brief.allergies}</p>
                                  </div>
                               )}
                           </div>
                        </div>
                    )}

                    {/* Raw Transcript Logs */}
                    <div className="pt-8 border-t border-border">
                       <h3 className="text-xs text-text-muted font-mono uppercase tracking-widest mb-4">Paramedic Audio Transcript Log</h3>
                       <div className="bg-bg3 border border-border rounded-sm p-5 font-mono text-sm text-text-dim leading-loose shadow-inner h-48 overflow-y-auto">
                          {transcript ? (
                             <p>{transcript}</p>
                          ) : (
                             <p className="italic opacity-50">Waiting for live audio feed...</p>
                          )}
                       </div>
                    </div>

                 </div>
              )}
           </div>

        </div>
      </div>

      {/* Incoming Patient Modal */}
      {modalOpen && isEnRoute && (
         <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-bg/90 backdrop-blur-sm p-4">
            <div className={`w-full max-w-2xl bg-bg border-2 border-${colorMode} shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col`}>
               <div className={`bg-${colorMode} p-6 flex justify-between items-center`}>
                  <h2 className="text-3xl font-black text-bg tracking-tight uppercase flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8"/> 
                    Code {priority}: ETA {localEta !== null ? formatEta(localEta) : "--:--"}
                  </h2>
               </div>
               <div className="p-8 space-y-6">
                  <div>
                    <h3 className="font-mono text-text-muted uppercase text-sm mb-2">Complaint / Presumptive</h3>
                    <p className="text-xl text-text font-serif">{diagnosis}</p>
                  </div>
                  
                  {brief && (
                     <div className="p-4 bg-bg2 border border-border rounded-sm">
                       <h3 className="font-mono text-cyan uppercase text-xs mb-3 flex items-center gap-2"><Brain className="w-4 h-4"/> Gemma 4 Recommendation</h3>
                       <ul className="space-y-2">
                         {brief.resources.map((r: string, i: number) => (
                            <li key={i} className="text-sm border-b border-border pb-2 last:border-0 text-text">{r}</li>
                         ))}
                       </ul>
                     </div>
                  )}

                  <button 
                    onClick={() => setModalOpen(false)}
                    className="w-full py-4 mt-4 border border-border hover:bg-bg3 transition-colors text-text font-bold font-mono uppercase tracking-widest"
                  >
                    Confirm & Acknowledge
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  )
}

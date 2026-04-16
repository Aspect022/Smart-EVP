"use client"

import { useState } from "react"
import { MapPanel } from "@/components/dashboard/map-panel"
import { Activity, Heart, Droplets, Brain } from "lucide-react"

interface AmbulanceViewProps {
  gps: any
  signal: "RED" | "AMBER" | "GREEN"
  distance: number | null
  intersectionCoords: { lat: number; lng: number }
  connected: boolean
}

export function AmbulanceView({ gps, signal, distance, intersectionCoords, connected }: AmbulanceViewProps) {
  const [pulse, setPulse] = useState(false)

  // Simulation state for vitals
  const [vitals, setVitals] = useState({
    bp: "120/80",
    hr: "85",
    spo2: "98",
    gcs: "15"
  })

  const sendSimulatedVitals = async () => {
    try {
      setPulse(true)
      setTimeout(() => setPulse(false), 1000)
      
      // We would normally POST to backend here to broadcast medical brief update.
      // But for this mockup, we just highlight the button.
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/demo/audio`, { method: "POST" }).catch(() => {})
    } catch (e) {
      console.error(e)
    }
  }

  const activateManualPreemption = async () => {
    // In reality this might send an override command.
    console.log("Manual preemption triggered")
  }

  const isNearIntersection = distance !== null && distance < 500

  return (
    <div className="flex flex-1 overflow-hidden h-full">

      {/* Main Nav Area (HUD) */}
      <div className="flex-[3] relative border-r border-border flex flex-col">
        {/* HUD Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 z-[1000] flex justify-between pointer-events-none">
           <div className="bg-bg/80 backdrop-blur-md border border-border p-3 rounded-sm pointer-events-auto">
             <div className="text-xs text-text-muted font-mono uppercase tracking-widest mb-1">Current Speed</div>
             <div className="text-4xl font-sans font-bold text-cyan tabular-nums">
               {gps ? gps.speed : "--"} <span className="text-xl text-text-muted font-normal">km/h</span>
             </div>
           </div>
           
           <div className="bg-bg/80 backdrop-blur-md border border-border p-3 rounded-sm pointer-events-auto text-right">
             <div className="text-xs text-text-muted font-mono uppercase tracking-widest mb-1">Target Distance</div>
             <div className={`text-4xl font-sans font-bold tabular-nums ${isNearIntersection ? "text-amber" : "text-text"}`}>
               {distance !== null ? distance : "--"} <span className="text-xl text-text-muted font-normal">m</span>
             </div>
           </div>
        </div>

        {/* Map Background */}
        <div className="flex-1 relative">
          <MapPanel
             gpsData={gps}
             signalState={signal}
             intersectionCoords={intersectionCoords}
          />
        </div>

        {/* Bottom Preemption Trigger Area */}
        <div className="h-48 bg-bg2 border-t border-border flex items-center justify-center p-6 shrink-0 relative overflow-hidden">
           {/* Ambient Glow */}
           <div className="absolute inset-0 pointer-events-none opacity-30">
              {signal === "GREEN" && <div className="w-full h-full bg-green/20 animate-pulse" />}
              {signal === "AMBER" && <div className="w-full h-full bg-amber/20 animate-pulse" />}
              {signal === "RED" && isNearIntersection && <div className="w-full h-full bg-red/10 animate-pulse" />}
           </div>

           <button 
             onClick={activateManualPreemption}
             className={`relative z-10 w-full max-w-2xl py-6 rounded-sm font-sans font-black text-3xl uppercase tracking-widest transition-all duration-300 ${
               signal === "GREEN" 
                 ? "bg-green/20 text-green border-2 border-green shadow-[0_0_40px_rgba(74,222,128,0.4)]" 
                 : isNearIntersection
                   ? "bg-amber/20 text-amber border-2 border-amber shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-pulse"
                   : "bg-bg3 text-text-muted border border-border hover:border-border2"
             }`}
           >
             {signal === "GREEN" ? "CORRIDOR SECURED" : isNearIntersection ? "ACTIVATE PREEMPTION" : "AWAITING APPROACH"}
           </button>
        </div>
      </div>

      {/* Paramedic Input Sidebar */}
      <div className="w-80 bg-bg p-6 flex flex-col shrink-0 overflow-y-auto border-l border-border">
         <h2 className="font-sans font-bold text-xl text-text mb-6">Paramedic Entry</h2>
         
         <div className="space-y-4 mb-8">
            <div>
              <label className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <Activity className="w-3 h-3"/> Blood Pressure
              </label>
              <input 
                value={vitals.bp} 
                onChange={(e) => setVitals({...vitals, bp: e.target.value})}
                className="w-full bg-bg3 border border-border rounded-sm px-3 py-2 text-text font-mono focus:border-cyan focus:outline-none" 
              />
            </div>
            <div>
              <label className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <Heart className="w-3 h-3 text-red"/> Heart Rate
              </label>
              <input 
                value={vitals.hr} 
                onChange={(e) => setVitals({...vitals, hr: e.target.value})}
                className="w-full bg-bg3 border border-border rounded-sm px-3 py-2 text-text font-mono focus:border-cyan focus:outline-none" 
              />
            </div>
            <div>
              <label className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <Droplets className="w-3 h-3 text-amber"/> SpO2
              </label>
              <input 
                value={vitals.spo2} 
                onChange={(e) => setVitals({...vitals, spo2: e.target.value})}
                className="w-full bg-bg3 border border-border rounded-sm px-3 py-2 text-text font-mono focus:border-cyan focus:outline-none" 
              />
            </div>
            <div>
              <label className="text-xs font-mono text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <Brain className="w-3 h-3"/> GCS
              </label>
              <input 
                value={vitals.gcs} 
                onChange={(e) => setVitals({...vitals, gcs: e.target.value})}
                className="w-full bg-bg3 border border-border rounded-sm px-3 py-2 text-text font-mono focus:border-cyan focus:outline-none" 
              />
            </div>
         </div>

         <div className="mt-auto">
            <button 
              onClick={sendSimulatedVitals}
              className={`w-full py-3 rounded-sm font-mono font-bold text-sm uppercase tracking-wider transition-all ${
                pulse ? "bg-purple text-bg shadow-[0_0_20px_rgba(167,139,250,0.5)]" : "bg-purple/10 text-purple border border-purple/30 hover:bg-purple/20"
              }`}
            >
              Transmit Vitals
            </button>
            <p className="text-center text-[10px] text-text-muted font-mono mt-3">
              Syncs to Hospital ERIS via Socket
            </p>
         </div>
      </div>
    </div>
  )
}

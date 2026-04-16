"use client"

import { useState, useEffect } from "react"
import { MapPanel } from "@/components/dashboard/map-panel"
import { Activity, Heart, Droplets, Brain, Navigation, Clock, CheckCircle } from "lucide-react"
import type { CaseStatus } from "@/hooks/use-socket"

interface AmbulanceViewProps {
  gps: any
  signal: "RED" | "AMBER" | "GREEN"
  distance: number | null
  intersectionCoords: { lat: number; lng: number }
  connected: boolean
  caseStatus: CaseStatus
  etaSeconds: number | null
}

export function AmbulanceView({ gps, signal, distance, intersectionCoords, connected, caseStatus, etaSeconds }: AmbulanceViewProps) {
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

  const updateStatus = async (status: CaseStatus, eta?: number) => {
    try {
      const payload: any = { status }
      if (eta !== undefined) payload.etaSeconds = eta
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/api/case/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
    } catch (e) {
      console.error("Failed to update status", e)
    }
  }

  const isNearIntersection = distance !== null && distance < 500
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

  // Determine standard origin/destination for demo
  const hospitalLoc = "Fortis+Hospital+Bannerghatta+Road+Bengaluru"
  const patientLoc = "BTM+Layout+Bengaluru"
  
  const mapOrigin = caseStatus === "EN_ROUTE_HOSPITAL" ? patientLoc : "Jayanagar+Bengaluru"
  const mapDest = caseStatus === "EN_ROUTE_HOSPITAL" ? hospitalLoc : patientLoc

  // Let local ETA state simulate countdown between server syncs
  const [localEta, setLocalEta] = useState<number | null>(etaSeconds)
  
  useEffect(() => {
    if (etaSeconds !== null) setLocalEta(etaSeconds)
  }, [etaSeconds])

  useEffect(() => {
    if (localEta === null || localEta <= 0) return
    const interval = setInterval(() => setLocalEta(prev => (prev && prev > 0 ? prev - 1 : 0)), 1000)
    return () => clearInterval(interval)
  }, [localEta])

  const formatEta = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-1 overflow-hidden h-full">

      {/* Main Nav Area (HUD) */}
      <div className="flex-[3] relative flex flex-col bg-bg2">
        {/* HUD Navigation Top Bar */}
        <div className="bg-bg border-b border-border p-4 flex gap-4 shrink-0 shadow-md z-[10]">
           <div className="flex-1 bg-bg3 border border-border rounded-sm p-3 flex flex-col justify-center">
             <div className="text-xs text-text-muted font-mono uppercase tracking-widest mb-1 flex items-center gap-2">
               <Navigation className="w-3 h-3 text-cyan" /> 
               {caseStatus === "EN_ROUTE_HOSPITAL" ? "Heading to Hospital" : "Heading to Patient"}
             </div>
             <div className="text-xl font-sans font-bold text-text truncate">
                {caseStatus === "EN_ROUTE_HOSPITAL" ? "Fortis Hospital ER" : "BTM Layout (Critical)"}
             </div>
           </div>

           <div className="bg-bg3 border border-border rounded-sm p-3 flex flex-col justify-center min-w-[150px]">
             <div className="text-xs text-text-muted font-mono uppercase tracking-widest mb-1 flex items-center gap-2">
               <Clock className="w-3 h-3 text-amber" /> Live ETA
             </div>
             <div className="text-2xl font-sans font-bold text-amber tabular-nums">
                {localEta !== null ? formatEta(localEta) : "--:--"}
             </div>
           </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-bg">
          {caseStatus === "ARRIVING" ? (
            <MapPanel
               gpsData={gps}
               signalState={signal}
               intersectionCoords={intersectionCoords}
            />
          ) : (
            <div className="w-full h-full p-2 relative">
               {!mapsKey ? (
                  <div className="w-full h-full border-2 border-dashed border-border flex flex-col items-center justify-center bg-bg3/50 text-center p-8">
                     <p className="text-text-muted font-mono mb-4 max-w-md">
                       Google Maps API Key not set. In a real environment, the turn-by-turn navigation iframe would render here.
                     </p>
                     <a 
                       href={`https://www.google.com/maps/dir/?api=1&origin=${mapOrigin}&destination=${mapDest}&travelmode=driving`}
                       target="_blank"
                       rel="noreferrer"
                       className="px-6 py-3 bg-cyan/10 text-cyan font-bold border border-cyan/30 rounded-full hover:bg-cyan/20 transition-colors uppercase tracking-widest font-mono text-sm"
                     >
                       Open Native Google Maps →
                     </a>
                  </div>
               ) : (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0, borderRadius: "8px" }}
                    src={`https://www.google.com/maps/embed/v1/directions?key=${mapsKey}&origin=${mapOrigin}&destination=${mapDest}&mode=driving`}
                    allowFullScreen
                  />
               )}
               {/* Overlay HUD Stats inside Map */}
               <div className="absolute bottom-6 left-6 bg-bg/90 backdrop-blur-md border border-border p-3 rounded-md shadow-lg">
                 <div className="text-xs text-text-muted font-mono uppercase tracking-widest mb-1">Current Speed</div>
                 <div className="text-3xl font-sans font-bold text-cyan tabular-nums leading-none">
                   {gps ? gps.speed : "--"} <span className="text-lg text-text-muted font-normal">km/h</span>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Bottom Status Trigger Area */}
        <div className="h-28 bg-bg2 border-t border-border flex items-center justify-center gap-4 p-4 shrink-0 relative overflow-hidden">
           {caseStatus !== "EN_ROUTE_HOSPITAL" && caseStatus !== "ARRIVING" && (
             <button 
               onClick={() => updateStatus("PATIENT_PICKED", 180)} // Assuming 180s patient load time before routing to hospital
               className="flex items-center gap-3 px-8 py-4 bg-amber/10 text-amber border-2 border-amber hover:bg-amber hover:text-white rounded-sm font-sans font-bold text-xl uppercase tracking-widest transition-all"
             >
               <CheckCircle className="w-6 h-6" /> Patient Picked Up
             </button>
           )}
           {(caseStatus === "PATIENT_PICKED" || caseStatus === "EN_ROUTE_HOSPITAL") && (
             <button 
               onClick={() => updateStatus("EN_ROUTE_HOSPITAL", 320)} // Example 5m20s ETA to hospital
               className="flex items-center gap-3 px-8 py-4 bg-green/10 text-green border-2 border-green hover:bg-green hover:text-white rounded-sm font-sans font-bold text-xl uppercase tracking-widest transition-all"
             >
               <Navigation className="w-6 h-6" /> Proceed to Hospital
             </button>
           )}
           {caseStatus === "EN_ROUTE_HOSPITAL" && distance !== null && distance < 2000 && (
             <button 
               onClick={() => updateStatus("ARRIVING", 60)} 
               className="flex items-center gap-3 px-8 py-4 bg-red/10 text-red border-2 border-red hover:bg-red hover:text-white rounded-sm font-sans font-black text-xl uppercase tracking-widest transition-all animate-pulse"
             >
               Final Approach (Preempt Signals)
             </button>
           )}
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

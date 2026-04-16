"use client"

import Link from "next/link"
import { ShieldAlert, Ambulance, Stethoscope, ArrowLeft } from "lucide-react"

export function DemoLauncher() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background ambient grid overlay */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-bg2 via-bg to-bg opacity-80" />
      <div className="absolute inset-0 z-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="z-10 w-full max-w-6xl text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-sans font-black text-text tracking-tighter mb-4">
          CHOOSE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-red to-amber animate-pulse">ROLE</span>
        </h1>
        <p className="text-xl text-text-muted font-mono tracking-widest uppercase">
          SmartEVP+ Demo Setup • Select laptop assignment
        </p>
      </div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        
        {/* Admin Card */}
        <div className="group relative flex flex-col p-8 bg-card border-2 border-border hover:border-cyan rounded-md transition-all duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)] hover:-translate-y-2">
           <div className="absolute top-0 right-0 p-4">
             <span className="text-xs font-mono text-cyan bg-cyan/10 px-2 py-1 rounded-sm uppercase tracking-widest border border-cyan/30">Laptop 1</span>
           </div>
           <ShieldAlert className="w-16 h-16 text-cyan mb-6 group-hover:scale-110 transition-transform" />
           <h2 className="text-3xl font-black text-text tracking-tight mb-2">Command Center</h2>
           <p className="text-text-muted font-mono mb-8 flex-1">
             The global admin view. Dispatch ambulance, trigger demo events, control preemption signals, and monitor end-to-end latency.
           </p>
           <Link 
             href="/dashboard?view=admin"
             className="w-full py-4 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 rounded-sm font-bold text-center uppercase tracking-widest transition-colors"
           >
             Launch Admin →
           </Link>
        </div>

        {/* Ambulance Card */}
        <div className="group relative flex flex-col p-8 bg-card border-2 border-border hover:border-amber rounded-md transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,158,11,0.2)] hover:-translate-y-2">
           <div className="absolute top-0 right-0 p-4">
             <span className="text-xs font-mono text-amber bg-amber/10 px-2 py-1 rounded-sm uppercase tracking-widest border border-amber/30">Laptop 2</span>
           </div>
           <Ambulance className="w-16 h-16 text-amber mb-6 group-hover:scale-110 transition-transform" />
           <h2 className="text-3xl font-black text-text tracking-tight mb-2">Paramedic HUD</h2>
           <p className="text-text-muted font-mono mb-8 flex-1">
             The en-route interface. Follow live Google Maps route, update ETA, and use push-to-talk to send live audio transcripts to the hospital.
           </p>
           <Link 
             href="/dashboard?view=ambulance"
             className="w-full py-4 bg-amber/10 hover:bg-amber/20 text-amber border border-amber/30 rounded-sm font-bold text-center uppercase tracking-widest transition-colors"
           >
             Launch Ambulance →
           </Link>
        </div>

        {/* Hospital Card */}
        <div className="group relative flex flex-col p-8 bg-card border-2 border-border hover:border-green rounded-md transition-all duration-300 hover:shadow-[0_0_40px_rgba(74,222,128,0.2)] hover:-translate-y-2">
           <div className="absolute top-0 right-0 p-4">
             <span className="text-xs font-mono text-green bg-green/10 px-2 py-1 rounded-sm uppercase tracking-widest border border-green/30">Laptop 3</span>
           </div>
           <Stethoscope className="w-16 h-16 text-green mb-6 group-hover:scale-110 transition-transform" />
           <h2 className="text-3xl font-black text-text tracking-tight mb-2">ERIS Console</h2>
           <p className="text-text-muted font-mono mb-8 flex-1">
             The receiving hospital view. Get incoming patient alerts, view live ETA, and read Gemma's generated medical brief before arrival.
           </p>
           <Link 
             href="/dashboard?view=hospital"
             className="w-full py-4 bg-green/10 hover:bg-green/20 text-green border border-green/30 rounded-sm font-bold text-center uppercase tracking-widest transition-colors"
           >
             Launch Hospital →
           </Link>
        </div>

      </div>

      <Link 
        href="/"
        className="z-10 mt-16 flex items-center gap-2 text-text-dim hover:text-text transition-colors font-mono uppercase tracking-widest text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Exit Demo Setup
      </Link>
    </div>
  )
}

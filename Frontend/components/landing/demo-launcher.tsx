"use client"

import Link from "next/link"
import { ShieldAlert, Ambulance, Stethoscope, ArrowLeft } from "lucide-react"

export function DemoLauncher() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg p-6 font-sans">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-bg2 via-bg to-bg opacity-80" />
      <div className="absolute inset-0 z-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="z-10 mb-10 w-full max-w-6xl">
        <div className="mx-auto max-w-4xl rounded-md border border-border bg-card/70 px-8 py-8 text-center backdrop-blur-sm">
          <h1 className="mb-4 text-4xl font-black tracking-tight text-text md:text-6xl">
            Choose Your Station
          </h1>
          <p className="text-sm font-mono uppercase tracking-[0.18em] text-text-dim md:text-base">
            SmartEVP+ demo setup · assign each laptop to a live operator console
          </p>
        </div>
      </div>

      <div className="z-10 grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
        <div className="group relative flex flex-col rounded-md border border-border bg-card/90 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-cyan">
          <div className="absolute right-0 top-0 p-4">
            <span className="rounded-sm border border-cyan/30 bg-cyan/10 px-2 py-1 text-xs font-mono uppercase tracking-widest text-cyan">
              Laptop 1
            </span>
          </div>
          <ShieldAlert className="mb-5 h-12 w-12 text-cyan" />
          <h2 className="mb-2 text-2xl font-black tracking-tight text-text">Dispatch Console</h2>
          <p className="mb-8 flex-1 font-mono text-sm leading-6 text-text-dim">
            Intake, dispatch, signal preemption, and system audit.
          </p>
          <Link
            href="/admin"
            className="w-full rounded-sm border border-cyan/30 bg-cyan/10 py-4 text-center font-bold uppercase tracking-widest text-cyan transition-colors hover:bg-cyan/20"
          >
            Launch Admin
          </Link>
        </div>

        <div className="group relative flex flex-col rounded-md border border-border bg-card/90 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-amber">
          <div className="absolute right-0 top-0 p-4">
            <span className="rounded-sm border border-amber/30 bg-amber/10 px-2 py-1 text-xs font-mono uppercase tracking-widest text-amber">
              Laptop 2
            </span>
          </div>
          <Ambulance className="mb-5 h-12 w-12 text-amber" />
          <h2 className="mb-2 text-2xl font-black tracking-tight text-text">Ambulance Console</h2>
          <p className="mb-8 flex-1 font-mono text-sm leading-6 text-text-dim">
            Navigation, transport status, ETA, and paramedic voice reporting.
          </p>
          <Link
            href="/ambulance"
            className="w-full rounded-sm border border-amber/30 bg-amber/10 py-4 text-center font-bold uppercase tracking-widest text-amber transition-colors hover:bg-amber/20"
          >
            Launch Ambulance
          </Link>
        </div>

        <div className="group relative flex flex-col rounded-md border border-border bg-card/90 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-green">
          <div className="absolute right-0 top-0 p-4">
            <span className="rounded-sm border border-green/30 bg-green/10 px-2 py-1 text-xs font-mono uppercase tracking-widest text-green">
              Laptop 3
            </span>
          </div>
          <Stethoscope className="mb-5 h-12 w-12 text-green" />
          <h2 className="mb-2 text-2xl font-black tracking-tight text-text">Hospital Console</h2>
          <p className="mb-8 flex-1 font-mono text-sm leading-6 text-text-dim">
            Standby intake, incoming patient alerts, ETA, and prep brief.
          </p>
          <Link
            href="/hospital"
            className="w-full rounded-sm border border-green/30 bg-green/10 py-4 text-center font-bold uppercase tracking-widest text-green transition-colors hover:bg-green/20"
          >
            Launch Hospital
          </Link>
        </div>
      </div>

      <Link
        href="/"
        className="z-10 mt-14 flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-text-dim transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" /> Exit Demo Setup
      </Link>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Topbar, ViewType } from "@/components/dashboard/topbar"
import { AdminView } from "@/components/dashboard/views/admin-view"
import { AmbulanceView } from "@/components/dashboard/views/ambulance-view"
import { HospitalView } from "@/components/dashboard/views/hospital-view"

// Import our new hook and URL helper
import { useSocket } from "@/hooks/use-socket"
import { getBackendUrl } from "@/lib/socket"

const INTERSECTION_COORDS = { lat: 12.9300, lng: 77.6100 }

export default function DashboardPage() {
  // Use real backend state via the Socket.IO hook
  const { 
    connected, 
    gps, 
    signal, 
    latency, 
    case: activeCase, 
    brief: medicalBrief, 
    transcript, 
    auditLog, 
    distance,
    preemptionCount,
    resetDemo 
  } = useSocket()

  const [activeView, setActiveView] = useState<ViewType>("admin")

  // Demo Trigger (Calls backend API instead of running local simulated timeouts)
  const handleStartDemo = async () => {
    try {
        await fetch(`${getBackendUrl()}/demo/trigger`, { method: "POST" });
        // Start GPS replay script from backend
    } catch (e) {
        console.error("Failed to trigger demo", e);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-bg font-mono overflow-hidden">
      {/* Topbar */}
      <Topbar
        connected={connected}
        latency={latency}
        activeCase={activeCase ? { id: activeCase.id, severity: activeCase.severity } : null}
        activeView={activeView}
        onViewChange={setActiveView}
        onReset={() => {
            resetDemo();
        }}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map Panel - 60% */}
        <div className="flex-[3] relative border-r border-border">
          <MapPanel
            gpsData={gps}
            signalState={signal}
            intersectionCoords={INTERSECTION_COORDS}
          />
          {/* Developer Testing buttons (Visible in demo only) */}
          <div className="absolute left-4 bottom-4 z-[1000] flex gap-2">
            {!activeCase && (
                <button 
                  onClick={handleStartDemo}
                  className="px-4 py-2 bg-text text-bg font-bold opacity-50 hover:opacity-100 uppercase text-xs"
                >
                  🚀 Trigger Demo Case
                </button>
            )}
            {!medicalBrief && activeCase && (
                <button 
                  onClick={async () => {
                      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/demo/audio`, { method: "POST" });
                  }}
                  className="px-4 py-2 border border-text text-text font-bold opacity-50 hover:opacity-100 uppercase text-xs"
                >
                  🎙️ Run Medical Audio
                </button>
            )}
          </div>
        </div>

        {/* Signal Panel - 20% */}
        <div className="flex-1 border-r border-border">
          <SignalPanel
            state={signal}
            latency={latency}
            preemptionCount={preemptionCount}
          />
        </div>

        {/* Case Card - 20% */}
        <div className="flex-1">
          <CaseCard caseData={activeCase} />
        </div>
      </div>

      {/* Bottom Tabs */}
      <div className="border-t border-border h-72 flex-shrink-0">
        {/* Tab Bar */}
        <div className="flex border-b border-border">
          {[
            { id: "hospital", label: "Hospital Readiness" },
            { id: "audit", label: "Audit Log" },
            { id: "metrics", label: "System Metrics" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 text-sm font-mono uppercase tracking-wider transition-colors ${
                activeTab === tab.id
                  ? "text-text border-b-2 border-cyan bg-bg2"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="h-[calc(100%-49px)] overflow-hidden">
          {activeTab === "hospital" && (
            <MedicalBrief brief={medicalBrief} transcript={transcript} />
          )}
          {activeTab === "audit" && <AuditLog events={auditLog} />}
          {activeTab === "metrics" && (
             <SystemMetrics latency={latency} connected={connected} />
          )}
        </div>
      </div>
    </div>
  )
}

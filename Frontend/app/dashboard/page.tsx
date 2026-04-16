"use client"

import { useState } from "react"
import { Topbar, ViewType } from "@/components/dashboard/topbar"
import { AdminView } from "@/components/dashboard/views/admin-view"
import { AmbulanceView } from "@/components/dashboard/views/ambulance-view"
import { HospitalView } from "@/components/dashboard/views/hospital-view"

// Import our new hook
import { useSocket } from "@/hooks/use-socket"

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
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/demo/trigger`, { method: "POST" });
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {activeView === "admin" && (
           <AdminView 
             gps={gps}
             signal={signal}
             latency={latency}
             activeCase={activeCase}
             medicalBrief={medicalBrief}
             transcript={transcript}
             auditLog={auditLog}
             connected={connected}
             preemptionCount={preemptionCount}
             intersectionCoords={INTERSECTION_COORDS}
             handleStartDemo={handleStartDemo}
           />
        )}
        {activeView === "ambulance" && (
           <AmbulanceView 
             gps={gps}
             signal={signal}
             distance={distance}
             intersectionCoords={INTERSECTION_COORDS}
             connected={connected}
           />
        )}
        {activeView === "hospital" && (
           <HospitalView 
             brief={medicalBrief}
             distance={distance}
             connected={connected}
           />
        )}
      </main>
    </div>
  )
}

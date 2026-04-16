"use client"

import { useState } from "react"
import { Topbar, ViewType } from "@/components/dashboard/topbar"
import { AdminView } from "@/components/dashboard/views/admin-view"
import { AmbulanceView } from "@/components/dashboard/views/ambulance-view"
import { HospitalView } from "@/components/dashboard/views/hospital-view"

// Import our new hook and URL helper
import { useSocket } from "@/hooks/use-socket"
import { getBackendUrl } from "@/lib/socket"
import { useSearchParams, useRouter, usePathname } from "next/navigation"

import { Suspense } from "react"

const INTERSECTION_COORDS = { lat: 12.9300, lng: 77.6100 }

function DashboardContent() {
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
    caseStatus,
    etaSeconds,
    resetDemo 
  } = useSocket()

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  // Initialize from URL parameter or fallback to admin
  const defaultView = (searchParams.get("view") as ViewType) || "admin"
  const [activeView, setActiveView] = useState<ViewType>(defaultView)

  // Sync state back to URL automatically without full page reload
  const handleViewChange = (newView: ViewType) => {
    setActiveView(newView)
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", newView)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

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
        onViewChange={handleViewChange}
        onReset={() => {
            resetDemo();
        }}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
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
            caseStatus={caseStatus}
            etaSeconds={etaSeconds}
          />
        )}
        {activeView === "hospital" && (
          <HospitalView
            brief={medicalBrief}
            transcript={transcript}
            activeCase={activeCase}
            distance={distance}
            connected={connected}
            caseStatus={caseStatus}
            etaSeconds={etaSeconds}
          />
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-bg text-text font-mono">LOADING DASHBOARD...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

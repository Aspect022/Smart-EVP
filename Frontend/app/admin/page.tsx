"use client"

import { Suspense } from "react"

import { ConsoleHeader } from "@/components/console/console-header"
import { AdminView } from "@/components/dashboard/views/admin-view"
import { useSocket } from "@/hooks/use-socket"
import { getBackendUrl } from "@/lib/socket"

const INTERSECTION_COORDS = { lat: 12.93, lng: 77.61 }

function AdminConsoleContent() {
  const {
    connected,
    gps,
    signal,
    latency,
    case: activeCase,
    brief: medicalBrief,
    transcript,
    auditLog,
    preemptionCount,
  } = useSocket()

  const handleStartDemo = async () => {
    try {
      await fetch(`${getBackendUrl()}/demo/trigger`, { method: "POST" })
    } catch (error) {
      console.error("Failed to trigger demo", error)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <ConsoleHeader
        title="Admin Portal"
        consoleLabel="Admin Station"
        connected={connected}
      />
      <main className="h-[calc(100vh-97px)]">
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
      </main>
    </div>
  )
}

export default function AdminConsolePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-bg" />}>
      <AdminConsoleContent />
    </Suspense>
  )
}

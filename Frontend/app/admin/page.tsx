"use client"

import { Suspense } from "react"
import { Radio } from "lucide-react"

import { ConsoleHeader } from "@/components/console/console-header"
import { AdminView } from "@/components/dashboard/views/admin-view"
import { useSocket } from "@/hooks/use-socket"
import { getBackendUrl } from "@/lib/socket"

const INTERSECTION_COORDS = { lat: 12.9716, lng: 77.5946 }

function AdminConsoleContent() {
  const {
    connected,
    gps,
    signal,
    latency,
    case: activeCase,
    caseStatus,
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
        statusContent={
          <button
            onClick={handleStartDemo}
            className="inline-flex items-center gap-2 rounded-sm border border-red/40 bg-red/10 px-3 py-2 text-xs font-mono uppercase tracking-[0.18em] text-red transition-colors hover:border-red/60 hover:bg-red/15"
          >
            <Radio className="h-4 w-4" />
            {activeCase ? "Restart Demo Call" : "Trigger Demo Call"}
          </button>
        }
      />
      <main className="h-[calc(100vh-97px)]">
        <AdminView
          gps={gps}
          signal={signal}
          latency={latency}
          activeCase={activeCase}
          caseStatus={caseStatus}
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

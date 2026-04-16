"use client"

import { Suspense } from "react"

import { ConsoleHeader } from "@/components/console/console-header"
import { HospitalView } from "@/components/dashboard/views/hospital-view"
import { useSocket } from "@/hooks/use-socket"

function HospitalReadinessContent() {
  const {
    brief,
    transcript,
    case: activeCase,
    distance,
    connected,
    caseStatus,
    etaSeconds,
  } = useSocket()

  return (
    <div className="min-h-screen bg-bg text-text">
      <ConsoleHeader
        title="Hospital Readiness Console"
        consoleLabel="Hospital Station"
        connected={connected}
      />
      <main className="h-[calc(100vh-97px)]">
        <HospitalView
          brief={brief}
          transcript={transcript}
          activeCase={activeCase}
          distance={distance}
          connected={connected}
          caseStatus={caseStatus}
          etaSeconds={etaSeconds}
        />
      </main>
    </div>
  )
}

export default function HospitalReadinessPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-bg" />}>
      <HospitalReadinessContent />
    </Suspense>
  )
}

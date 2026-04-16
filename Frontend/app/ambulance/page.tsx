"use client"

import { Suspense } from "react"

import { ConsoleHeader } from "@/components/console/console-header"
import { AmbulanceView } from "@/components/dashboard/views/ambulance-view"
import { useSocket } from "@/hooks/use-socket"

const INTERSECTION_COORDS = { lat: 12.93, lng: 77.61 }

function AmbulanceConsoleContent() {
  const {
    connected,
    gps,
    signal,
    distance,
    caseStatus,
    etaSeconds,
  } = useSocket()

  return (
    <div className="min-h-screen bg-bg text-text">
      <ConsoleHeader
        title="Ambulance Console"
        subtitle="Navigation, transport state, ETA, and paramedic voice reporting are handled here. This station becomes active after dispatch and remains focused on transport and handoff."
        consoleLabel="Ambulance Unit"
        connected={connected}
      />
      <main className="h-[calc(100vh-97px)]">
        <AmbulanceView
          gps={gps}
          signal={signal}
          distance={distance}
          intersectionCoords={INTERSECTION_COORDS}
          connected={connected}
          caseStatus={caseStatus}
          etaSeconds={etaSeconds}
        />
      </main>
    </div>
  )
}

export default function AmbulanceConsolePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-bg" />}>
      <AmbulanceConsoleContent />
    </Suspense>
  )
}

"use client"

import { Suspense } from "react"

import { ConsoleHeader } from "@/components/console/console-header"
import { AmbulanceView } from "@/components/dashboard/views/ambulance-view"
import { useSocket } from "@/hooks/use-socket"

const INTERSECTION_COORDS = { lat: 12.9716, lng: 77.5946 }

function AmbulanceConsoleContent() {
  const {
    connected,
    gps,
    signal,
    distance,
    case: activeCase,
    caseStatus,
    etaSeconds,
    transcript,
    brief,
    selectedHospital,
    hospitalRecommendation,
    rlDecision,
    selectHospital,
  } = useSocket()

  return (
    <div className="min-h-screen bg-bg text-text">
      <ConsoleHeader
        title="Ambulance Console"
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
          activeCase={activeCase}
          transcript={transcript}
          brief={brief}
          selectedHospital={selectedHospital}
          hospitalRecommendation={hospitalRecommendation}
          rlDecision={rlDecision}
          onSelectHospital={selectHospital}
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

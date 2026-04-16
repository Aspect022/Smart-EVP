"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Activity, LocateFixed, MapPinned } from "lucide-react"

interface GPSData {
  lat: number
  lng: number
  speed: number
  timestamp: number
}

export interface TrackedAmbulance {
  id: string
  label: string
  lat: number
  lng: number
  speed: number
  status: string
  isLive?: boolean
}

interface MapPanelProps {
  gpsData: GPSData | null
  signalState: "RED" | "AMBER" | "GREEN"
  intersectionCoords: { lat: number; lng: number }
  ambulances?: TrackedAmbulance[]
  selectedAmbulanceId?: string
  activeCase?: any
  caseStatus?: string
}

const DEFAULT_INTERSECTION = { lat: 12.9716, lng: 77.5946 }
const PREEMPTION_RADIUS = 500

function getSignalColor(signalState: "RED" | "AMBER" | "GREEN") {
  if (signalState === "GREEN") return "#4ade80"
  if (signalState === "AMBER") return "#f59e0b"
  return "#22d3ee"
}

function resolveAmbulances(gpsData: GPSData | null, ambulances?: TrackedAmbulance[]) {
  if (ambulances && ambulances.length > 0) return ambulances
  if (!gpsData) return []

  return [{
    id: "AMB-001",
    label: "Ambulance 01",
    lat: gpsData.lat,
    lng: gpsData.lng,
    speed: gpsData.speed,
    status: "Live route feed",
    isLive: true,
  }]
}

function createSignalPoints(
  start: { lat: number; lng: number } | null,
  end: { lat: number; lng: number },
  progress: number,
) {
  if (!start) return []

  return [0.2, 0.5, 0.8].map((fraction) => {
    let state: "RED" | "AMBER" | "GREEN" = "RED"
    if (progress >= fraction + 0.12) state = "GREEN"
    else if (progress >= fraction - 0.08) state = "AMBER"

    return {
      lat: start.lat + (end.lat - start.lat) * fraction,
      lng: start.lng + (end.lng - start.lng) * fraction,
      state,
    }
  })
}

function getDestination(activeCase: any, fallback: { lat: number; lng: number }, caseStatus?: string) {
  const patientCoords = activeCase?.patientCoords
  const hospitalCoords = activeCase?.hospitalCoords
  const headingToHospital =
    caseStatus === "PATIENT_PICKED" ||
    caseStatus === "EN_ROUTE_HOSPITAL" ||
    caseStatus === "ARRIVING"

  if (headingToHospital && hospitalCoords?.lat && hospitalCoords?.lng) {
    return {
      coords: { lat: Number(hospitalCoords.lat), lng: Number(hospitalCoords.lng) },
      label: "Hospital",
      icon: "🏥",
      showSignals: true,
    }
  }

  if (patientCoords?.lat && patientCoords?.lng) {
    return {
      coords: { lat: Number(patientCoords.lat), lng: Number(patientCoords.lng) },
      label: "Patient",
      icon: "📍",
      showSignals: false,
    }
  }

  return {
    coords: fallback,
    label: "Destination",
    icon: "🏥",
    showSignals: true,
  }
}

function getDistanceMeters(a: { lat: number; lng: number } | null, b: { lat: number; lng: number }) {
  if (!a) return null
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)))
}

export function MapPanel({
  gpsData,
  signalState,
  intersectionCoords = DEFAULT_INTERSECTION,
  ambulances,
  selectedAmbulanceId,
  activeCase,
  caseStatus,
}: MapPanelProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const routeTrailRef = useRef<any>(null)
  const routeGuideRef = useRef<any>(null)
  const preemptionCircleRef = useRef<any>(null)
  const intersectionMarkerRef = useRef<any>(null)
  const ambulanceMarkersRef = useRef<Map<string, any>>(new Map())
  const signalMarkersRef = useRef<any[]>([])
  const lastViewKeyRef = useRef<string>("")
  const [routePoints, setRoutePoints] = useState<[number, number][]>([])

  const trackedAmbulances = useMemo(
    () => resolveAmbulances(gpsData, ambulances),
    [gpsData, ambulances],
  )
  const selectedAmbulance = trackedAmbulances.find((item) => item.id === selectedAmbulanceId) ?? trackedAmbulances[0] ?? null
  const selectedCoords = selectedAmbulance ? { lat: selectedAmbulance.lat, lng: selectedAmbulance.lng } : null
  const patientCoords =
    activeCase?.patientCoords?.lat && activeCase?.patientCoords?.lng
      ? { lat: Number(activeCase.patientCoords.lat), lng: Number(activeCase.patientCoords.lng) }
      : null
  const hospitalCoords =
    activeCase?.hospitalCoords?.lat && activeCase?.hospitalCoords?.lng
      ? { lat: Number(activeCase.hospitalCoords.lat), lng: Number(activeCase.hospitalCoords.lng) }
      : null
  const destination = useMemo(
    () => getDestination(activeCase, intersectionCoords, caseStatus),
    [activeCase, intersectionCoords, caseStatus],
  )
  const hospitalLegProgress = useMemo(() => {
    if (!patientCoords || !hospitalCoords || !selectedCoords || !destination.showSignals) return 0

    const totalDistance = getDistanceMeters(patientCoords, hospitalCoords)
    const remainingDistance = getDistanceMeters(selectedCoords, hospitalCoords)
    if (!totalDistance || remainingDistance === null) return 0

    return Math.min(Math.max((totalDistance - remainingDistance) / totalDistance, 0), 1)
  }, [destination.showSignals, hospitalCoords, patientCoords, selectedCoords])
  const signalPoints = useMemo(
    () => (destination.showSignals ? createSignalPoints(patientCoords, destination.coords, hospitalLegProgress) : []),
    [destination, hospitalLegProgress, patientCoords],
  )
  const distanceToTarget = useMemo(
    () => getDistanceMeters(selectedCoords, destination.coords),
    [selectedCoords, destination],
  )

  useEffect(() => {
    if (!gpsData) return

    setRoutePoints((prev) => {
      const nextPoint: [number, number] = [gpsData.lat, gpsData.lng]
      const lastPoint = prev.at(-1)
      if (lastPoint && lastPoint[0] === nextPoint[0] && lastPoint[1] === nextPoint[1]) {
        return prev
      }
      return [...prev, nextPoint]
    })
  }, [gpsData])

  useEffect(() => {
    if (!activeCase) {
      setRoutePoints([])
    }
  }, [activeCase?.id])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    let cancelled = false

    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default
      if (cancelled || !mapRef.current) return

      leafletRef.current = L

      const map = L.map(mapRef.current, {
        center: [destination.coords.lat, destination.coords.lng],
        zoom: 14,
        zoomControl: false,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
      })

      L.control.zoom({ position: "topleft" }).addTo(map)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      preemptionCircleRef.current = L.circle([destination.coords.lat, destination.coords.lng], {
        color: getSignalColor(signalState),
        fillColor: getSignalColor(signalState),
        fillOpacity: signalState === "GREEN" ? 0.08 : 0.04,
        radius: PREEMPTION_RADIUS,
        weight: 2,
      }).addTo(map)

      const destinationIcon = L.divIcon({
        html: `
          <div style="
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: #2563eb;
            border: 2px solid rgba(255,255,255,0.9);
            box-shadow: 0 10px 24px rgba(15,23,42,0.28);
            font-size: 20px;
          ">${destination.icon}</div>
        `,
        className: "smartevp-map-icon",
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      })

      intersectionMarkerRef.current = L.marker([destination.coords.lat, destination.coords.lng], {
        icon: destinationIcon,
      }).addTo(map)

      routeTrailRef.current = L.polyline([], {
        color: "#2563eb",
        weight: 5,
        opacity: 0.82,
      }).addTo(map)

      routeGuideRef.current = L.polyline([], {
        color: "#1d4ed8",
        weight: 3,
        opacity: 0.45,
        dashArray: "8 8",
      }).addTo(map)

      mapInstanceRef.current = map
      window.setTimeout(() => {
        if (!cancelled && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize(false)
        }
      }, 0)
    }

    loadLeaflet()

    return () => {
      cancelled = true
      signalMarkersRef.current.forEach((marker) => marker.remove())
      signalMarkersRef.current = []
      ambulanceMarkersRef.current.forEach((marker) => marker.remove())
      ambulanceMarkersRef.current.clear()
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const L = leafletRef.current
    const map = mapInstanceRef.current
    if (!L || !map || !preemptionCircleRef.current || !intersectionMarkerRef.current) return

    const signalColor = getSignalColor(signalState)

    preemptionCircleRef.current.setLatLng([destination.coords.lat, destination.coords.lng])
    preemptionCircleRef.current.setStyle({
      color: signalColor,
      fillColor: signalColor,
      fillOpacity: destination.showSignals ? (signalState === "GREEN" ? 0.1 : 0.05) : 0.02,
    })

    const destinationIcon = L.divIcon({
      html: `
        <div style="
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #2563eb;
          border: 2px solid rgba(255,255,255,0.9);
          box-shadow: 0 10px 24px rgba(15,23,42,0.28);
          font-size: 20px;
        ">${destination.icon}</div>
      `,
      className: "smartevp-map-icon",
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    })

    intersectionMarkerRef.current.setLatLng([destination.coords.lat, destination.coords.lng])
    intersectionMarkerRef.current.setIcon(destinationIcon)

    signalMarkersRef.current.forEach((marker) => marker.remove())
    signalMarkersRef.current = signalPoints.map((signalPoint) => {
      const color = getSignalColor(signalPoint.state)
      const signalIcon = L.divIcon({
        html: `
          <div style="
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: rgba(255,255,255,0.94);
            border: 3px solid ${color};
            box-shadow: 0 4px 10px rgba(15,23,42,0.22);
            color: ${color};
            font-size: 16px;
          ">♥</div>
        `,
        className: "smartevp-map-icon",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })
      return L.marker([signalPoint.lat, signalPoint.lng], { icon: signalIcon }).addTo(map)
    })

    if (routeGuideRef.current) {
      routeGuideRef.current.setLatLngs(
        selectedCoords
          ? [
              [selectedCoords.lat, selectedCoords.lng],
              [destination.coords.lat, destination.coords.lng],
            ]
          : [],
      )
    }

    if (routeTrailRef.current) {
      routeTrailRef.current.setLatLngs(
        routePoints.map(([lat, lng]) => [lat, lng]),
      )
    }
  }, [destination, selectedCoords, signalPoints, signalState, routePoints])

  useEffect(() => {
    const L = leafletRef.current
    const map = mapInstanceRef.current
    if (!L || !map) return

    const nextIds = new Set(trackedAmbulances.map((ambulance) => ambulance.id))

    ambulanceMarkersRef.current.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.remove()
        ambulanceMarkersRef.current.delete(id)
      }
    })

    trackedAmbulances.forEach((ambulance) => {
      const selected = ambulance.id === selectedAmbulanceId
      const bg = selected ? "#ff5a36" : ambulance.isLive ? "#dc2626" : "#7c3aed"
      const markerIcon = L.divIcon({
        html: `
          <div style="
            width: ${selected ? 46 : 38}px;
            height: ${selected ? 46 : 38}px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: ${bg};
            border: 2px solid rgba(255,255,255,0.92);
            box-shadow: 0 10px 24px rgba(15,23,42,0.30);
            font-size: ${selected ? 24 : 20}px;
            line-height: 1;
          ">🚑</div>
        `,
        className: "smartevp-map-icon",
        iconSize: [selected ? 46 : 38, selected ? 46 : 38],
        iconAnchor: [selected ? 23 : 19, selected ? 23 : 19],
      })

      const existing = ambulanceMarkersRef.current.get(ambulance.id)
      if (existing) {
        existing.setLatLng([ambulance.lat, ambulance.lng])
        existing.setIcon(markerIcon)
      } else {
        const marker = L.marker([ambulance.lat, ambulance.lng], { icon: markerIcon }).addTo(map)
        ambulanceMarkersRef.current.set(ambulance.id, marker)
      }
    })
  }, [selectedAmbulanceId, trackedAmbulances])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !selectedCoords) return

    const viewKey = [
      activeCase?.id ?? "idle",
      selectedAmbulanceId ?? "default",
      destination.label,
      caseStatus ?? "CALL_RECEIVED",
    ].join(":")

    if (lastViewKeyRef.current === viewKey) return
    lastViewKeyRef.current = viewKey

    const bounds = [
      [selectedCoords.lat, selectedCoords.lng],
      [destination.coords.lat, destination.coords.lng],
    ]

    map.fitBounds(bounds, {
      padding: [48, 48],
      animate: false,
    })
  }, [activeCase?.id, caseStatus, destination.coords.lat, destination.coords.lng, destination.label, selectedAmbulanceId])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-sm border border-border bg-[#dbeafe]">
      <div ref={mapRef} className="h-full w-full" />

      {selectedAmbulance && (
        <div className="absolute left-4 top-4 z-[1000] w-[280px] rounded-xl border border-white/70 bg-white/92 p-4 text-slate-900 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Tracked Ambulance
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg">🚑</span>
                <div>
                  <div className="text-base font-semibold">{selectedAmbulance.id}</div>
                  <div className="text-xs text-slate-500">{selectedAmbulance.label}</div>
                </div>
              </div>
            </div>
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
              selectedAmbulance.isLive
                ? "bg-red-100 text-red-700"
                : "bg-violet-100 text-violet-700"
            }`}>
              {selectedAmbulance.isLive ? "Live" : "Simulated"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-slate-100 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Status</div>
              <div className="mt-1 font-medium">{selectedAmbulance.status}</div>
            </div>
            <div className="rounded-lg bg-slate-100 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Speed</div>
              <div className="mt-1 font-medium">{Math.round(selectedAmbulance.speed)} km/h</div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute right-4 top-4 z-[1000] w-[220px] rounded-xl border border-white/70 bg-white/92 p-4 text-slate-900 shadow-xl backdrop-blur">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Route State
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <Activity className="h-4 w-4 text-emerald-600" />
              Corridor
            </span>
            <span className="font-semibold" style={{ color: destination.showSignals ? getSignalColor(signalState) : "#334155" }}>
              {destination.showSignals ? signalState : "ARMED"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <LocateFixed className="h-4 w-4 text-blue-600" />
              Distance
            </span>
            <span className="font-semibold">{distanceToTarget !== null ? `${distanceToTarget} m` : "--"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-slate-600">
              <MapPinned className="h-4 w-4 text-red-600" />
              Destination
            </span>
            <span className="font-semibold">{destination.label}</span>
          </div>
          {destination.showSignals && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-600">Signal progress</span>
              <span className="font-semibold">{Math.round(hospitalLegProgress * 100)}%</span>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

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
  signalState: "RED" | "AMBER" | "GREEN",
) {
  if (!start) return []

  const statuses: Array<"RED" | "AMBER" | "GREEN"> =
    signalState === "GREEN"
      ? ["GREEN", "GREEN", "GREEN"]
      : signalState === "AMBER"
        ? ["AMBER", "AMBER", "GREEN"]
        : ["RED", "AMBER", "GREEN"]

  return [0.25, 0.5, 0.75].map((fraction, index) => ({
    lat: start.lat + (end.lat - start.lat) * fraction,
    lng: start.lng + (end.lng - start.lng) * fraction,
    state: statuses[index],
  }))
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
}: MapPanelProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const routeLineRef = useRef<any>(null)
  const preemptionCircleRef = useRef<any>(null)
  const intersectionMarkerRef = useRef<any>(null)
  const ambulanceMarkersRef = useRef<Map<string, any>>(new Map())
  const signalMarkersRef = useRef<any[]>([])

  const trackedAmbulances = useMemo(
    () => resolveAmbulances(gpsData, ambulances),
    [gpsData, ambulances],
  )
  const selectedAmbulance = trackedAmbulances.find((item) => item.id === selectedAmbulanceId) ?? trackedAmbulances[0] ?? null
  const selectedCoords = selectedAmbulance ? { lat: selectedAmbulance.lat, lng: selectedAmbulance.lng } : null
  const signalPoints = useMemo(
    () => createSignalPoints(selectedCoords, intersectionCoords, signalState),
    [selectedCoords, intersectionCoords, signalState],
  )
  const distanceToTarget = useMemo(
    () => getDistanceMeters(selectedCoords, intersectionCoords),
    [selectedCoords, intersectionCoords],
  )

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    let cancelled = false

    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default
      if (cancelled || !mapRef.current) return

      leafletRef.current = L

      const map = L.map(mapRef.current, {
        center: [intersectionCoords.lat, intersectionCoords.lng],
        zoom: 14,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map)

      preemptionCircleRef.current = L.circle([intersectionCoords.lat, intersectionCoords.lng], {
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
          ">🏥</div>
        `,
        className: "smartevp-map-icon",
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      })

      intersectionMarkerRef.current = L.marker([intersectionCoords.lat, intersectionCoords.lng], {
        icon: destinationIcon,
      }).addTo(map)

      routeLineRef.current = L.polyline([], {
        color: "#2563eb",
        weight: 4,
        opacity: 0.78,
      }).addTo(map)

      mapInstanceRef.current = map
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
  }, [intersectionCoords, signalState])

  useEffect(() => {
    const L = leafletRef.current
    const map = mapInstanceRef.current
    if (!L || !map || !preemptionCircleRef.current || !intersectionMarkerRef.current) return

    const signalColor = getSignalColor(signalState)

    preemptionCircleRef.current.setLatLng([intersectionCoords.lat, intersectionCoords.lng])
    preemptionCircleRef.current.setStyle({
      color: signalColor,
      fillColor: signalColor,
      fillOpacity: signalState === "GREEN" ? 0.08 : 0.04,
    })

    intersectionMarkerRef.current.setLatLng([intersectionCoords.lat, intersectionCoords.lng])

    signalMarkersRef.current.forEach((marker) => marker.remove())
    signalMarkersRef.current = signalPoints.map((signalPoint) => {
      const color = getSignalColor(signalPoint.state)
      const signalIcon = L.divIcon({
        html: `
          <div style="
            width: 14px;
            height: 14px;
            border-radius: 999px;
            background: ${color};
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(15,23,42,0.22);
          "></div>
        `,
        className: "smartevp-map-icon",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      return L.marker([signalPoint.lat, signalPoint.lng], { icon: signalIcon }).addTo(map)
    })

    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs(
        selectedCoords
          ? [
              [selectedCoords.lat, selectedCoords.lng],
              [intersectionCoords.lat, intersectionCoords.lng],
            ]
          : [],
      )
    }
  }, [intersectionCoords, selectedCoords, signalPoints, signalState])

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

    const bounds = [
      [selectedCoords.lat, selectedCoords.lng],
      [intersectionCoords.lat, intersectionCoords.lng],
    ]

    map.fitBounds(bounds, { padding: [48, 48] })
  }, [intersectionCoords, selectedCoords])

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
            <span className="font-semibold" style={{ color: getSignalColor(signalState) }}>
              {signalState}
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
            <span className="font-semibold">Hospital Gate</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-white/70 bg-white/92 px-4 py-3 text-xs text-slate-600 shadow-lg backdrop-blur">
        Blue route to destination. Colored dots show signal progression. Click a unit in the fleet to follow it.
      </div>
    </div>
  )
}

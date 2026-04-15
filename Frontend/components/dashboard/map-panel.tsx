"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

// Leaflet requires client-side only rendering
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
)
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
)

interface GPSData {
  lat: number
  lng: number
  speed: number
  timestamp: number
}

interface MapPanelProps {
  gpsData: GPSData | null
  signalState: "RED" | "AMBER" | "GREEN"
  intersectionCoords: { lat: number; lng: number }
}

// Intersection coordinates (from design guide - Bengaluru)
const DEFAULT_INTERSECTION = { lat: 12.93, lng: 77.61 }
const PREEMPTION_RADIUS = 500 // meters

export function MapPanel({ gpsData, signalState, intersectionCoords = DEFAULT_INTERSECTION }: MapPanelProps) {
  const [routePoints, setRoutePoints] = useState<[number, number][]>([])
  const [isClient, setIsClient] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  // Only render on client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Track route points
  useEffect(() => {
    if (gpsData) {
      setRoutePoints((prev) => [...prev, [gpsData.lat, gpsData.lng]])
    }
  }, [gpsData])

  // Calculate distance to intersection
  const getDistanceToIntersection = () => {
    if (!gpsData) return null
    const R = 6371000 // Earth's radius in meters
    const dLat = ((intersectionCoords.lat - gpsData.lat) * Math.PI) / 180
    const dLng = ((intersectionCoords.lng - gpsData.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((gpsData.lat * Math.PI) / 180) *
        Math.cos((intersectionCoords.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c)
  }

  const distance = getDistanceToIntersection()
  const isInPreemptionZone = distance !== null && distance <= PREEMPTION_RADIUS

  if (!isClient) {
    return (
      <div className="h-full w-full bg-bg2 flex items-center justify-center">
        <div className="text-text-muted font-mono text-sm">Loading map...</div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {/* Map */}
      <MapContainer
        center={[intersectionCoords.lat, intersectionCoords.lng]}
        zoom={15}
        className="h-full w-full"
        style={{ background: "#080b12" }}
        ref={(map) => {
          if (map) mapRef.current = map
        }}
      >
        {/* Dark tile layer - CartoDB Dark Matter */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Preemption radius circle */}
        <Circle
          center={[intersectionCoords.lat, intersectionCoords.lng]}
          radius={PREEMPTION_RADIUS}
          pathOptions={{
            color: signalState === "GREEN" ? "#4ade80" : "#22d3ee",
            fillColor: signalState === "GREEN" ? "#4ade80" : "#22d3ee",
            fillOpacity: signalState === "GREEN" ? 0.08 : 0.04,
            weight: 1,
          }}
        />

        {/* Route polyline */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: "#ff3b3b",
              weight: 2,
              opacity: 0.5,
              dashArray: "4 6",
            }}
          />
        )}

        {/* Ambulance marker - only show when we have GPS data */}
        {gpsData && (
          <AmbulanceMarker position={[gpsData.lat, gpsData.lng]} />
        )}

        {/* Intersection marker */}
        <IntersectionMarker 
          position={[intersectionCoords.lat, intersectionCoords.lng]} 
          signalState={signalState}
        />
      </MapContainer>

      {/* Overlay Stats */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        {/* GPS Status */}
        <div className="px-4 py-3 bg-card/90 backdrop-blur-sm border border-border rounded-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${gpsData ? "bg-green animate-pulse" : "bg-text-muted"}`} />
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
              {gpsData ? "GPS ACTIVE" : "NO GPS"}
            </span>
          </div>
          {gpsData && (
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between gap-4">
                <span className="text-text-muted">Pos</span>
                <span className="text-text">{gpsData.lat.toFixed(4)}, {gpsData.lng.toFixed(4)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-text-muted">Speed</span>
                <span className="text-cyan">{gpsData.speed} km/h</span>
              </div>
            </div>
          )}
        </div>

        {/* Distance to Intersection */}
        {distance !== null && (
          <div className="px-4 py-3 bg-card/90 backdrop-blur-sm border border-border rounded-sm">
            <div className="text-xs font-mono text-text-muted uppercase tracking-wider mb-1">
              Distance to INT-01
            </div>
            <div 
              className="font-sans font-bold text-2xl"
              style={{ color: isInPreemptionZone ? "var(--green)" : "var(--text)" }}
            >
              {distance}m
            </div>
            {isInPreemptionZone && (
              <div className="text-xs font-mono text-green mt-1">IN PREEMPTION ZONE</div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] px-4 py-3 bg-card/90 backdrop-blur-sm border border-border rounded-sm">
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red" style={{ boxShadow: "0 0 8px rgba(255,59,59,0.5)" }} />
            <span className="text-text-muted">Ambulance</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-cyan" />
            <span className="text-text-muted">Intersection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-[2px] bg-red opacity-50" style={{ borderStyle: "dashed" }} />
            <span className="text-text-muted">Route</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Custom ambulance marker component
function AmbulanceMarker({ position }: { position: [number, number] }) {
  const [L, setL] = useState<typeof import("leaflet") | null>(null)

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default)
    })
  }, [])

  if (!L) return null

  const ambulanceIcon = L.divIcon({
    className: "",
    html: `<div style="
      width: 16px; 
      height: 16px; 
      border-radius: 50%;
      background: #ff3b3b;
      box-shadow: 0 0 0 4px rgba(255,59,59,0.3), 0 0 20px rgba(255,59,59,0.5);
      border: 2px solid #fff;
      animation: pulse-ambulance 1.5s ease-in-out infinite;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })

  return <Marker position={position} icon={ambulanceIcon} />
}

// Custom intersection marker component
function IntersectionMarker({ position, signalState }: { position: [number, number]; signalState: string }) {
  const [L, setL] = useState<typeof import("leaflet") | null>(null)

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default)
    })
  }, [])

  if (!L) return null

  const color = signalState === "GREEN" ? "#4ade80" : signalState === "AMBER" ? "#f59e0b" : "#22d3ee"

  const intersectionIcon = L.divIcon({
    className: "",
    html: `<div style="
      width: 24px; 
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <line x1="12" y1="2" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
      </svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })

  return <Marker position={position} icon={intersectionIcon} />
}

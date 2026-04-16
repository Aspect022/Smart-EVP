"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
)
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false },
)
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false },
)

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

declare global {
  interface Window {
    google?: any
  }
}

const DEFAULT_INTERSECTION = { lat: 12.7186, lng: 77.4944 }
const PREEMPTION_RADIUS = 500
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
const AMBULANCE_EMOJI = "\uD83D\uDE91"

let googleMapsPromise: Promise<void> | null = null

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.google?.maps) return Promise.resolve()
  if (googleMapsPromise) return googleMapsPromise

  googleMapsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]')
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`
    script.async = true
    script.defer = true
    script.dataset.googleMaps = "true"
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Google Maps failed to load"))
    document.head.appendChild(script)
  })

  return googleMapsPromise
}

function getSignalColor(signalState: "RED" | "AMBER" | "GREEN") {
  if (signalState === "GREEN") return "#4ade80"
  if (signalState === "AMBER") return "#f59e0b"
  return "#22d3ee"
}

function getAmbulanceSvg(selected = false, isLive = false) {
  const fill = selected ? "#ff5a36" : isLive ? "#ff3b3b" : "#d946ef"
  const ring = selected ? "#ffe7c2" : "#ffffff"

  return encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000814" flood-opacity="0.45"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <circle cx="28" cy="28" r="22" fill="${fill}"/>
        <circle cx="28" cy="28" r="20" fill="${fill}" stroke="${ring}" stroke-width="2"/>
        <text x="28" y="36" text-anchor="middle" font-size="24">${AMBULANCE_EMOJI}</text>
      </g>
    </svg>
  `)
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
    status: "Live",
    isLive: true,
  }]
}

export function MapPanel({
  gpsData,
  signalState,
  intersectionCoords = DEFAULT_INTERSECTION,
  ambulances,
  selectedAmbulanceId,
}: MapPanelProps) {
  const [routePoints, setRoutePoints] = useState<[number, number][]>([])
  const [isClient, setIsClient] = useState(false)
  const [googleStatus, setGoogleStatus] = useState<"idle" | "ready" | "error">(
    GOOGLE_MAPS_KEY ? "idle" : "error",
  )
  const trackedAmbulances = resolveAmbulances(gpsData, ambulances)

  useEffect(() => {
    setIsClient(true)
  }, [])

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
    if (!isClient || !GOOGLE_MAPS_KEY) return

    let cancelled = false
    loadGoogleMaps(GOOGLE_MAPS_KEY)
      .then(() => {
        if (!cancelled) setGoogleStatus("ready")
      })
      .catch((error) => {
        console.error("Google Maps loader failed", error)
        if (!cancelled) setGoogleStatus("error")
      })

    return () => {
      cancelled = true
    }
  }, [isClient])

  if (!isClient) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg2">
        <div className="font-mono text-sm text-text-muted">Loading map...</div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {googleStatus === "ready" ? (
        <GoogleMapCanvas
          routePoints={routePoints}
          signalState={signalState}
          intersectionCoords={intersectionCoords}
          ambulances={trackedAmbulances}
          selectedAmbulanceId={selectedAmbulanceId}
        />
      ) : (
        <LeafletMapCanvas
          routePoints={routePoints}
          signalState={signalState}
          intersectionCoords={intersectionCoords}
          ambulances={trackedAmbulances}
          selectedAmbulanceId={selectedAmbulanceId}
        />
      )}
    </div>
  )
}

function GoogleMapCanvas({
  routePoints,
  signalState,
  intersectionCoords,
  ambulances,
  selectedAmbulanceId,
}: {
  routePoints: [number, number][]
  signalState: "RED" | "AMBER" | "GREEN"
  intersectionCoords: { lat: number; lng: number }
  ambulances: TrackedAmbulance[]
  selectedAmbulanceId?: string
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const intersectionMarkerRef = useRef<any>(null)
  const polylineRef = useRef<any>(null)
  const ambulanceMarkersRef = useRef<Map<string, any>>(new Map())
  const selectedAmbulance = ambulances.find((item) => item.id === selectedAmbulanceId) ?? ambulances[0] ?? null

  useEffect(() => {
    if (!mapElementRef.current || !window.google?.maps || mapRef.current) return

    const google = window.google
    const signalColor = getSignalColor(signalState)

    mapRef.current = new google.maps.Map(mapElementRef.current, {
      center: selectedAmbulance
        ? { lat: selectedAmbulance.lat, lng: selectedAmbulance.lng }
        : intersectionCoords,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: "greedy",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0b1020" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#9ba4b5" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0b1020" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#172033" }] },
        { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#1b2940" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#08101d" }] },
      ],
    })

    circleRef.current = new google.maps.Circle({
      map: mapRef.current,
      center: intersectionCoords,
      radius: PREEMPTION_RADIUS,
      strokeColor: signalColor,
      strokeOpacity: 0.85,
      strokeWeight: 2,
      fillColor: signalColor,
      fillOpacity: signalState === "GREEN" ? 0.08 : 0.03,
    })

    intersectionMarkerRef.current = new google.maps.Marker({
      map: mapRef.current,
      position: intersectionCoords,
      title: "Intersection",
      label: {
        text: "+",
        color: "#f8fafc",
        fontWeight: "700",
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: signalColor,
        fillOpacity: 0.95,
        strokeColor: "#f8fafc",
        strokeWeight: 2,
      },
    })

    polylineRef.current = new google.maps.Polyline({
      map: mapRef.current,
      geodesic: true,
      strokeColor: "#ff3b3b",
      strokeOpacity: 0.72,
      strokeWeight: 3,
    })
  }, [intersectionCoords, selectedAmbulance, signalState])

  useEffect(() => {
    if (!window.google?.maps || !mapRef.current || !circleRef.current || !intersectionMarkerRef.current) return

    const google = window.google
    const signalColor = getSignalColor(signalState)

    circleRef.current.setOptions({
      center: intersectionCoords,
      strokeColor: signalColor,
      fillColor: signalColor,
      fillOpacity: signalState === "GREEN" ? 0.08 : 0.03,
    })

    intersectionMarkerRef.current.setPosition(intersectionCoords)
    intersectionMarkerRef.current.setIcon({
      path: google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: signalColor,
      fillOpacity: 0.95,
      strokeColor: "#f8fafc",
      strokeWeight: 2,
    })
  }, [intersectionCoords, signalState])

  useEffect(() => {
    if (!window.google?.maps || !polylineRef.current) return

    polylineRef.current.setPath(routePoints.map(([lat, lng]) => ({ lat, lng })))
  }, [routePoints])

  useEffect(() => {
    if (!window.google?.maps || !mapRef.current) return

    const google = window.google
    const nextIds = new Set(ambulances.map((ambulance) => ambulance.id))

    ambulanceMarkersRef.current.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.setMap(null)
        ambulanceMarkersRef.current.delete(id)
      }
    })

    ambulances.forEach((ambulance) => {
      const isSelected = ambulance.id === selectedAmbulanceId
      const icon = {
        url: `data:image/svg+xml;charset=UTF-8,${getAmbulanceSvg(isSelected, ambulance.isLive)}`,
        scaledSize: new google.maps.Size(isSelected ? 48 : 40, isSelected ? 48 : 40),
        anchor: new google.maps.Point(isSelected ? 24 : 20, isSelected ? 24 : 20),
      }
      const position = { lat: ambulance.lat, lng: ambulance.lng }
      const existing = ambulanceMarkersRef.current.get(ambulance.id)

      if (existing) {
        existing.setPosition(position)
        existing.setTitle(`${ambulance.id} • ${ambulance.status}`)
        existing.setIcon(icon)
        existing.setZIndex(isSelected ? 1000 : ambulance.isLive ? 900 : 700)
      } else {
        const marker = new google.maps.Marker({
          map: mapRef.current,
          position,
          title: `${ambulance.id} • ${ambulance.status}`,
          zIndex: isSelected ? 1000 : ambulance.isLive ? 900 : 700,
          icon,
        })
        ambulanceMarkersRef.current.set(ambulance.id, marker)
      }
    })
  }, [ambulances, selectedAmbulanceId])

  useEffect(() => {
    if (!mapRef.current || !selectedAmbulance) return
    mapRef.current.panTo({ lat: selectedAmbulance.lat, lng: selectedAmbulance.lng })
  }, [selectedAmbulance])

  return <div ref={mapElementRef} className="h-full w-full bg-[#080b12]" />
}

function LeafletMapCanvas({
  routePoints,
  signalState,
  intersectionCoords,
  ambulances,
  selectedAmbulanceId,
}: {
  routePoints: [number, number][]
  signalState: "RED" | "AMBER" | "GREEN"
  intersectionCoords: { lat: number; lng: number }
  ambulances: TrackedAmbulance[]
  selectedAmbulanceId?: string
}) {
  const mapRef = useRef<L.Map | null>(null)
  const selectedAmbulance = ambulances.find((item) => item.id === selectedAmbulanceId) ?? ambulances[0] ?? null

  useEffect(() => {
    if (!mapRef.current || !selectedAmbulance) return
    mapRef.current.panTo([selectedAmbulance.lat, selectedAmbulance.lng], { animate: true, duration: 0.75 })
  }, [selectedAmbulance])

  return (
    <MapContainer
      center={[intersectionCoords.lat, intersectionCoords.lng]}
      zoom={15}
      className="h-full w-full"
      style={{ background: "#080b12" }}
      ref={(map) => {
        if (map) mapRef.current = map
      }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      <Circle
        center={[intersectionCoords.lat, intersectionCoords.lng]}
        radius={PREEMPTION_RADIUS}
        pathOptions={{
          color: getSignalColor(signalState),
          fillColor: getSignalColor(signalState),
          fillOpacity: signalState === "GREEN" ? 0.08 : 0.03,
          weight: 2,
        }}
      />

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

      {ambulances.map((ambulance) => (
        <AmbulanceMarker
          key={ambulance.id}
          position={[ambulance.lat, ambulance.lng]}
          selected={ambulance.id === selectedAmbulanceId}
          live={ambulance.isLive}
        />
      ))}

      <IntersectionMarker
        position={[intersectionCoords.lat, intersectionCoords.lng]}
        signalState={signalState}
      />
    </MapContainer>
  )
}

function AmbulanceMarker({
  position,
  selected = false,
  live = false,
}: {
  position: [number, number]
  selected?: boolean
  live?: boolean
}) {
  const [L, setL] = useState<typeof import("leaflet") | null>(null)

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default)
    })
  }, [])

  if (!L) return null

  const bg = selected ? "#ff5a36" : live ? "#ff3b3b" : "#d946ef"
  const size = selected ? 46 : 38
  const anchor = size / 2

  const ambulanceIcon = L.divIcon({
    className: "",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: ${bg};
      border: 2px solid #ffffff;
      box-shadow: 0 10px 24px rgba(0,0,0,0.3);
      font-size: ${selected ? 24 : 20}px;
      line-height: 1;
    ">${AMBULANCE_EMOJI}</div>`,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
  })

  return <Marker position={position} icon={ambulanceIcon} />
}

function IntersectionMarker({
  position,
  signalState,
}: {
  position: [number, number]
  signalState: string
}) {
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

"use client"

import { useRef, useEffect, useState } from "react"
import { Cpu, Wifi, MapPin, Lightbulb } from "lucide-react"

const hardware = [
  {
    icon: Cpu,
    name: "Raspberry Pi 5",
    role: "Central Brain",
    specs: ["8GB RAM", "MQTT Broker", "Whisper + Gemma"],
    price: "₹7,500",
    color: "cyan",
  },
  {
    icon: Wifi,
    name: "ESP32-WROOM",
    role: "Signal Controller",
    specs: ["Wi-Fi + BLE", "GPIO Control", "OTA Updates"],
    price: "₹450",
    color: "amber",
  },
  {
    icon: MapPin,
    name: "NEO-6M GPS",
    role: "Position Tracker",
    specs: ["1Hz Update", "UART Interface", "NMEA Protocol"],
    price: "₹350",
    color: "green",
  },
  {
    icon: Lightbulb,
    name: "LED Array",
    role: "Traffic Signal",
    specs: ["R/Y/G Indicators", "High Visibility", "PWM Dimming"],
    price: "₹200",
    color: "red",
  },
]

export function HardwareSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative py-32 overflow-hidden">
      {/* Cyan grid background */}
      <div className="absolute inset-0 grid-bg-cyan opacity-30" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-[2px] bg-cyan" />
          <span className="eyebrow">06 — Hardware</span>
        </div>

        <h2 className="font-sans font-bold text-3xl md:text-4xl text-text mb-4">
          Built with off-the-shelf components.
        </h2>
        <p className="text-text-dim text-lg mb-16 max-w-2xl">
          No proprietary hardware. No expensive licenses. Total BOM under ₹1.5L per intersection — vs ₹8–15L for commercial systems.
        </p>

        {/* Hardware Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {hardware.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                className={`group relative p-6 bg-card border border-border rounded-sm transition-all duration-300 hover:border-border2 card-${item.color}`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0)" : "translateY(20px)",
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                {/* Price Badge */}
                <div 
                  className="absolute top-4 right-4 px-2 py-1 text-xs font-mono font-semibold rounded-sm"
                  style={{ 
                    backgroundColor: `rgba(var(--${item.color === 'cyan' ? '34, 211, 238' : item.color === 'amber' ? '245, 158, 11' : item.color === 'green' ? '74, 222, 128' : '255, 59, 59'}), 0.1)`,
                    color: `var(--${item.color})`,
                  }}
                >
                  {item.price}
                </div>

                {/* Icon */}
                <div 
                  className="w-14 h-14 flex items-center justify-center rounded-sm mb-4"
                  style={{ 
                    backgroundColor: `rgba(var(--${item.color === 'cyan' ? '34, 211, 238' : item.color === 'amber' ? '245, 158, 11' : item.color === 'green' ? '74, 222, 128' : '255, 59, 59'}), 0.1)`,
                  }}
                >
                  <Icon 
                    className="w-7 h-7" 
                    style={{ color: `var(--${item.color})` }}
                  />
                </div>

                {/* Name & Role */}
                <h3 className="font-sans font-semibold text-lg text-text mb-1">
                  {item.name}
                </h3>
                <p 
                  className="text-xs font-mono uppercase tracking-wider mb-4"
                  style={{ color: `var(--${item.color})` }}
                >
                  {item.role}
                </p>

                {/* Specs */}
                <ul className="space-y-1">
                  {item.specs.map((spec, j) => (
                    <li key={j} className="text-sm text-text-muted flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-text-muted" />
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

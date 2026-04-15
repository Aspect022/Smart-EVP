"use client"

import { useRef, useEffect, useState } from "react"
import { Phone, Navigation, Radio, Stethoscope, Building } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Phone,
    title: "Dispatch",
    subtitle: "AI Call Handler",
    description: "Gemma 3 transcribes emergency calls, extracts location and severity, auto-dispatches nearest ambulance.",
    color: "purple",
  },
  {
    number: "02",
    icon: Navigation,
    title: "GPS Tracking",
    subtitle: "Real-time Position",
    description: "NEO-6M GPS module streams coordinates via MQTT at 1Hz. Backend calculates ETA and approach vectors.",
    color: "cyan",
  },
  {
    number: "03",
    icon: Radio,
    title: "Signal Preemption",
    subtitle: "Traffic Override",
    description: "When ambulance enters 500m radius, MQTT triggers ESP32 to flip intersection lights — <5s latency.",
    color: "green",
  },
  {
    number: "04",
    icon: Stethoscope,
    title: "Medical Brief",
    subtitle: "En-route Intelligence",
    description: "Audio from paramedics transcribed by Whisper, summarized by Gemma into structured patient brief.",
    color: "purple",
  },
  {
    number: "05",
    icon: Building,
    title: "Hospital Ready",
    subtitle: "Pre-arrival Prep",
    description: "Hospital receives patient brief 4+ minutes before arrival. Resources allocated, team assembled.",
    color: "green",
  },
]

export function PipelineSection() {
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
      <div className="absolute inset-0 grid-bg-cyan opacity-50" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-[2px] bg-cyan" />
          <span className="eyebrow">03 — System Pipeline</span>
        </div>

        <h2 className="font-sans font-bold text-3xl md:text-4xl text-text mb-16">
          Five subsystems. One seamless flow.
        </h2>

        {/* Pipeline Steps */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-[2px] bg-border2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div
                  key={i}
                  className={`group relative p-6 bg-card border border-border rounded-sm transition-all duration-300 hover:scale-[1.02] hover:border-border2 card-${step.color}`}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(30px)",
                    transitionDelay: `${i * 100}ms`,
                  }}
                >
                  {/* Step Number */}
                  <div 
                    className="absolute -top-3 left-6 px-2 py-0.5 text-xs font-mono font-semibold tracking-wider"
                    style={{ 
                      backgroundColor: "var(--card)",
                      color: `var(--${step.color})`,
                    }}
                  >
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div 
                    className="w-12 h-12 flex items-center justify-center rounded-sm mb-4"
                    style={{ 
                      backgroundColor: `rgba(var(--${step.color === 'purple' ? '167, 139, 250' : step.color === 'cyan' ? '34, 211, 238' : '74, 222, 128'}), 0.1)`,
                    }}
                  >
                    <Icon 
                      className="w-6 h-6" 
                      style={{ color: `var(--${step.color})` }}
                    />
                  </div>

                  {/* Title */}
                  <h3 className="font-sans font-semibold text-lg text-text mb-1">
                    {step.title}
                  </h3>

                  {/* Subtitle */}
                  <p 
                    className="text-xs font-mono uppercase tracking-wider mb-3"
                    style={{ color: `var(--${step.color})` }}
                  >
                    {step.subtitle}
                  </p>

                  {/* Description - Shows on hover/focus */}
                  <p className="text-sm text-text-dim leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                    {step.description}
                  </p>

                  {/* Arrow connector - Desktop */}
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-24 w-6 h-6 text-text-muted">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

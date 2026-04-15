"use client"

import { useRef, useEffect, useState } from "react"

const impacts = [
  {
    value: 25,
    suffix: "%",
    label: "Response Time",
    sublabel: "Reduction",
    color: "green",
  },
  {
    value: 4,
    suffix: " min",
    label: "Saved Per",
    sublabel: "Emergency",
    color: "cyan",
  },
  {
    value: 1.5,
    prefix: "₹",
    suffix: "L",
    label: "Per Intersection",
    sublabel: "vs ₹8–15L",
    color: "amber",
  },
  {
    value: 99.9,
    suffix: "%",
    label: "Authentication",
    sublabel: "Accuracy",
    color: "purple",
  },
]

function AnimatedCounter({ 
  value, 
  prefix = "", 
  suffix = "", 
  isVisible 
}: { 
  value: number
  prefix?: string
  suffix?: string
  isVisible: boolean 
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    const duration = 2000

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)

      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3)
      
      // Handle decimals
      const hasDecimal = value % 1 !== 0
      const current = hasDecimal 
        ? parseFloat((eased * value).toFixed(1))
        : Math.floor(eased * value)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    requestAnimationFrame(animate)
  }, [value, isVisible])

  return (
    <span>
      {prefix}{displayValue}{suffix}
    </span>
  )
}

export function ImpactSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-[2px] bg-green" />
          <span className="eyebrow">07 — Impact</span>
        </div>

        <h2 className="font-sans font-bold text-3xl md:text-4xl text-text mb-16">
          Numbers that matter.
        </h2>

        {/* Impact Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {impacts.map((impact, i) => (
            <div
              key={i}
              className="relative p-8 bg-card border border-border rounded-sm text-center"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: `${i * 100}ms`,
                transition: "all 0.5s ease-out",
              }}
            >
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-sm opacity-0 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, rgba(var(--${impact.color === 'green' ? '74, 222, 128' : impact.color === 'cyan' ? '34, 211, 238' : impact.color === 'amber' ? '245, 158, 11' : '167, 139, 250'}), 0.1) 0%, transparent 70%)`,
                }}
              />

              {/* Value */}
              <div 
                className="font-sans font-extrabold text-4xl md:text-5xl lg:text-6xl mb-4"
                style={{ color: `var(--${impact.color})` }}
              >
                <AnimatedCounter 
                  value={impact.value} 
                  prefix={impact.prefix}
                  suffix={impact.suffix}
                  isVisible={isVisible}
                />
              </div>

              {/* Labels */}
              <div className="font-sans font-semibold text-text text-sm md:text-base">
                {impact.label}
              </div>
              <div className="text-xs text-text-muted uppercase tracking-wider mt-1">
                {impact.sublabel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

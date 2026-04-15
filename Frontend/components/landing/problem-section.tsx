"use client"

import { useRef, useEffect, useState } from "react"

const stats = [
  {
    value: "45%",
    label: "Bengaluru ambulance delay",
    description: "Due to traffic congestion at intersections",
    color: "red",
  },
  {
    value: "30–60s",
    label: "Manual corridor response",
    description: "vs our <5s automated preemption",
    color: "amber",
  },
  {
    value: "₹8–15L",
    label: "Per intersection",
    description: "Commercial EVP systems cost",
    color: "cyan",
  },
]

function AnimatedNumber({ value, isVisible }: { value: string; isVisible: boolean }) {
  const [displayValue, setDisplayValue] = useState("0")
  
  useEffect(() => {
    if (!isVisible) return
    
    // Extract numeric part
    const numericMatch = value.match(/[\d.]+/)
    if (!numericMatch) {
      setDisplayValue(value)
      return
    }
    
    const targetNum = parseFloat(numericMatch[0])
    const prefix = value.slice(0, value.indexOf(numericMatch[0]))
    const suffix = value.slice(value.indexOf(numericMatch[0]) + numericMatch[0].length)
    
    let startTime: number
    const duration = 1500
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(eased * targetNum)
      
      setDisplayValue(`${prefix}${current}${suffix}`)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, isVisible])
  
  return <span>{displayValue}</span>
}

export function ProblemSection() {
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
      {/* Background glow behind first stat */}
      <div 
        className="absolute top-1/2 left-[10%] w-[400px] h-[400px] -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,59,59,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-16">
          <div className="w-8 h-[2px] bg-red" />
          <span className="eyebrow">02 — The Problem</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`p-8 bg-card border border-border rounded-sm transition-all duration-500 card-${stat.color}`}
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <div 
                className="font-sans font-extrabold text-5xl lg:text-6xl mb-4"
                style={{ color: `var(--${stat.color})` }}
              >
                <AnimatedNumber value={stat.value} isVisible={isVisible} />
              </div>
              <div className="h-[1px] w-12 bg-border2 mb-4" />
              <h3 className="font-sans font-semibold text-lg text-text mb-2">
                {stat.label}
              </h3>
              <p className="text-sm text-text-muted">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

"use client"

import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import type { LottieRefCurrentProps } from "lottie-react"

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

interface HeroSectionProps {
  ambulanceData: object | null
  onAnimationComplete: () => void
}

// Rain drop component - diagonal rain falling from right to left (wind blowing left)
function RainDrop({ delay, duration, left, height, opacity }: { 
  delay: number
  duration: number
  left: number
  height: number
  opacity: number 
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${left}%`,
        top: "-80px",
        width: "1px",
        height: `${height}px`,
        background: `linear-gradient(to bottom, transparent 0%, rgba(148, 163, 184, ${opacity * 0.3}) 20%, rgba(148, 163, 184, ${opacity * 0.5}) 80%, transparent 100%)`,
        transform: "rotate(20deg)",
        animationName: "rain-diagonal",
        animationDuration: `${duration}s`,
        animationTimingFunction: "linear",
        animationDelay: `${delay}s`,
        animationIterationCount: "infinite",
        borderRadius: "1px",
      }}
    />
  )
}

export function HeroSection({ ambulanceData, onAnimationComplete }: HeroSectionProps) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const accumulatedScroll = useRef(0)

  // Generate rain drops - softer, fewer drops
  const rainDrops = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 2, // slower: 2s to 4s
      left: -10 + Math.random() * 120, // spread for diagonal entry from right
      height: 30 + Math.random() * 50, // subtle streaks: 30-80px
      opacity: 0.15 + Math.random() * 0.25, // softer opacity
    }))
  }, [])

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;
    const duration = 2500; // 2.5 seconds entrance animation

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      
      setProgress(newProgress);

      if (lottieRef.current && ambulanceData) {
        const totalFrames = 500;
        const frame = Math.floor(newProgress * totalFrames);
        lottieRef.current.goToAndStop(frame, true);
      }

      if (newProgress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else if (!isComplete) {
        setIsComplete(true);
        onAnimationComplete();
      }
    };

    if (ambulanceData && !isComplete) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isComplete, ambulanceData, onAnimationComplete]);

  // Set initial frame to 0
  useEffect(() => {
    if (lottieRef.current && ambulanceData) {
      lottieRef.current.goToAndStop(0, true)
    }
  }, [ambulanceData])

  // Content reveal timing based on progress (smoother, more staggered)
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
  
  const titleRaw = Math.min(Math.max((progress - 0.1) * 3, 0), 1)
  const subtitleRaw = Math.min(Math.max((progress - 0.25) * 3, 0), 1)
  const taglineRaw = Math.min(Math.max((progress - 0.4) * 3, 0), 1)
  const statsRaw = Math.min(Math.max((progress - 0.55) * 3, 0), 1)
  
  const titleOpacity = easeOutCubic(titleRaw)
  const subtitleOpacity = easeOutCubic(subtitleRaw)
  const taglineOpacity = easeOutCubic(taglineRaw)
  const statsOpacity = easeOutCubic(statsRaw)

  // SmartEVP+ moves up as progress increases (more lift)
  const titleTranslateY = progress * -80
  
  // Hover animation continues even after moving up
  const hoverOffset = "translateY(var(--hover-offset))"

  // Ambulance position: starts off-screen left (-30%), moves to off-screen right (110%)
  // The Lottie is flipped, so as it plays frame 0->500, it visually moves right
  const ambulanceX = -30 + (progress * 140) // -30% to 110%

  return (
    <section 
      ref={containerRef}
      className="relative h-screen bg-bg overflow-hidden"
    >
      {/* Animated Grid Background */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* Rain Effect - Behind everything, diagonal from right to left */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        {rainDrops.map((drop) => (
          <RainDrop
            key={drop.id}
            delay={drop.delay}
            duration={drop.duration}
            left={drop.left}
            height={drop.height}
            opacity={drop.opacity}
          />
        ))}
      </div>

      {/* Red ambient glow - more intense, follows ambulance */}
      <div 
        className="absolute top-1/2 w-[600px] h-[400px] rounded-full pointer-events-none transition-all duration-150"
        style={{
          left: `${ambulanceX + 15}%`,
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse, rgba(255,59,59,0.5) 0%, rgba(255,59,59,0.2) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col justify-center max-w-7xl mx-auto px-6 lg:px-8 pt-20">
        {/* SmartEVP+ - Always visible, moves up on scroll with hover */}
        <h1 
          className="font-sans font-extrabold tracking-tight mb-4 animate-hover-float"
          style={{ 
            transform: `translateY(${titleTranslateY}px)`,
            transition: "transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          <span className="block text-5xl md:text-6xl lg:text-7xl text-text drop-shadow-[0_0_30px_rgba(255,59,59,0.3)]">
            SmartEVP<span className="text-red drop-shadow-[0_0_20px_rgba(255,59,59,0.6)]">+</span>
          </span>

          {/* Ghost "Emergency" - reveals */}
          <span 
            className="block text-4xl md:text-5xl lg:text-6xl mt-3"
            style={{
              WebkitTextStroke: "1px rgba(226, 232, 240, 0.3)",
              WebkitTextFillColor: "transparent",
              opacity: titleOpacity,
              transform: `translateX(${(1 - titleOpacity) * 50}px)`,
              transition: "all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            Emergency
          </span>

          {/* "Reimagined" in red */}
          <span 
            className="block text-4xl md:text-5xl lg:text-6xl text-red"
            style={{
              opacity: subtitleOpacity,
              transform: `translateX(${(1 - subtitleOpacity) * 50}px)`,
              transition: "all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            Reimagined.
          </span>
        </h1>

        {/* Tagline */}
        <p 
          className="pull-quote text-lg md:text-xl text-text-dim max-w-xl mb-8"
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${(1 - taglineOpacity) * 25}px)`,
            transition: "all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          A full end-to-end emergency dispatch, traffic preemption, and hospital readiness platform.
        </p>

        {/* Stat Pills */}
        <div 
          className="flex flex-wrap gap-2"
          style={{
            opacity: statsOpacity,
            transform: `translateY(${(1 - statsOpacity) * 25}px)`,
            transition: "all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          {[
            { value: "<5s", label: "Latency" },
            { value: "5", label: "Subsystems" },
            { value: "₹0", label: "Recurring Cost" },
            { value: "25%", label: "Faster" },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 bg-bg3/80 border border-border rounded-sm text-sm"
            >
              <span className="font-sans font-bold text-text">{stat.value}</span>
              <span className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Team Badge */}
        <div 
          className="mt-8 flex items-center gap-3"
          style={{
            opacity: statsOpacity,
            transform: `translateY(${(1 - statsOpacity) * 20}px)`,
            transition: "all 450ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          <div className="w-6 h-[2px] bg-red" />
          <span className="eyebrow text-xs">Team V3</span>
        </div>
      </div>

      {/* Ambulance Animation - Positioned based on scroll, flipped to move left-to-right */}
      <div 
        className="absolute bottom-24 h-40 md:h-48 pointer-events-none z-20"
        style={{
          left: `${ambulanceX}%`,
          width: "300px",
          transition: "left 50ms linear",
        }}
      >
        {ambulanceData && (
          <div className="relative w-full h-full">
            {/* Red glow directly behind ambulance */}
            <div 
              className="absolute top-1/2 left-1/2 w-[200px] h-[100px] rounded-full"
              style={{
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(ellipse, rgba(255,59,59,0.8) 0%, rgba(255,59,59,0.3) 50%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            <Lottie
              lottieRef={lottieRef}
              animationData={ambulanceData}
              autoplay={false}
              loop={false}
              className="w-full h-full"
              style={{
                transform: "scaleX(-1)", // Flip horizontally so it moves left to right
              }}
            />
          </div>
        )}
      </div>

      {/* Road Line */}
      <div className="absolute bottom-20 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-text-muted/30 to-transparent" />
    </section>
  )
}

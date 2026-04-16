"use client"

import { useEffect, useState } from "react"
import { HeroSection } from "@/components/landing/hero-section"
import { ProblemSection } from "@/components/landing/problem-section"
import { PipelineSection } from "@/components/landing/pipeline-section"
import { CtaSection } from "@/components/landing/cta-section"
import { HardwareSection } from "@/components/landing/hardware-section"
import { ImpactSection } from "@/components/landing/impact-section"
import { Footer } from "@/components/landing/footer"
import { DemoLauncher } from "@/components/landing/demo-launcher"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Laptop } from "lucide-react"

import { Suspense } from "react"

function LandingContent() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get("demo") === "1"
  const [ambulanceData, setAmbulanceData] = useState<object | null>(null)
  const [heroComplete, setHeroComplete] = useState(false)

  // Load ambulance Lottie animation
  useEffect(() => {
    fetch("/ambulance.json")
      .then((res) => res.json())
      .then((data) => setAmbulanceData(data))
      .catch((err) => console.error("Failed to load ambulance animation:", err))
  }, [])

  // Prevent body scroll until hero animation completes
  useEffect(() => {
    if (!heroComplete) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [heroComplete])

  if (isDemo) {
    return <DemoLauncher />
  }

  return (
    <main className="relative min-h-screen bg-bg overflow-x-hidden">
      {/* Navigation Bar - Hidden until hero animation completes */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-8 py-4 backdrop-blur-md bg-bg/80 border-b border-border/50"
        style={{
          opacity: heroComplete ? 1 : 0,
          transform: heroComplete ? "translateY(0)" : "translateY(-100%)",
          transition: "all 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-sans font-bold text-xl text-text">
              SmartEVP<span className="text-red">+</span>
            </span>
          </div>
          <a
            href="/dashboard"
            className="text-sm text-text-dim hover:text-text transition-colors font-mono"
          >
            Dashboard →
          </a>
        </div>
      </nav>

      {/* Hero Section with Ambulance Parallax */}
      <HeroSection 
        ambulanceData={ambulanceData} 
        onAnimationComplete={() => setHeroComplete(true)}
      />

      {/* Content below hero - smoothly reveals after animation */}
      <div 
        style={{ 
          opacity: heroComplete ? 1 : 0.2,
          transition: "opacity 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        {/* Problem Statistics */}
        <ProblemSection />

        {/* System Pipeline */}
        <PipelineSection />

        {/* Call to Action */}
        <CtaSection />

        {/* Hardware Showcase */}
        <HardwareSection />

        {/* Impact Numbers */}
        <ImpactSection />

        {/* Footer */}
        <Footer />
      </div>

      {/* Floating Demo Launcher Toggle */}
      <Link
        href="/?demo=1"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-red/10 border-2 border-red text-red hover:bg-red hover:text-white rounded-full font-sans font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,59,59,0.3)] hover:-translate-y-1 hover:shadow-[0_4px_30px_rgba(255,59,59,0.5)]"
      >
        <Laptop className="w-5 h-5" /> 3-Laptop Demo Setup
      </Link>
    </main>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-bg"></div>}>
      <LandingContent />
    </Suspense>
  )
}

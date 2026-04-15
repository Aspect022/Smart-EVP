"use client"

export function CtaSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div 
          className="relative p-12 md:p-16 rounded-sm border border-border overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255,59,59,0.08) 0%, rgba(255,59,59,0.02) 100%)",
          }}
        >
          {/* Ambient Glow */}
          <div 
            className="absolute top-0 right-0 w-[500px] h-[500px] -translate-y-1/2 translate-x-1/4 pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(255,59,59,0.2) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 max-w-3xl">
            {/* Pull Quote */}
            <p className="pull-quote text-2xl md:text-3xl text-text leading-relaxed mb-6">
              &ldquo;Every second after a cardiac event, survival chances drop by 10%. SmartEVP+ removes the seconds.&rdquo;
            </p>

            {/* Source */}
            <p className="text-sm text-text-muted">
              — American Heart Association Guidelines, 2024
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

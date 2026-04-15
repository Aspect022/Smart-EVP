"use client"

import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative py-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Brand */}
          <div>
            <h3 className="font-sans font-bold text-2xl text-text mb-2">
              SmartEVP<span className="text-red">+</span>
            </h3>
            <p className="text-sm text-text-muted">
              Built for lives that can&apos;t wait.
            </p>
          </div>

          {/* Team */}
          <div className="text-sm text-text-dim">
            <p className="mb-1">Team V3</p>
            <p className="text-text-muted">Dayananda Sagar University</p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm text-text-dim hover:text-text border border-border hover:border-border2 rounded-sm transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-text-muted">
          <p>&copy; 2025 SmartEVP+. Emergency Vehicle Preemption System.</p>
          <p className="font-mono">v1.0.0</p>
        </div>
      </div>
    </footer>
  )
}

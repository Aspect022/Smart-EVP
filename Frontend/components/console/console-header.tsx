"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeftRight, Circle, Home } from "lucide-react"

interface ConsoleHeaderProps {
  title: string
  subtitle?: string
  consoleLabel: string
  connected: boolean
  statusContent?: ReactNode
}

export function ConsoleHeader({
  title,
  subtitle,
  consoleLabel,
  connected,
  statusContent,
}: ConsoleHeaderProps) {
  return (
    <header className="border-b border-border bg-bg px-6 py-4">
      <div className="mx-auto flex max-w-[1600px] items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-3">
            <span className="rounded-sm border border-border bg-bg2 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted">
              {consoleLabel}
            </span>
            <span
              className={`inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] ${
                connected ? "text-green" : "text-red"
              }`}
            >
              <Circle className="h-2.5 w-2.5 fill-current stroke-none" />
              {connected ? "Connected" : "Offline"}
            </span>
          </div>
          <h1 className="font-mono text-[1.35rem] font-semibold uppercase tracking-[0.12em] text-text">
            {title}
          </h1>
          {subtitle ? <p className="mt-1 max-w-2xl text-sm text-text-dim">{subtitle}</p> : null}
        </div>

        <div className="flex items-start gap-3">
          {statusContent}
          <div className="flex items-center gap-3">
            <Link
              href="/?demo=1"
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-bg2 px-3 py-2 text-xs font-mono uppercase tracking-[0.18em] text-text-dim transition-colors hover:border-border2 hover:text-text"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Demo Launcher
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-bg2 px-3 py-2 text-xs font-mono uppercase tracking-[0.18em] text-text-dim transition-colors hover:border-border2 hover:text-text"
            >
              <Home className="h-4 w-4" />
              Landing Page
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

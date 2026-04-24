"use client"

import { useEffect, useRef } from "react"

interface TranscriptPanelProps {
  transcript: string
}

export function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [transcript])

  return (
    <div className="bg-bg2 border border-border flex flex-col h-full overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
          Live Transcript
        </span>
        {transcript && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-cyan">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
            Recording
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide">
        {transcript ? (
          <p className="font-mono text-sm text-text leading-relaxed whitespace-pre-wrap">
            {transcript}
            <span className="inline-block w-0.5 h-4 bg-cyan ml-0.5 animate-pulse align-middle" />
          </p>
        ) : (
          <p className="text-text-muted font-mono text-xs italic">
            Waiting for paramedic audio input...
          </p>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

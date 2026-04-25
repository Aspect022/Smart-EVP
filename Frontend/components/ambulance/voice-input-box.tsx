"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"

interface VoiceInputBoxProps {
  /** Called when the Gemini brief is generated from voice input */
  onBriefGenerated?: (brief: any) => void
}

type State = "idle" | "recording" | "processing" | "done" | "error"

// Extend window type for cross-browser Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function VoiceInputBox({ onBriefGenerated }: VoiceInputBoxProps) {
  const [state, setState] = useState<State>("idle")
  const [liveTranscript, setLiveTranscript] = useState("")
  const [finalTranscript, setFinalTranscript] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const recognitionRef = useRef<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll as transcript grows
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [liveTranscript])

  const startRecording = useCallback(async () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setErrorMsg("Web Speech API not supported in this browser.")
      setState("error")
      setTimeout(() => setState("idle"), 3000)
      return
    }

    setLiveTranscript("")
    setFinalTranscript("")
    setErrorMsg("")

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-IN"

    recognition.onresult = (event: any) => {
      let interim = ""
      let final = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript + " "
        } else {
          interim += transcript
        }
      }
      setFinalTranscript((prev) => prev + final)
      setLiveTranscript((prev) => {
        // Replace trailing interim portion
        const withoutInterim = prev.replace(/\[\[.*$/, "").trim()
        return withoutInterim + (final ? " " + final.trim() : "") + (interim ? ` [[${interim}` : "")
      })
    }

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return // ignore silence
      setErrorMsg(`Mic error: ${event.error}`)
      setState("error")
      setTimeout(() => setState("idle"), 3000)
    }

    recognition.start()
    setState("recording")
  }, [])

  const stopAndProcess = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setState("processing")
  }, [])

  // When state moves to "processing", collect the clean text and call Gemini
  useEffect(() => {
    if (state !== "processing") return

    // Clean up interim markers
    const cleanText = (finalTranscript + " " + liveTranscript)
      .replace(/\[\[.*$/g, "")
      .replace(/\s+/g, " ")
      .trim()

    if (!cleanText) {
      setState("idle")
      return
    }

    // Freeze displayed transcript to the clean version
    setLiveTranscript(cleanText)

    callGemini(cleanText)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const callGemini = async (text: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) {
        // Graceful fallback — return a structured mock brief
        const mockBrief = buildMockBrief(text)
        onBriefGenerated?.(mockBrief)
        setState("done")
        setTimeout(() => setState("idle"), 2500)
        return
      }

      const systemPrompt = `You are a paramedic field-AI. Extract a structured medical brief from the paramedic's voice report. 
Return ONLY a valid JSON object (no markdown fences) with these exact keys:
{
  "chief_complaint": "string",
  "suspected_diagnosis": "string",
  "vitals": { "bp": "string", "hr": "string", "spo2": "string", "gcs": "number" },
  "resources_required": ["string"],
  "priority": "CRITICAL | HIGH | MODERATE"
}`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: `${systemPrompt}\n\nParamedic Report:\n${text}` }] },
            ],
            generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
          }),
        }
      )

      if (!response.ok) throw new Error(`Gemini API ${response.status}`)

      const data = await response.json()
      const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
      const jsonStr = rawText.replace(/```json|```/g, "").trim()
      const brief = JSON.parse(jsonStr)

      onBriefGenerated?.({ brief, ai_model: "gemini-2.0-flash", source: "voice_input" })
      setState("done")
      setTimeout(() => setState("idle"), 2500)
    } catch (err) {
      console.error("Gemini call failed:", err)
      // Fallback on parse/network error
      const mockBrief = buildMockBrief(text)
      onBriefGenerated?.(mockBrief)
      setState("done")
      setTimeout(() => setState("idle"), 2500)
    }
  }

  /** Minimal mock brief when no API key is configured */
  function buildMockBrief(text: string) {
    return {
      brief: {
        chief_complaint: text.slice(0, 120),
        suspected_diagnosis: "Pending — set NEXT_PUBLIC_GEMINI_API_KEY",
        vitals: { bp: "—", hr: "—", spo2: "—", gcs: null },
        resources_required: [],
        priority: "HIGH",
      },
      ai_model: "mock",
      source: "voice_input",
    }
  }

  const isActive = state === "recording"
  const isProcessing = state === "processing"

  return (
    <div className="flex flex-col bg-bg border-t border-border">
      {/* ── Trigger row ── */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/60">
        <button
          id="voice-input-trigger"
          onClick={isActive ? stopAndProcess : startRecording}
          disabled={isProcessing}
          aria-label={isActive ? "Stop recording" : "Start voice input"}
          className={`inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] transition-all duration-200 ${
            isActive
              ? "border-red/50 bg-red/10 text-red shadow-[0_0_12px_rgba(255,59,59,0.18)] animate-pulse"
              : isProcessing
              ? "cursor-wait border-cyan/30 bg-cyan/5 text-cyan"
              : state === "done"
              ? "border-green/40 bg-green/10 text-green"
              : state === "error"
              ? "border-red/30 bg-red/10 text-red"
              : "border-border bg-bg2 text-text-dim hover:border-cyan/40 hover:bg-cyan/5 hover:text-cyan"
          }`}
        >
          {isProcessing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : state === "error" ? (
            <AlertCircle className="h-3 w-3" />
          ) : (
            <span className="text-base leading-none">🎤</span>
          )}
          {isActive
            ? "Recording… tap to stop"
            : isProcessing
            ? "Processing with Gemini…"
            : state === "done"
            ? "Brief generated ✓"
            : state === "error"
            ? "Error — try again"
            : "Voice Input"}
        </button>

        {isActive && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-red">
            <span className="w-1.5 h-1.5 rounded-full bg-red animate-ping" />
            Live
          </span>
        )}

        <span className="ml-auto text-[9px] font-mono text-text-muted uppercase tracking-wider">
          AI brief generates after audio
        </span>
      </div>

      {/* ── Live transcript area (only visible when recording or done) ── */}
      {(liveTranscript || isActive) && (
        <div className="relative px-4 py-2.5 max-h-24 overflow-y-auto scrollbar-hide">
          <p className="font-mono text-xs text-text leading-relaxed whitespace-pre-wrap">
            {liveTranscript
              ? liveTranscript.replace(/\[\[.*$/, "") // hide interim marker
              : ""}
            {isActive && (
              <span className="inline-block w-0.5 h-3.5 bg-red ml-0.5 animate-pulse align-middle" />
            )}
          </p>
          {errorMsg && (
            <p className="text-[10px] font-mono text-red mt-1">{errorMsg}</p>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}

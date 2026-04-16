"use client"

import { useRef, useState } from "react"
import { Loader2, Mic, MicOff, CheckCircle2, AlertCircle } from "lucide-react"

type AudioState = "idle" | "recording" | "processing" | "success" | "error"

export function AmbulanceAudioPanel() {
  const [audioState, setAudioState] = useState<AudioState>("idle")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const isPointerActiveRef = useRef(false)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
        await uploadAudio(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setAudioState("recording")
    } catch (error) {
      console.error("Microphone error:", error)
      setAudioState("error")
      window.setTimeout(() => setAudioState("idle"), 2200)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      setAudioState("processing")
    }
  }

  const uploadAudio = async (blob: Blob) => {
    try {
      const formData = new FormData()
      formData.append("audio", blob, "recording.webm")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/api/audio/upload`, {
        method: "POST",
        body: formData,
      })
      if (!response.ok) throw new Error("Upload failed")

      setAudioState("success")
      window.setTimeout(() => setAudioState("idle"), 1800)
    } catch (error) {
      console.error(error)
      setAudioState("error")
      window.setTimeout(() => setAudioState("idle"), 2200)
    }
  }

  const handlePressStart = () => {
    if (audioState === "processing" || audioState === "recording" || isPointerActiveRef.current) return
    isPointerActiveRef.current = true
    startRecording()
  }

  const handlePressEnd = () => {
    if (!isPointerActiveRef.current) return
    isPointerActiveRef.current = false
    if (audioState === "recording") stopRecording()
  }

  const icon = () => {
    if (audioState === "recording") return <MicOff className="h-20 w-20 text-red" />
    if (audioState === "processing") return <Loader2 className="h-20 w-20 animate-spin text-cyan" />
    if (audioState === "success") return <CheckCircle2 className="h-20 w-20 text-green" />
    if (audioState === "error") return <AlertCircle className="h-20 w-20 text-red" />
    return <Mic className="h-20 w-20 text-cyan" />
  }

  return (
    <div className="w-72 shrink-0 border-l border-border bg-bg p-6">
      <div className="flex h-full items-center justify-center rounded-md border border-border bg-bg2">
        <div className="flex flex-col items-center gap-4">
          <button
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerCancel={handlePressEnd}
            onPointerLeave={handlePressEnd}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") handlePressStart()
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") handlePressEnd()
            }}
            aria-label="Push to talk"
            className={`relative inline-flex h-52 w-52 items-center justify-center rounded-full border transition-all duration-300 ${
              audioState === "recording"
                ? "border-red/40 bg-red/10 shadow-[0_0_40px_rgba(255,59,59,0.28)]"
                : audioState === "processing"
                  ? "cursor-wait border-cyan/40 bg-cyan/10 shadow-[0_0_36px_rgba(34,211,238,0.22)]"
                  : audioState === "success"
                    ? "border-green/40 bg-green/10 shadow-[0_0_30px_rgba(74,222,128,0.2)]"
                    : audioState === "error"
                      ? "border-red/30 bg-red/10"
                      : "border-cyan/30 bg-cyan/5 shadow-[0_0_30px_rgba(34,211,238,0.16)] hover:shadow-[0_0_42px_rgba(34,211,238,0.26)]"
            }`}
            disabled={audioState === "processing"}
          >
            {audioState === "recording" && (
              <span className="absolute inset-0 rounded-full bg-red/20 animate-ping" />
            )}
            <span className="relative">{icon()}</span>
          </button>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">Push-to-Talk</p>
        </div>
      </div>
    </div>
  )
}

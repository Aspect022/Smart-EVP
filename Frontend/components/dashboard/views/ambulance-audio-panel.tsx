"use client"

import { useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, Mic, Square } from "lucide-react"

type AudioState = "idle" | "recording" | "processing" | "success" | "error"

interface AmbulanceAudioPanelProps {
  onTranscriptReceived?: (text: string) => void
}

export function AmbulanceAudioPanel({ onTranscriptReceived }: AmbulanceAudioPanelProps) {
  const [audioState, setAudioState] = useState<AudioState>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [recordingTime, setRecordingTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      setErrorMessage("")
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
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000)
    } catch (error) {
      console.error("Microphone error:", error)
      setAudioState("error")
      setErrorMessage("Microphone access was not granted.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      if (timerRef.current) clearInterval(timerRef.current)
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

      setTimeout(() => {
        setAudioState("success")
        setTimeout(() => setAudioState("idle"), 5000)
      }, 10000)
    } catch (error) {
      console.error(error)
      setAudioState("error")
      setErrorMessage("The server could not process the recording.")
    }
  }

  const triggerDemoScript = async () => {
    setAudioState("processing")
    onTranscriptReceived?.("Initiating demo fallback script...")
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/demo/audio`, { method: "POST" })
      setTimeout(() => setAudioState("success"), 10000)
    } catch {
      setAudioState("error")
      setErrorMessage("The fallback demo script failed.")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="w-80 shrink-0 border-l border-border bg-bg p-6">
      <div className="mb-6">
        <div className="text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
          Voice report
        </div>
        <h2 className="mt-1 font-sans text-xl font-semibold text-text">Paramedic Audio Intake</h2>
      </div>

      <div className="rounded-md border border-border bg-bg2 p-5">
        <div className="min-h-[180px]">
          {audioState === "idle" && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Mic className="mb-4 h-10 w-10 text-text-muted" />
              <p className="text-sm text-text">Ready for paramedic voice report</p>
              <p className="mt-2 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
                Push to talk when the patient assessment is ready
              </p>
            </div>
          )}

          {audioState === "recording" && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Mic className="mb-4 h-10 w-10 text-red" />
              <p className="text-sm font-semibold text-text">Recording in progress</p>
              <p className="mt-2 font-mono text-text">{formatTime(recordingTime)}</p>
            </div>
          )}

          {audioState === "processing" && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-cyan" />
              <p className="text-sm font-semibold text-text">Processing audio</p>
              <p className="mt-2 text-xs text-text-muted">Transcription and clinical brief generation in progress</p>
            </div>
          )}

          {audioState === "success" && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <CheckCircle2 className="mb-4 h-10 w-10 text-green" />
              <p className="text-sm font-semibold text-text">Report sent to hospital console</p>
            </div>
          )}

          {audioState === "error" && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <AlertCircle className="mb-4 h-10 w-10 text-red" />
              <p className="text-sm font-semibold text-text">Audio intake failed</p>
              <p className="mt-2 text-xs text-text-muted">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {audioState === "idle" || audioState === "error" || audioState === "success" ? (
            <button
              onClick={startRecording}
              className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-border bg-bg px-4 py-3 text-xs font-mono uppercase tracking-[0.18em] text-text transition-colors hover:border-border2 hover:bg-bg"
            >
              <Mic className="h-4 w-4" />
              Start Recording
            </button>
          ) : audioState === "recording" ? (
            <button
              onClick={stopRecording}
              className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-red/40 bg-red/10 px-4 py-3 text-xs font-mono uppercase tracking-[0.18em] text-red transition-colors hover:bg-red/15"
            >
              <Square className="h-4 w-4" />
              Stop Recording
            </button>
          ) : (
            <button className="w-full cursor-not-allowed rounded-sm border border-border bg-bg px-4 py-3 text-xs font-mono uppercase tracking-[0.18em] text-text-muted">
              Processing
            </button>
          )}

          {(audioState === "idle" || audioState === "error") && (
            <button
              onClick={triggerDemoScript}
              className="w-full rounded-sm border border-border bg-bg2 px-4 py-3 text-xs font-mono uppercase tracking-[0.18em] text-text-dim transition-colors hover:border-border2 hover:text-text"
            >
              Use scripted report
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

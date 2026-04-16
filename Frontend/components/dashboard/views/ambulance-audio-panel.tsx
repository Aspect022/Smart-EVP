"use client"

import { useState, useRef } from "react"
import { Mic, Square, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

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

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" }) // Most browsers record in webm
        await uploadAudio(audioBlob)
        
        // Stop all tracks to turn off the microphone indicator
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setAudioState("recording")
      
      // Start recording timer
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (err) {
      console.error("Microphone error:", err)
      setAudioState("error")
      setErrorMessage("Could not access microphone. Please ensure permissions are granted.")
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/api/audio/upload`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")
      
      // Wait roughly the time Gemma takes
      setTimeout(() => {
        setAudioState("success")
        setTimeout(() => setAudioState("idle"), 5000) // Reset back to idle after 5 seconds
      }, 10000)

    } catch (e) {
      setAudioState("error")
      setErrorMessage("Failed to process audio on the server.")
    }
  }

  // Fallback for demo without microphone
  const triggerDemoScript = async () => {
    setAudioState("processing")
    onTranscriptReceived?.("Initiating demo fallback script...")
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"}/demo/audio`, { method: "POST" })
      setTimeout(() => setAudioState("success"), 10000)
    } catch {
      setAudioState("error")
      setErrorMessage("Demo trigger failed.")
    }
  }

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="w-80 bg-bg p-6 flex flex-col shrink-0 overflow-y-auto border-l border-border transition-all duration-300">
      <h2 className="font-sans font-bold text-xl text-text mb-6 tracking-tight">Audio Intake</h2>
      
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        
        {/* Status Indicator */}
        <div className="text-center w-full min-h-[140px] flex flex-col items-center justify-center relative">
          
          {audioState === "idle" && (
            <div className="flex flex-col items-center opacity-50">
               <Mic className="w-12 h-12 mb-4" />
               <p className="font-mono text-sm uppercase tracking-widest text-text-muted">Awaiting Voice Report</p>
            </div>
          )}

          {audioState === "recording" && (
            <div className="flex flex-col items-center">
               <div className="relative mb-4 flex items-center justify-center">
                 <div className="absolute w-16 h-16 rounded-full bg-red/20 animate-ping" />
                 <div className="w-12 h-12 rounded-full bg-red flex items-center justify-center z-10 shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                   <Mic className="w-6 h-6 text-white" />
                 </div>
               </div>
               <p className="font-mono text-red font-bold text-sm uppercase tracking-widest mb-1 animate-pulse">Recording</p>
               <p className="font-mono text-text tabular-nums">{formatTime(recordingTime)}</p>
            </div>
          )}

          {audioState === "processing" && (
            <div className="flex flex-col items-center">
               <Loader2 className="w-12 h-12 text-cyan animate-spin mb-4" />
               <p className="font-mono text-cyan text-sm uppercase tracking-widest animate-pulse">Running ASR...</p>
               <p className="font-mono text-text-muted text-[10px] mt-2">Transcribing & Generating Brief</p>
            </div>
          )}

          {audioState === "success" && (
            <div className="flex flex-col items-center">
               <CheckCircle2 className="w-12 h-12 text-green mb-4 shadow-[0_0_20px_rgba(34,197,94,0.3)] rounded-full" />
               <p className="font-mono text-green font-bold text-sm uppercase tracking-widest">Sent to ERIS</p>
            </div>
          )}

          {audioState === "error" && (
            <div className="flex flex-col items-center text-center">
               <AlertCircle className="w-12 h-12 text-red mb-4" />
               <p className="font-mono text-red font-bold text-sm uppercase tracking-widest mb-2">Failed</p>
               <p className="font-mono text-text-muted text-xs mx-4">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Primary Controls */}
        <div className="w-full mt-4 space-y-3">
          {audioState === "idle" || audioState === "error" || audioState === "success" ? (
             <button 
               onClick={startRecording}
               className="w-full py-4 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 rounded-sm font-bold tracking-widest transition-colors uppercase flex items-center justify-center gap-2"
             >
               <Mic className="w-5 h-5" /> Push to Talk
             </button>
          ) : audioState === "recording" ? (
             <button 
               onClick={stopRecording}
               className="w-full py-4 bg-red/20 hover:bg-red/40 text-red border border-red/50 rounded-sm font-bold tracking-widest transition-colors uppercase flex items-center justify-center gap-2"
             >
               <Square className="w-5 h-5" /> End Recording
             </button>
          ) : (
             <button className="w-full py-4 bg-bg3 text-text-muted rounded-sm font-bold tracking-widest uppercase cursor-not-allowed border border-border">
               Processing...
             </button>
          )}

          {/* Backup trigger */}
          {(audioState === "idle" || audioState === "error") && (
            <button 
              onClick={triggerDemoScript}
              className="w-full py-2 bg-transparent hover:bg-bg3 text-text-muted text-xs font-mono tracking-widest rounded-sm border border-transparent hover:border-border transition-colors uppercase focus:outline-none"
            >
              Use Mock Script →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

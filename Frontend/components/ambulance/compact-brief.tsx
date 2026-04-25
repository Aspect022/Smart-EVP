"use client"

interface CompactBriefProps {
  brief: any | null
}

/** Priority pill colours */
const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  P1:       { label: "P1 — Critical", cls: "bg-red/15 text-red border border-red/30" },
  P2:       { label: "P2 — High",     cls: "bg-amber/15 text-amber-400 border border-amber/30" },
  P3:       { label: "P3 — Moderate", cls: "bg-cyan/10 text-cyan border border-cyan/30" },
  CRITICAL: { label: "Critical",      cls: "bg-red/15 text-red border border-red/30" },
  HIGH:     { label: "High",          cls: "bg-amber/15 text-amber-400 border border-amber/30" },
  MODERATE: { label: "Moderate",      cls: "bg-cyan/10 text-cyan border border-cyan/30" },
}

function VitalChip({ label, value }: { label: string; value: string | null | undefined }) {
  const display = value && value !== "--" && value !== "Unknown" ? value : "—"
  return (
    <div className="bg-bg border border-border rounded-sm px-2 py-1.5 text-center">
      <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider">{label}</div>
      <div className="font-mono text-sm font-bold text-text tabular-nums mt-0.5">{display}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value || value === "Unknown" || value === "--") return null
  return (
    <div>
      <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">{label}</div>
      <p className="text-sm text-text leading-relaxed">{value}</p>
    </div>
  )
}

export function CompactBrief({ brief }: CompactBriefProps) {
  if (!brief) {
    return (
      <div className="bg-bg2 border border-border flex items-center justify-center h-full p-4">
        <div className="text-center">
          <div className="w-2 h-2 rounded-full bg-purple-400/50 animate-pulse mx-auto mb-2" />
          <p className="text-xs font-mono text-text-muted">
            Gemini AI brief generates after audio…
          </p>
        </div>
      </div>
    )
  }

  // ── Normalise keys — supports both camelCase (backend) and snake_case (voice input) ──
  const b = brief?.brief ?? brief

  const chiefComplaint    = b?.chief_complaint    ?? b?.chiefComplaint    ?? null
  const suspectedDx       = b?.suspected_diagnosis ?? b?.suspectedDiagnosis ?? null
  const vitals            = b?.vitals              ?? {}
  const resources: string[] = b?.resources_required ?? b?.resources ?? brief?.resources_required ?? []
  const medications       = b?.medications         ?? null
  const allergies         = b?.allergies           ?? null
  const notes             = b?.notes               ?? null
  const age               = b?.age                 ?? null
  const gender            = b?.gender              ?? null
  const priority          = b?.priority            ?? null
  const aiModel           = brief?.ai_model ?? brief?.ai_model_used ?? b?.ai_model ?? "Gemini"

  const priorityCfg = priority ? (PRIORITY_CONFIG[priority] ?? null) : null

  return (
    <div className="bg-bg2 border border-purple-400/20 flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="px-4 py-2.5 border-b border-purple-400/20 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
          AI Medical Brief
        </span>
        <span className="text-[9px] font-mono text-purple-400/70">
          ● {typeof aiModel === "string" ? aiModel.toUpperCase().replace(/-/g, " ") : "AI"} · Live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
        {/* Priority + Demographics row */}
        {(priorityCfg || age || gender) && (
          <div className="flex items-center gap-2 flex-wrap">
            {priorityCfg && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm uppercase font-bold ${priorityCfg.cls}`}>
                {priorityCfg.label}
              </span>
            )}
            {(age && age !== "UNKNOWN" && age !== 0) && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-border text-text-muted uppercase">
                Age {age}
              </span>
            )}
            {(gender && gender !== "Unknown" && gender !== "UNKNOWN") && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-border text-text-muted uppercase">
                {gender}
              </span>
            )}
          </div>
        )}

        {/* Chief Complaint */}
        <Row label="Chief Complaint" value={chiefComplaint} />

        {/* Suspected Dx */}
        {suspectedDx && suspectedDx !== "Pending Assessment" && (
          <div>
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">
              Suspected Dx
            </div>
            <p className="text-sm font-semibold text-red leading-relaxed">{suspectedDx}</p>
          </div>
        )}

        {/* Vitals */}
        {(vitals.bp || vitals.hr || vitals.spo2 || vitals.gcs) && (
          <div>
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-2">
              Vitals
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <VitalChip label="BP"   value={vitals.bp} />
              <VitalChip label="HR"   value={vitals.hr} />
              <VitalChip label="SpO₂" value={vitals.spo2} />
              <VitalChip label="GCS"  value={vitals.gcs?.toString()} />
            </div>
          </div>
        )}

        {/* Medications */}
        <Row label="Medications" value={medications} />

        {/* Allergies */}
        <Row label="Allergies" value={allergies} />

        {/* Resources */}
        {resources.length > 0 && (
          <div>
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1.5">
              Resources Needed
            </div>
            <div className="flex flex-wrap gap-1">
              {resources.map((r: string) => (
                <span
                  key={r}
                  className="text-[10px] font-mono px-1.5 py-0.5 bg-green/10 text-green border border-green/30 rounded-sm"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {notes && notes !== "No LLM provider was reachable. This is an auto-generated fallback brief." && (
          <div>
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">
              Notes
            </div>
            <p className="text-xs text-text-dim leading-relaxed italic">{notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

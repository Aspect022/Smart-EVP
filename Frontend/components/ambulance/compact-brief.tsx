"use client"

interface CompactBriefProps {
  brief: any | null
}

function VitalChip({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="bg-bg border border-border rounded-sm px-2 py-1.5 text-center">
      <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider">{label}</div>
      <div className="font-mono text-sm font-bold text-text tabular-nums mt-0.5">
        {value ?? "—"}
      </div>
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
            Gemma AI brief generates after audio...
          </p>
        </div>
      </div>
    )
  }

  // Handle nested brief structure
  const b = brief?.brief ?? brief
  const vitals = b?.vitals ?? {}

  const resources: string[] = b?.resources_required ?? brief?.resources_required ?? []

  return (
    <div className="bg-bg2 border border-purple-400/20 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-purple-400/20 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
          AI Medical Brief
        </span>
        <span className="text-[9px] font-mono text-purple-400/70">
          ● Gemma 2B · On-device
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
        {/* Chief complaint */}
        {b?.chief_complaint && (
          <div>
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">
              Chief Complaint
            </div>
            <p className="text-sm text-text">{b.chief_complaint}</p>
          </div>
        )}

        {/* Suspected Dx */}
        {b?.suspected_diagnosis && (
          <div>
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-1">
              Suspected Dx
            </div>
            <p className="text-sm font-semibold text-red">{b.suspected_diagnosis}</p>
          </div>
        )}

        {/* Vitals */}
        {Object.keys(vitals).length > 0 && (
          <div>
            <div className="text-[9px] font-mono text-text-muted uppercase tracking-wider mb-2">
              Vitals
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <VitalChip label="BP" value={vitals.bp ?? null} />
              <VitalChip label="HR" value={vitals.hr ?? null} />
              <VitalChip label="SpO₂" value={vitals.spo2 ?? null} />
              <VitalChip label="GCS" value={vitals.gcs?.toString() ?? null} />
            </div>
          </div>
        )}

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
      </div>
    </div>
  )
}

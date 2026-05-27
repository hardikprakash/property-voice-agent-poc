type TranscriptPanelProps = {
  transcriptText: string
  onTranscriptChange: (value: string) => void
  pendingDraftActionCount: number
  isApprovingAll: boolean
  onApproveAll: () => void
}

export function TranscriptPanel({
  transcriptText,
  onTranscriptChange,
  pendingDraftActionCount,
  isApprovingAll,
  onApproveAll,
}: TranscriptPanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="app-surface rounded-[1.65rem] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Transcript</p>
        <textarea
          rows={16}
          value={transcriptText}
          onChange={(event) => onTranscriptChange(event.target.value)}
          placeholder="Generate a transcript, paste call notes, or start from a quick note."
          className="app-input mt-4 min-h-[22rem] bg-[#fbfaf6] leading-6"
        />
      </section>

      <section className="app-surface-muted rounded-[1.65rem] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-500">Review checklist</p>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-ink-700">
          <li>Generate, paste, or type transcript text before extraction.</li>
          <li>Resolve missing property or contact matches in each draft card.</li>
          <li>Approve only after timing and participant fields look correct.</li>
        </ul>
        <button
          type="button"
          onClick={onApproveAll}
          disabled={!pendingDraftActionCount || isApprovingAll}
          className="app-button-primary mt-6 w-full px-4 py-3 disabled:opacity-60"
        >
          {isApprovingAll ? 'Approving...' : 'Approve All Pending Drafts'}
        </button>
      </section>
    </div>
  )
}
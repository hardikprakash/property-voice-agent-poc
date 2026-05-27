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
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Transcript</p>
        <textarea
          rows={16}
          value={transcriptText}
          onChange={(event) => onTranscriptChange(event.target.value)}
          placeholder="Generate a transcript, paste call notes, or start from a quick note."
          className="mt-4 w-full rounded-[1.5rem] border border-black/10 bg-sand-50 px-4 py-4 text-sm leading-6 text-ink-900 outline-none transition focus:border-sea-500"
        />
      </section>

      <section className="rounded-[2rem] bg-ink-950 p-6 text-white shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-400">Review checklist</p>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-sand-100/85">
          <li>Generate, paste, or type transcript text before extraction.</li>
          <li>Resolve missing property or contact matches in each draft card.</li>
          <li>Approve only after timing and participant fields look correct.</li>
        </ul>
        <button
          type="button"
          onClick={onApproveAll}
          disabled={!pendingDraftActionCount || isApprovingAll}
          className="mt-6 w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-ink-950 transition hover:bg-sand-100 disabled:opacity-60"
        >
          {isApprovingAll ? 'Approving...' : 'Approve all pending drafts'}
        </button>
      </section>
    </div>
  )
}
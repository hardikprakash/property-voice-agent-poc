type ReviewHeaderProps = {
  title: string
  captureSource?: string
  recordingStatus: string
  durationSeconds?: number | null
  feedback: string | null
  hasTranscript: boolean
  canGenerateTranscript: boolean
  isTranscribing: boolean
  isSavingTranscript: boolean
  isExtracting: boolean
  onTranscribe: () => void
  onSaveTranscript: () => void
  onExtract: () => void
}

export function ReviewHeader({
  title,
  captureSource,
  recordingStatus,
  durationSeconds,
  feedback,
  hasTranscript,
  canGenerateTranscript,
  isTranscribing,
  isSavingTranscript,
  isExtracting,
  onTranscribe,
  onSaveTranscript,
  onExtract,
}: ReviewHeaderProps) {
  return (
    <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">{captureSource === 'text_note' ? 'Quick note' : 'Recording'}</p>
          <h3 className="mt-3 text-2xl font-semibold text-ink-950">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-ink-700">
            Current status: <span className="font-medium">{recordingStatus}</span>
          </p>
          {durationSeconds ? <p className="mt-1 text-xs text-ink-500">Duration {durationSeconds} seconds</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canGenerateTranscript ? (
            <button
              type="button"
              onClick={onTranscribe}
              disabled={isTranscribing}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-sand-100 disabled:opacity-60"
            >
              {isTranscribing ? 'Generating...' : hasTranscript ? 'Refresh transcript' : 'Generate transcript'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSaveTranscript}
            disabled={!hasTranscript || isSavingTranscript}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-sand-100 disabled:opacity-60"
          >
            Save transcript
          </button>
          <button
            type="button"
            onClick={onExtract}
            disabled={!hasTranscript || isExtracting}
            className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-900 disabled:opacity-60"
          >
            {isExtracting ? 'Extracting...' : 'Extract draft actions'}
          </button>
        </div>
      </div>
      {feedback ? <p className="mt-4 rounded-2xl bg-sand-100 px-4 py-3 text-sm text-ink-700">{feedback}</p> : null}
    </section>
  )
}
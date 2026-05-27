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
    <section className="app-surface rounded-[1.65rem] p-5 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">{captureSource === 'text_note' ? 'Quick note' : 'Recording'}</p>
          <h3 className="text-[1.65rem] font-semibold tracking-[-0.03em] text-ink-950">{title}</h3>
          <p className="text-sm leading-6 text-ink-700">
            Current status: <span className="font-medium">{recordingStatus}</span>
          </p>
          {durationSeconds ? <p className="text-xs text-ink-500">Duration {durationSeconds} seconds</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canGenerateTranscript ? (
            <button
              type="button"
              onClick={onTranscribe}
              disabled={isTranscribing}
              className="app-button-secondary px-4 py-2 disabled:opacity-60"
            >
              {isTranscribing ? 'Generating...' : hasTranscript ? 'Refresh Transcript' : 'Generate Transcript'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSaveTranscript}
            disabled={!hasTranscript || isSavingTranscript}
            className="app-button-secondary px-4 py-2 disabled:opacity-60"
          >
            Save Transcript
          </button>
          <button
            type="button"
            onClick={onExtract}
            disabled={!hasTranscript || isExtracting}
            className="app-button-primary px-4 py-2 disabled:opacity-60"
          >
            {isExtracting ? 'Extracting...' : 'Extract Draft Actions'}
          </button>
        </div>
      </div>
      {feedback ? <p className="app-surface-muted mt-4 rounded-2xl px-4 py-3 text-sm text-ink-700">{feedback}</p> : null}
    </section>
  )
}
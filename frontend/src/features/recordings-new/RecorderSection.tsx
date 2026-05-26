type RecorderSectionProps = {
  isRecording: boolean
  isUploading: boolean
  recorderError: string | null
  previewUrl: string | null
  hasRecordedBlob: boolean
  onStart: () => void
  onStop: () => void
  onUpload: () => void
}

export function RecorderSection({
  isRecording,
  isUploading,
  recorderError,
  previewUrl,
  hasRecordedBlob,
  onStart,
  onStop,
  onUpload,
}: RecorderSectionProps) {
  return (
    <section className="rounded-[2rem] bg-ink-950 p-6 text-white shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-400">Capture</p>
      <h3 className="mt-3 text-2xl font-semibold">Prominent recorder surface</h3>
      <p className="mt-3 text-sm leading-6 text-sand-100/80">
        Mobile browsers can record directly here. Once the clip is uploaded, the review screen lets you generate or edit the transcript and approve actions.
      </p>
      <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">Browser recording</p>
            <p className="mt-1 text-xs text-sand-100/70">One tap to start, one tap to stop, then upload into the review flow.</p>
          </div>
          {isRecording ? (
            <button type="button" onClick={onStop} className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white">
              Stop
            </button>
          ) : (
            <button type="button" onClick={onStart} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-950">
              Start
            </button>
          )}
        </div>
        {recorderError ? <p className="mt-4 rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-100">{recorderError}</p> : null}
        {hasRecordedBlob && previewUrl ? (
          <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <audio controls className="w-full" src={previewUrl} />
            <button
              type="button"
              onClick={onUpload}
              disabled={isUploading}
              className="w-full rounded-2xl bg-sea-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-sea-600 disabled:opacity-60"
            >
              {isUploading ? 'Uploading...' : 'Upload recorded clip'}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
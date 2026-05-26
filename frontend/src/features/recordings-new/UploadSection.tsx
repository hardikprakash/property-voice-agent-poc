type UploadSectionProps = {
  durationSeconds: string
  error: string | null
  isUploading: boolean
  onFileChange: (file: File | null) => void
  onDurationChange: (value: string) => void
  onSubmit: () => void
}

export function UploadSection({
  durationSeconds,
  error,
  isUploading,
  onFileChange,
  onDurationChange,
  onSubmit,
}: UploadSectionProps) {
  return (
    <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Upload audio</p>
      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink-700">Audio file</span>
          <input
            type="file"
            accept="audio/*"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className="w-full rounded-2xl border border-dashed border-black/15 bg-sand-50 px-4 py-4 text-sm text-ink-700"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink-700">Duration seconds</span>
          <input
            value={durationSeconds}
            onChange={(event) => onDurationChange(event.target.value)}
            inputMode="numeric"
            placeholder="Optional"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-ink-900 outline-none transition focus:border-sea-500"
          />
        </label>

        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        <button
          type="submit"
          disabled={isUploading}
          className="w-full rounded-2xl bg-ink-950 px-4 py-3 text-base font-medium text-white transition hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? 'Uploading...' : 'Upload and review'}
        </button>
      </form>
    </section>
  )
}
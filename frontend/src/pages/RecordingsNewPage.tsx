import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiFetch } from '../lib/api'
import { PageFrame } from '../layout/PageFrame'
import type { AudioRecordingRead } from '../types'

export function RecordingsNewPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [durationSeconds, setDurationSeconds] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) {
      setError('Choose an audio file first.')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (durationSeconds.trim()) {
        formData.append('duration_seconds', durationSeconds.trim())
      }

      const recording = await apiFetch<AudioRecordingRead>('/api/recordings/upload', {
        method: 'POST',
        body: formData,
      })
      navigate(`/recordings/${recording.id}/review`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <PageFrame
      title="Recordings"
      subtitle="Browser recording starts here, but file upload is ready first so the workflow can be exercised immediately."
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] bg-ink-950 p-6 text-white shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-400">Capture</p>
          <h3 className="mt-3 text-2xl font-semibold">Prominent recorder surface</h3>
          <p className="mt-3 text-sm leading-6 text-sand-100/80">
            The browser microphone control will live here next. For now, the upload path lets the backend recording store and review flow get exercised end to end.
          </p>
          <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Browser recording</p>
                <p className="mt-1 text-xs text-sand-100/70">Ready for MediaRecorder wiring in the next pass.</p>
              </div>
              <button type="button" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-950">
                Start
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Upload audio</p>
          <form className="mt-4 space-y-4" onSubmit={handleUpload}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Audio file</span>
              <input
                type="file"
                accept="audio/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-2xl border border-dashed border-black/15 bg-sand-50 px-4 py-4 text-sm text-ink-700"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Duration seconds</span>
              <input
                value={durationSeconds}
                onChange={(event) => setDurationSeconds(event.target.value)}
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
      </div>
    </PageFrame>
  )
}

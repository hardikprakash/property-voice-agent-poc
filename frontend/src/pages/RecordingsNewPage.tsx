import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { useRecordingCapture } from '../features/recordings-new/useRecordingCapture'
import { apiFetch } from '../lib/api'
import { formatDateTimeLabel } from '../lib/datetime'
import type { CalendarEventRead } from '../types'

function isToday(value?: string | null): boolean {
  if (!value) {
    return false
  }

  const target = new Date(value)
  const now = new Date()
  return target.getFullYear() === now.getFullYear() && target.getMonth() === now.getMonth() && target.getDate() === now.getDate()
}

export function RecordingsNewPage() {
  const capture = useRecordingCapture()
  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: () => apiFetch<CalendarEventRead[]>('/api/events'),
  })

  const todaysPendingEvents = (eventsQuery.data ?? [])
    .filter((event) => event.status !== 'done' && isToday(event.starts_at ?? event.due_at ?? event.created_at))
    .sort((left, right) => {
      const leftValue = left.starts_at ?? left.due_at ?? left.created_at
      const rightValue = right.starts_at ?? right.due_at ?? right.created_at
      return new Date(leftValue).getTime() - new Date(rightValue).getTime()
    })

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md flex-col items-center justify-start px-2 py-4">
      <div className="flex w-full flex-1 flex-col items-center gap-10 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-ink-950 sm:text-5xl">Forget Nothing.</h1>
          <p className="mx-auto max-w-[18rem] text-sm leading-6 text-ink-700">
            Record after a call, upload audio, or jot a quick note. The draft-action review flow starts right after capture.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-5">
          <div className="relative flex h-44 w-44 items-center justify-center">
            <div className="absolute h-36 w-36 animate-pulse rounded-full bg-sea-500/10" />
            <div className="absolute h-32 w-32 rounded-full bg-sea-500/5" />
            <button
              type="button"
              onClick={() => {
                if (capture.isRecording) {
                  capture.stopRecording()
                  return
                }
                void capture.startRecording()
              }}
              className={[
                'relative z-10 flex h-32 w-32 items-center justify-center rounded-full border border-black/5 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition active:scale-[0.98]',
                capture.isRecording ? 'ring-8 ring-rose-400/15' : 'hover:-translate-y-0.5',
              ].join(' ')}
              aria-label={capture.isRecording ? 'Stop recording' : 'Start recording'}
            >
              <svg viewBox="0 0 24 24" className={capture.isRecording ? 'h-12 w-12 text-rose-500' : 'h-12 w-12 text-sea-600'} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-ink-600">{capture.isRecording ? 'Tap again to stop' : 'Tap to record'}</p>

          <div className="w-full max-w-sm space-y-3">
            <label className="block cursor-pointer rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-ink-700 transition hover:bg-sand-50">
              <span className="font-medium text-ink-900">or upload an existing file</span>
              <input
                type="file"
                accept="audio/*"
                onChange={(event) => capture.setFile(event.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
            {capture.file ? <p className="text-xs text-ink-500">Selected: {capture.file.name}</p> : null}
            {capture.file ? (
              <button
                type="button"
                onClick={() => {
                  void capture.uploadSelectedFile()
                }}
                disabled={capture.isUploading}
                className="w-full rounded-2xl bg-ink-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-ink-900 disabled:opacity-60"
              >
                {capture.isUploading ? 'Uploading...' : 'Upload and review'}
              </button>
            ) : null}
          </div>

          <div className="w-full max-w-sm rounded-[2rem] border border-black/5 bg-white p-4 text-left shadow-soft">
            <p className="text-sm font-medium text-ink-950">Need to move faster?</p>
            <p className="mt-1 text-xs leading-5 text-ink-500">Type the key call notes here and skip the transcription step.</p>
            <textarea
              rows={6}
              value={capture.noteText}
              onChange={(event) => capture.setNoteText(event.target.value)}
              placeholder="Example: Maya wants to visit Harbor House on Friday at 3pm. Follow up in 2 days about documents."
              className="mt-4 w-full rounded-[1.5rem] border border-black/10 bg-sand-50 px-4 py-4 text-sm leading-6 text-ink-900 outline-none transition focus:border-sea-500"
            />
            <button
              type="button"
              onClick={() => {
                void capture.createQuickNote()
              }}
              disabled={capture.isCreatingNote}
              className="mt-4 w-full rounded-2xl bg-ember-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-ember-600 disabled:opacity-60"
            >
              {capture.isCreatingNote ? 'Saving note...' : 'Save note and review'}
            </button>
          </div>

          <section className="w-full rounded-[2rem] border border-black/5 bg-white/90 p-5 text-left shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Today</p>
                <h2 className="mt-2 text-xl font-semibold text-ink-950">Pending events</h2>
              </div>
              <Link to="/calendar" className="rounded-full bg-sand-100 px-3 py-2 text-xs font-medium text-ink-700 transition hover:bg-sand-200">
                Open events
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {todaysPendingEvents.length ? (
                todaysPendingEvents.slice(0, 3).map((event) => (
                  <article key={event.id} className="rounded-[1.5rem] bg-sand-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-ink-950">{event.title}</p>
                        <p className="mt-1 text-xs text-ink-600">{formatDateTimeLabel(event.starts_at ?? event.due_at ?? event.created_at)}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-ink-700">{event.event_type.replace('_', ' ')}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-sand-50 px-4 py-5 text-sm text-ink-700">
                  No pending events for today yet.
                </div>
              )}
            </div>
          </section>

          {capture.recorderError ? <p className="w-full rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{capture.recorderError}</p> : null}
          {capture.error ? <p className="w-full rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{capture.error}</p> : null}

          {capture.recordedBlob && capture.previewUrl ? (
            <div className="w-full rounded-[2rem] border border-black/5 bg-white p-4 text-left shadow-soft">
              <p className="text-sm font-medium text-ink-950">Ready to review</p>
              <p className="mt-1 text-xs text-ink-500">{capture.durationSeconds ? `${capture.durationSeconds}s captured` : 'Recorded in browser'}</p>
              <audio controls className="mt-4 w-full" src={capture.previewUrl} />
              <button
                type="button"
                onClick={() => {
                  void capture.uploadRecordedClip()
                }}
                disabled={capture.isUploading}
                className="mt-4 w-full rounded-2xl bg-sea-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-sea-600 disabled:opacity-60"
              >
                {capture.isUploading ? 'Uploading...' : 'Upload recorded clip'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

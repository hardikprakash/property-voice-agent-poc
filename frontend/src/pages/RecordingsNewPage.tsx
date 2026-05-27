import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useRecordingCapture } from '../features/recordings-new/useRecordingCapture'
import { apiFetch } from '../lib/api'
import type { CalendarEventRead } from '../types'

export function RecordingsNewPage() {
  const capture = useRecordingCapture()
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false)
  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: () => apiFetch<CalendarEventRead[]>('/api/events'),
  })

  const pendingTaskCount = (eventsQuery.data ?? []).filter((event) => event.status !== 'done').length

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-lg flex-col items-center justify-start px-1 py-3">
      <div className="flex w-full flex-1 flex-col items-center gap-7 text-center">
        <p className="mx-auto max-w-[23rem] text-sm leading-6 text-ink-600">
          Record after a call, upload audio, or jot a quick note. Actions will be drafted automatically.
        </p>

        <section className="app-surface-muted flex w-full max-w-sm items-center justify-between gap-3 rounded-[1.3rem] px-4 py-3 text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(47,143,134,0.12)] text-sea-700">
              <TaskListIcon />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sea-600">Tasks</p>
              <p className="text-sm text-ink-900">{pendingTaskCount} pending {pendingTaskCount === 1 ? 'task' : 'tasks'}</p>
            </div>
          </div>
        </section>

        <div className="flex w-full flex-col items-center gap-4">
          <div className="relative flex h-40 w-40 items-center justify-center">
            <div className="absolute h-32 w-32 animate-pulse rounded-full bg-sea-500/8" />
            <div className="absolute h-28 w-28 rounded-full bg-sea-500/5" />
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
                'app-surface relative z-10 flex h-28 w-28 items-center justify-center rounded-full transition active:scale-[0.98]',
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

          <p className="-mt-1 text-xs text-ink-500">{capture.isRecording ? 'Tap again to stop' : 'Tap to record'}</p>

          <div className="w-full max-w-sm space-y-3">
            <label className="app-surface-muted block cursor-pointer rounded-[1.35rem] border-dashed px-4 py-4 text-sm text-ink-700 transition hover:bg-[#f4efe5]">
              <span className="flex items-center gap-2 text-ink-800">
                <PaperclipIcon />
                <span>or upload an existing file</span>
              </span>
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
                className="app-button-primary w-full px-4 py-3 disabled:opacity-60"
              >
                {capture.isUploading ? 'Uploading...' : 'Upload and review'}
              </button>
            ) : null}
          </div>

          <section className="app-surface w-full max-w-sm rounded-[1.65rem] text-left">
            <button
              type="button"
              onClick={() => setIsQuickNoteOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-ink-900"
            >
              <span className="text-sm text-ink-900">Or write a quick note instead</span>
              <span className={[
                'flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(47,143,134,0.1)] text-sea-700 transition',
                isQuickNoteOpen ? 'rotate-180' : '',
              ].join(' ')}>
                <ChevronDownIcon />
              </span>
            </button>

            {isQuickNoteOpen ? (
              <div className="border-t border-black/5 px-4 pb-4">
                <textarea
                  rows={6}
                  value={capture.noteText}
                  onChange={(event) => capture.setNoteText(event.target.value)}
                  placeholder="Example: Maya wants to visit Harbor House on Friday at 3pm. Follow up in 2 days about documents."
                  className="app-input mt-4 min-h-[9.5rem] bg-[#fbfaf6] leading-6"
                />
                <button
                  type="button"
                  onClick={() => {
                    void capture.createQuickNote()
                  }}
                  disabled={capture.isCreatingNote}
                  className="app-button-primary mt-4 w-full px-4 py-3 disabled:opacity-60"
                >
                  {capture.isCreatingNote ? 'Saving note...' : 'Save note and review'}
                </button>
              </div>
            ) : null}
          </section>

          {capture.recorderError ? <p className="w-full rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{capture.recorderError}</p> : null}
          {capture.error ? <p className="w-full rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{capture.error}</p> : null}

          {capture.recordedBlob && capture.previewUrl ? (
            <div className="app-surface w-full rounded-[1.65rem] p-4 text-left">
              <p className="text-sm font-medium text-ink-950">Ready to review</p>
              <p className="mt-1 text-xs text-ink-500">{capture.durationSeconds ? `${capture.durationSeconds}s captured` : 'Recorded in browser'}</p>
              <audio controls className="mt-4 w-full" src={capture.previewUrl} />
              <button
                type="button"
                onClick={() => {
                  void capture.uploadRecordedClip()
                }}
                disabled={capture.isUploading}
                className="app-button-primary mt-4 w-full px-4 py-3 disabled:opacity-60"
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

function TaskListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="m3.5 6 1.5 1.5L7.5 5" />
      <path d="m3.5 12 1.5 1.5L7.5 11" />
      <path d="m3.5 18 1.5 1.5L7.5 17" />
    </svg>
  )
}

function PaperclipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-8.49 8.49a5.5 5.5 0 0 1-7.78-7.78l8.5-8.49a3.5 3.5 0 0 1 4.95 4.95l-8.5 8.49a1.5 1.5 0 1 1-2.12-2.12l7.78-7.78" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

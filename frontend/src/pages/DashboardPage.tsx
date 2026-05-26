import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { apiFetch } from '../lib/api'
import { PageFrame } from '../layout/PageFrame'
import { formatDateTimeLabel } from '../lib/datetime'
import type { AudioRecordingRead, CalendarEventRead } from '../types'

export function DashboardPage() {
  const recordingsQuery = useQuery({
    queryKey: ['recordings'],
    queryFn: () => apiFetch<AudioRecordingRead[]>('/api/recordings'),
  })

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: () => apiFetch<CalendarEventRead[]>('/api/events'),
  })

  const recentRecordings = recordingsQuery.data?.slice(0, 3) ?? []
  const upcomingEvents = [...(eventsQuery.data ?? [])]
    .sort((left, right) => {
      const leftValue = left.starts_at ?? left.due_at ?? left.created_at
      const rightValue = right.starts_at ?? right.due_at ?? right.created_at
      return new Date(leftValue).getTime() - new Date(rightValue).getTime()
    })
    .slice(0, 4)

  return (
    <PageFrame
      title="Dashboard"
      subtitle="Operational home for the broker workflow. Quick actions stay within one tap of the review path."
    >
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-[2rem] bg-ink-950 p-6 text-white shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-400">Primary action</p>
          <h3 className="mt-3 text-2xl font-semibold">Record or upload a call</h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-sand-100/80">
            Capture the conversation first, then let the transcript and draft-action review flow sort out the follow-up work.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/recordings/new" className="rounded-full bg-sea-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-sea-600">
              Start a recording
            </Link>
            <Link to="/calendar" className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10">
              Open calendar
            </Link>
          </div>
        </section>

        <div className="grid gap-4">
          <section className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Recent recordings</p>
            <div className="mt-4 space-y-3 text-sm text-ink-700">
              {recentRecordings.length ? (
                recentRecordings.map((recording) => (
                  <Link
                    key={recording.id}
                    to={`/recordings/${recording.id}/review`}
                    className="block rounded-2xl bg-sand-50 px-4 py-3 transition hover:bg-sand-100"
                  >
                    <p className="font-medium text-ink-950">{recording.original_filename}</p>
                    <p className="mt-1 text-xs text-ink-600">
                      {recording.capture_source.replace('_', ' ')} · {recording.processing_status} · {formatDateTimeLabel(recording.created_at)}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl bg-sand-50 px-4 py-3">No recordings yet. Upload or record your first call.</div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-500">Upcoming events</p>
            <div className="mt-4 space-y-3 text-sm text-ink-700">
              {upcomingEvents.length ? (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="rounded-2xl bg-sand-50 px-4 py-3">
                    <p className="font-medium text-ink-950">{event.title}</p>
                    <p className="mt-1 text-xs text-ink-600">
                      {event.event_type} · {formatDateTimeLabel(event.starts_at ?? event.due_at ?? event.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-sand-50 px-4 py-3">Approved events will appear here once draft actions are reviewed.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </PageFrame>
  )
}

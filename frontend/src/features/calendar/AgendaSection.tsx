import { formatDateTimeLabel } from '../../lib/datetime'
import type { CalendarEventRead } from '../../types'

type AgendaSectionProps = {
  agenda: CalendarEventRead[]
  onDelete: (eventId: string) => void
}

export function AgendaSection({ agenda, onDelete }: AgendaSectionProps) {
  return (
    <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Agenda</p>
      <div className="mt-4 space-y-3 text-sm text-ink-700">
        {agenda.length ? (
          agenda.map((event) => (
            <div key={event.id} className="rounded-2xl bg-sand-50 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink-950">{event.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-500">{event.event_type}</p>
                  <p className="mt-2 text-sm text-ink-700">{formatDateTimeLabel(event.starts_at ?? event.due_at ?? event.created_at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(event.id)}
                  className="rounded-full border border-black/10 px-3 py-2 text-xs font-medium text-ink-700 transition hover:bg-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-sand-50 px-4 py-3">No events yet. Add a manual event or approve a draft action from a recording.</div>
        )}
      </div>
    </section>
  )
}
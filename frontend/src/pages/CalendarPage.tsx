import { PageFrame } from '../layout/PageFrame'

export function CalendarPage() {
  return (
    <PageFrame
      title="Calendar"
      subtitle="Agenda comes first on mobile, with month view as a secondary planning aid once the workflow matures."
    >
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Agenda</p>
          <div className="mt-4 space-y-3 text-sm text-ink-700">
            <div className="rounded-2xl bg-sand-50 px-4 py-3">Upcoming approved events will stack here.</div>
            <div className="rounded-2xl bg-sand-50 px-4 py-3">Task-like follow-ups will appear alongside scheduled visits.</div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-ink-950 p-6 text-white shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-400">Calendar mode</p>
          <h3 className="mt-3 text-2xl font-semibold">Agenda-first by default</h3>
          <p className="mt-3 text-sm leading-6 text-sand-100/80">
            The mobile experience will favor a compact task feed and one-handed editing over a dense grid.
          </p>
        </section>
      </div>
    </PageFrame>
  )
}

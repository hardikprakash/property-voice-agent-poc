import { Link } from 'react-router-dom'

import { PageFrame } from '../layout/PageFrame'

export function DashboardPage() {
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
              <div className="rounded-2xl bg-sand-50 px-4 py-3">No recordings yet. Upload or record your first call.</div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-500">Upcoming events</p>
            <div className="mt-4 space-y-3 text-sm text-ink-700">
              <div className="rounded-2xl bg-sand-50 px-4 py-3">Agenda view will show approved events here.</div>
            </div>
          </section>
        </div>
      </div>
    </PageFrame>
  )
}

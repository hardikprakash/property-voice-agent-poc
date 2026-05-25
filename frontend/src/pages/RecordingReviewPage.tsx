import { useParams } from 'react-router-dom'

import { PageFrame } from '../layout/PageFrame'

export function RecordingReviewPage() {
  const { recordingId } = useParams()

  return (
    <PageFrame
      title="Review"
      subtitle="This screen will eventually show the transcript, extracted draft actions, and the approve-or-edit workflow for one call at a time."
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Recording</p>
          <h3 className="mt-3 text-2xl font-semibold text-ink-950">{recordingId}</h3>
          <p className="mt-3 text-sm leading-6 text-ink-700">
            Transcript persistence and draft-action extraction are wired later. The current backend surface is ready for the review layer to land on top.
          </p>
        </section>

        <section className="rounded-[2rem] bg-ink-950 p-6 text-white shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-400">Review checklist</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-sand-100/85">
            <li>Transcript text is visible and editable.</li>
            <li>Draft actions can be approved one by one or in bulk.</li>
            <li>Unresolved property or contact matches stay explicit.</li>
          </ul>
        </section>
      </div>
    </PageFrame>
  )
}

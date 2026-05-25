import { useParams } from 'react-router-dom'

import { PageFrame } from '../layout/PageFrame'

export function ContactDetailPage() {
  const { contactId } = useParams()

  return (
    <PageFrame
      title="Contact detail"
      subtitle="This page will host the manual contact editor and property-role links in the next pass."
    >
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-500">Contact ID</p>
        <h3 className="mt-3 text-2xl font-semibold text-ink-950">{contactId}</h3>
      </section>
    </PageFrame>
  )
}

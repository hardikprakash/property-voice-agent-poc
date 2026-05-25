import { useParams } from 'react-router-dom'

import { PageFrame } from '../layout/PageFrame'

export function PropertyDetailPage() {
  const { propertyId } = useParams()

  return (
    <PageFrame
      title="Property detail"
      subtitle="This page will carry the edit form and related contacts once the CRUD layer is wired through React Query."
    >
      <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Property ID</p>
        <h3 className="mt-3 text-2xl font-semibold text-ink-950">{propertyId}</h3>
      </section>
    </PageFrame>
  )
}

import { Link } from 'react-router-dom'

import { PageFrame } from '../layout/PageFrame'

export function PropertiesPage() {
  return (
    <PageFrame
      title="Properties"
      subtitle="Manual property management comes before the voice pipeline, because broker-owned records are the anchor for resolution later."
      action={
        <button type="button" className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-900">
          New property
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {['Harbor House', 'Willow Court', 'Sunset Residence'].map((name, index) => (
          <Link key={name} to={`/properties/property-${index + 1}`} className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-soft transition hover:-translate-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Property</p>
            <h3 className="mt-3 text-xl font-semibold text-ink-950">{name}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-700">Address, notes, and contact roles will be added in the next CRUD pass.</p>
          </Link>
        ))}
      </div>
    </PageFrame>
  )
}

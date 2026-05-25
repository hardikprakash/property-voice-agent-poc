import { Link } from 'react-router-dom'

import { PageFrame } from '../layout/PageFrame'

export function ContactsPage() {
  return (
    <PageFrame
      title="Contacts"
      subtitle="Contacts stay separate from properties and can carry broker-defined roles across different listings."
      action={
        <button type="button" className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-900">
          New contact
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {['Maya Alvarez', 'Ben Foster', 'Tia Morgan'].map((name, index) => (
          <Link key={name} to={`/contacts/contact-${index + 1}`} className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-soft transition hover:-translate-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-500">Contact</p>
            <h3 className="mt-3 text-xl font-semibold text-ink-950">{name}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-700">Phone, email, and property roles will be editable here.</p>
          </Link>
        ))}
      </div>
    </PageFrame>
  )
}

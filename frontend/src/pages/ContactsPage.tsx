import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch } from '../lib/api'
import { PageFrame } from '../layout/PageFrame'
import type { ContactRead } from '../types'

const emptyContactForm = {
  full_name: '',
  phone_number: '',
  email: '',
  notes: '',
}

export function ContactsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyContactForm)
  const [error, setError] = useState<string | null>(null)

  const contactsQuery = useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiFetch<ContactRead[]>('/api/contacts'),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<ContactRead>('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          phone_number: form.phone_number || null,
          email: form.email || null,
          notes: form.notes || null,
        }),
      }),
    onSuccess: () => {
      setForm(emptyContactForm)
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const contacts = contactsQuery.data ?? []

  return (
    <PageFrame
      title="Contacts"
      subtitle="Contacts stay separate from properties and can carry broker-defined roles across different listings."
      action={
        <a href="#new-contact" className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-900">
          New contact
        </a>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section id="new-contact" className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-500">New contact</p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              setError(null)
              createMutation.mutate(undefined, {
                onError: (submitError) => {
                  setError(submitError instanceof Error ? submitError.message : 'Could not create contact')
                },
              })
            }}
          >
            {[
              ['full_name', 'Full name'],
              ['phone_number', 'Phone number'],
              ['email', 'Email'],
            ].map(([key, label]) => (
              <label key={key} className="block space-y-2">
                <span className="text-sm font-medium text-ink-700">{label}</span>
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  value={form[key as keyof typeof form]}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-sea-500"
                />
              </label>
            ))}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Notes</span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-sea-500"
              />
            </label>
            {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-2xl bg-ink-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-ink-900 disabled:opacity-60"
            >
              {createMutation.isPending ? 'Saving...' : 'Create contact'}
            </button>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {contacts.length ? (
            contacts.map((contact) => (
              <Link
                key={contact.id}
                to={`/contacts/${contact.id}`}
                className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-soft transition hover:-translate-y-0.5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-500">Contact</p>
                <h3 className="mt-3 text-xl font-semibold text-ink-950">{contact.full_name}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-700">{contact.phone_number || contact.email || 'No contact details yet'}</p>
                <p className="mt-3 text-xs text-ink-500">Tap to edit the contact and review linked properties.</p>
              </Link>
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-black/10 bg-white/70 p-6 text-sm text-ink-700 md:col-span-2">
              No contacts yet. Add buyers or sellers before extracting actions from calls.
            </div>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

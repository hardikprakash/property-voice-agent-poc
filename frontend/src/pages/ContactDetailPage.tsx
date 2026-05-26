import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { apiFetch } from '../lib/api'
import { PageFrame } from '../layout/PageFrame'
import type { ContactRead, PropertyContactLinkRead, PropertyRead } from '../types'

export function ContactDetailPage() {
  const { contactId } = useParams()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ full_name: '', phone_number: '', email: '', notes: '' })
  const [feedback, setFeedback] = useState<string | null>(null)

  const contactQuery = useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => apiFetch<ContactRead>(`/api/contacts/${contactId}`),
    enabled: Boolean(contactId),
  })
  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiFetch<PropertyRead[]>('/api/properties'),
  })
  const linksQuery = useQuery({
    queryKey: ['contact-links', contactId],
    queryFn: () => apiFetch<PropertyContactLinkRead[]>(`/api/property-contact-links?contact_id=${contactId}`),
    enabled: Boolean(contactId),
  })

  useEffect(() => {
    if (!contactQuery.data) {
      return
    }
    setForm({
      full_name: contactQuery.data.full_name,
      phone_number: contactQuery.data.phone_number ?? '',
      email: contactQuery.data.email ?? '',
      notes: contactQuery.data.notes ?? '',
    })
  }, [contactQuery.data])

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch<ContactRead>(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...form,
          phone_number: form.phone_number || null,
          email: form.email || null,
          notes: form.notes || null,
        }),
      }),
    onSuccess: () => {
      setFeedback('Contact saved.')
      void queryClient.invalidateQueries({ queryKey: ['contacts'] })
      void queryClient.invalidateQueries({ queryKey: ['contact', contactId] })
    },
  })

  const propertyById = Object.fromEntries((propertiesQuery.data ?? []).map((property) => [property.id, property]))

  return (
    <PageFrame
      title="Contact detail"
      subtitle="Edit the contact and review which properties and roles this person is linked to."
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-500">Contact</p>
          <h3 className="mt-3 text-2xl font-semibold text-ink-950">{contactQuery.data?.full_name ?? contactId}</h3>
          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              setFeedback(null)
              saveMutation.mutate(undefined, {
                onError: (submitError) => {
                  setFeedback(submitError instanceof Error ? submitError.message : 'Could not save contact')
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
                rows={4}
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-sea-500"
              />
            </label>
            {feedback ? <p className="rounded-2xl bg-sand-100 px-4 py-3 text-sm text-ink-700">{feedback}</p> : null}
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full rounded-2xl bg-ink-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-ink-900 disabled:opacity-60"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save contact'}
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Linked properties</p>
          <div className="mt-4 space-y-3">
            {(linksQuery.data ?? []).length ? (
              (linksQuery.data ?? []).map((link) => (
                <div key={link.id} className="rounded-2xl bg-sand-50 px-4 py-3">
                  <p className="font-medium text-ink-950">{propertyById[link.property_id]?.title ?? link.property_id}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-500">{link.role}</p>
                  {link.notes ? <p className="mt-2 text-sm text-ink-700">{link.notes}</p> : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-sand-50 px-4 py-3 text-sm text-ink-700">No linked properties yet.</div>
            )}
          </div>
        </section>
      </div>
    </PageFrame>
  )
}

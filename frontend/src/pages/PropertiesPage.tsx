import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch } from '../lib/api'
import { PageFrame } from '../layout/PageFrame'
import type { PropertyRead } from '../types'

const emptyPropertyForm = {
  title: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  property_type: 'flat',
  notes: '',
  is_active: true,
}

export function PropertiesPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyPropertyForm)
  const [error, setError] = useState<string | null>(null)

  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiFetch<PropertyRead[]>('/api/properties'),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<PropertyRead>('/api/properties', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          address_line_2: form.address_line_2 || null,
          notes: form.notes || null,
        }),
      }),
    onSuccess: () => {
      setForm(emptyPropertyForm)
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })

  const properties = propertiesQuery.data ?? []

  return (
    <PageFrame
      title="Properties"
      subtitle="Manual property management comes before the voice pipeline, because broker-owned records are the anchor for resolution later."
      action={
        <a href="#new-property" className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-900">
          New property
        </a>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section id="new-property" className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">New property</p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              setError(null)
              createMutation.mutate(undefined, {
                onError: (submitError) => {
                  setError(submitError instanceof Error ? submitError.message : 'Could not create property')
                },
              })
            }}
          >
            {[
              ['title', 'Title'],
              ['address_line_1', 'Address line 1'],
              ['address_line_2', 'Address line 2'],
              ['city', 'City'],
              ['state', 'State'],
              ['postal_code', 'Postal code'],
              ['property_type', 'Property type'],
            ].map(([key, label]) => (
              <label key={key} className="block space-y-2">
                <span className="text-sm font-medium text-ink-700">{label}</span>
                <input
                  value={form[key as keyof typeof form] as string}
                  onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-sea-500"
                />
              </label>
            ))}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink-700">Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-sea-500"
              />
            </label>
            {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-2xl bg-ink-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-ink-900 disabled:opacity-60"
            >
              {createMutation.isPending ? 'Saving...' : 'Create property'}
            </button>
          </form>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {properties.length ? (
            properties.map((property) => (
              <Link
                key={property.id}
                to={`/properties/${property.id}`}
                className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-soft transition hover:-translate-y-0.5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Property</p>
                <h3 className="mt-3 text-xl font-semibold text-ink-950">{property.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-700">
                  {property.address_line_1}, {property.city} · {property.property_type}
                </p>
                <p className="mt-3 text-xs text-ink-500">Tap to edit details and manage buyer or seller links.</p>
              </Link>
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-black/10 bg-white/70 p-6 text-sm text-ink-700 md:col-span-2">
              No properties yet. Create the first listing before reviewing calls.
            </div>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

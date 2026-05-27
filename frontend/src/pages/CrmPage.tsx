import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch } from '../lib/api'
import { PageFrame } from '../layout/PageFrame'
import type { ContactRead, PropertyContactLinkRead, PropertyRead } from '../types'

type CrmTab = 'properties' | 'buyers' | 'sellers'

const propertyFormInitial = {
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

const contactFormInitial = {
  full_name: '',
  phone_number: '',
  email: '',
  notes: '',
  property_id: '',
}

export function CrmPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<CrmTab>('properties')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [propertyForm, setPropertyForm] = useState(propertyFormInitial)
  const [contactForm, setContactForm] = useState(contactFormInitial)

  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiFetch<PropertyRead[]>('/api/properties'),
  })
  const contactsQuery = useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiFetch<ContactRead[]>('/api/contacts'),
  })
  const linksQuery = useQuery({
    queryKey: ['property-contact-links'],
    queryFn: () => apiFetch<PropertyContactLinkRead[]>('/api/property-contact-links'),
  })

  const createPropertyMutation = useMutation({
    mutationFn: () =>
      apiFetch<PropertyRead>('/api/properties', {
        method: 'POST',
        body: JSON.stringify({
          ...propertyForm,
          address_line_2: propertyForm.address_line_2 || null,
          notes: propertyForm.notes || null,
        }),
      }),
    onSuccess: async () => {
      setPropertyForm(propertyFormInitial)
      setError(null)
      setIsCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })

  const createContactMutation = useMutation({
    mutationFn: async () => {
      const contact = await apiFetch<ContactRead>('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({
          full_name: contactForm.full_name,
          phone_number: contactForm.phone_number || null,
          email: contactForm.email || null,
          notes: contactForm.notes || null,
        }),
      })

      if (contactForm.property_id) {
        await apiFetch<PropertyContactLinkRead>('/api/property-contact-links', {
          method: 'POST',
          body: JSON.stringify({
            property_id: contactForm.property_id,
            contact_id: contact.id,
            role: activeTab === 'buyers' ? 'buyer' : 'seller',
            notes: null,
          }),
        })
      }

      return contact
    },
    onSuccess: async () => {
      setContactForm(contactFormInitial)
      setError(null)
      setIsCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['contacts'] })
      await queryClient.invalidateQueries({ queryKey: ['property-contact-links'] })
    },
  })

  const properties = propertiesQuery.data ?? []
  const contacts = contactsQuery.data ?? []
  const links = linksQuery.data ?? []
  const propertyById = Object.fromEntries(properties.map((property) => [property.id, property]))
  const roleContactIds = new Set(
    links.filter((link) => link.role === (activeTab === 'buyers' ? 'buyer' : 'seller')).map((link) => link.contact_id)
  )
  const visibleContacts = contacts.filter((contact) => roleContactIds.has(contact.id))

  const submitCreate = () => {
    setError(null)
    if (activeTab === 'properties') {
      createPropertyMutation.mutate(undefined, {
        onError: (submitError) => {
          setError(submitError instanceof Error ? submitError.message : 'Could not create property')
        },
      })
      return
    }

    if (!contactForm.property_id) {
      setError(`Select a property before creating a ${activeTab === 'buyers' ? 'buyer' : 'seller'}.`)
      return
    }

    createContactMutation.mutate(undefined, {
      onError: (submitError) => {
        setError(submitError instanceof Error ? submitError.message : 'Could not create contact')
      },
    })
  }

  const tabButtonClass = (tab: CrmTab) =>
    [
      'px-4 py-2 text-sm',
      activeTab === tab ? 'app-button-primary' : 'app-button-secondary',
    ].join(' ')

  return (
    <>
      <PageFrame
        title="Resources"
        subtitle="Manage properties, buyers, and sellers in one place. Use the floating plus button to add whichever record the current tab needs."
      >
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => setActiveTab('properties')} className={tabButtonClass('properties')}>
            Properties
          </button>
          <button type="button" onClick={() => setActiveTab('buyers')} className={tabButtonClass('buyers')}>
            Buyers
          </button>
          <button type="button" onClick={() => setActiveTab('sellers')} className={tabButtonClass('sellers')}>
            Sellers
          </button>
        </div>

        {activeTab === 'properties' ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {properties.length ? (
              properties.map((property) => (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  className="app-surface rounded-[1.65rem] p-4 transition hover:-translate-y-0.5 sm:p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Property</p>
                  <h3 className="mt-2 text-xl font-semibold text-ink-950">{property.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-ink-700">
                    {property.address_line_1}, {property.city} · {property.property_type}
                  </p>
                  <p className="mt-2 text-xs text-ink-500">Tap to edit details and linked people.</p>
                </Link>
              ))
            ) : (
              <div className="app-surface-muted rounded-[1.65rem] border-dashed p-6 text-sm text-ink-700 md:col-span-2 xl:col-span-3">
                No properties yet. Add the first listing from the floating plus button.
              </div>
            )}
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleContacts.length ? (
              visibleContacts.map((contact) => {
                const relatedProperties = links
                  .filter((link) => link.contact_id === contact.id && link.role === (activeTab === 'buyers' ? 'buyer' : 'seller'))
                  .map((link) => propertyById[link.property_id]?.title)
                  .filter(Boolean)

                return (
                  <Link
                    key={contact.id}
                    to={`/contacts/${contact.id}`}
                    className="app-surface rounded-[1.65rem] p-4 transition hover:-translate-y-0.5 sm:p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-500">
                      {activeTab === 'buyers' ? 'Buyer' : 'Seller'}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-ink-950">{contact.full_name}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-ink-700">{contact.phone_number || contact.email || 'No contact details yet'}</p>
                    {relatedProperties.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {relatedProperties.map((title) => (
                          <span key={title} className="app-chip">
                            {title}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                )
              })
            ) : (
              <div className="app-surface-muted rounded-[1.65rem] border-dashed p-6 text-sm text-ink-700 md:col-span-2 xl:col-span-3">
                No {activeTab} yet. Add one from the floating plus button and optionally attach a property link immediately.
              </div>
            )}
          </section>
        )}
      </PageFrame>

      <button
        type="button"
        onClick={() => setIsCreateOpen(true)}
        className="app-button-primary fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center px-0 py-0 md:bottom-8"
        aria-label="Add new record"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-ink-950/35 p-4 md:items-center md:justify-center">
          <div className="app-surface max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-[1.8rem] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Create</p>
                <h3 className="text-[1.6rem] font-semibold tracking-[-0.03em] text-ink-950">
                  {activeTab === 'properties' ? 'New property' : `New ${activeTab === 'buyers' ? 'buyer' : 'seller'}`}
                </h3>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="app-button-ghost px-3 py-2 text-sm">
                Close
              </button>
            </div>

            <form
              className="mt-5 space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                submitCreate()
              }}
            >
              {activeTab === 'properties' ? (
                <>
                  {[
                    ['title', 'Title'],
                    ['address_line_1', 'Address line 1'],
                    ['address_line_2', 'Address line 2'],
                    ['city', 'City'],
                    ['state', 'State'],
                    ['postal_code', 'Postal code'],
                    ['property_type', 'Property type'],
                  ].map(([field, label]) => (
                    <label key={field} className="block space-y-2">
                      <span className="text-sm font-medium text-ink-700">{label}</span>
                      <input
                        value={propertyForm[field as keyof typeof propertyForm] as string}
                        onChange={(event) => setPropertyForm((current) => ({ ...current, [field]: event.target.value }))}
                        className="app-input"
                      />
                    </label>
                  ))}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Notes</span>
                    <textarea
                      rows={3}
                      value={propertyForm.notes}
                      onChange={(event) => setPropertyForm((current) => ({ ...current, notes: event.target.value }))}
                      className="app-input min-h-[7rem]"
                    />
                  </label>
                </>
              ) : (
                <>
                  {[
                    ['full_name', 'Full name'],
                    ['phone_number', 'Phone number'],
                    ['email', 'Email'],
                  ].map(([field, label]) => (
                    <label key={field} className="block space-y-2">
                      <span className="text-sm font-medium text-ink-700">{label}</span>
                      <input
                        type={field === 'email' ? 'email' : 'text'}
                        value={contactForm[field as keyof typeof contactForm] as string}
                        onChange={(event) => setContactForm((current) => ({ ...current, [field]: event.target.value }))}
                        className="app-input"
                      />
                    </label>
                  ))}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Property</span>
                    <select
                      value={contactForm.property_id}
                      onChange={(event) => setContactForm((current) => ({ ...current, property_id: event.target.value }))}
                      className="app-input"
                    >
                      <option value="">Select a property</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink-700">Notes</span>
                    <textarea
                      rows={3}
                      value={contactForm.notes}
                      onChange={(event) => setContactForm((current) => ({ ...current, notes: event.target.value }))}
                      className="app-input min-h-[7rem]"
                    />
                  </label>
                </>
              )}

              {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

              <button
                type="submit"
                disabled={createPropertyMutation.isPending || createContactMutation.isPending}
                className="app-button-primary w-full px-4 py-3 disabled:opacity-60"
              >
                {createPropertyMutation.isPending || createContactMutation.isPending ? 'Saving...' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
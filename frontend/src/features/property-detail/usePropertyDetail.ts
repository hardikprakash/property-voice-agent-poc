import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { apiFetch } from '../../lib/api'
import type { ContactRead, PropertyContactLinkRead, PropertyRead } from '../../types'

type PropertyForm = {
  title: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  postal_code: string
  property_type: string
  notes: string
}

type LinkForm = {
  contact_id: string
  role: string
  notes: string
}

const EMPTY_PROPERTY_FORM: PropertyForm = {
  title: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  property_type: '',
  notes: '',
}

const EMPTY_LINK_FORM: LinkForm = {
  contact_id: '',
  role: 'buyer',
  notes: '',
}

export function usePropertyDetail(propertyId?: string) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<PropertyForm>(EMPTY_PROPERTY_FORM)
  const [linkForm, setLinkForm] = useState<LinkForm>(EMPTY_LINK_FORM)
  const [feedback, setFeedback] = useState<string | null>(null)

  const propertyQuery = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => apiFetch<PropertyRead>(`/api/properties/${propertyId}`),
    enabled: Boolean(propertyId),
  })
  const contactsQuery = useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiFetch<ContactRead[]>('/api/contacts'),
  })
  const linksQuery = useQuery({
    queryKey: ['property-contact-links', propertyId],
    queryFn: () => apiFetch<PropertyContactLinkRead[]>(`/api/property-contact-links?property_id=${propertyId}`),
    enabled: Boolean(propertyId),
  })

  useEffect(() => {
    if (!propertyQuery.data) {
      return
    }

    setForm({
      title: propertyQuery.data.title,
      address_line_1: propertyQuery.data.address_line_1,
      address_line_2: propertyQuery.data.address_line_2 ?? '',
      city: propertyQuery.data.city,
      state: propertyQuery.data.state,
      postal_code: propertyQuery.data.postal_code,
      property_type: propertyQuery.data.property_type,
      notes: propertyQuery.data.notes ?? '',
    })
  }, [propertyQuery.data])

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch<PropertyRead>(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...form,
          address_line_2: form.address_line_2 || null,
          notes: form.notes || null,
        }),
      }),
    onSuccess: () => {
      setFeedback('Property saved.')
      void queryClient.invalidateQueries({ queryKey: ['properties'] })
      void queryClient.invalidateQueries({ queryKey: ['property', propertyId] })
    },
  })

  const createLinkMutation = useMutation({
    mutationFn: () =>
      apiFetch<PropertyContactLinkRead>('/api/property-contact-links', {
        method: 'POST',
        body: JSON.stringify({
          property_id: propertyId,
          contact_id: linkForm.contact_id,
          role: linkForm.role,
          notes: linkForm.notes || null,
        }),
      }),
    onSuccess: () => {
      setLinkForm(EMPTY_LINK_FORM)
      void queryClient.invalidateQueries({ queryKey: ['property-contact-links', propertyId] })
    },
  })

  const deleteLinkMutation = useMutation({
    mutationFn: (linkId: string) =>
      apiFetch<void>(`/api/property-contact-links/${linkId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['property-contact-links', propertyId] })
    },
  })

  const saveProperty = () => {
    setFeedback(null)
    saveMutation.mutate(undefined, {
      onError: (submitError) => {
        setFeedback(submitError instanceof Error ? submitError.message : 'Could not save property')
      },
    })
  }

  const contactById = Object.fromEntries((contactsQuery.data ?? []).map((contact) => [contact.id, contact]))

  return {
    property: propertyQuery.data,
    contacts: contactsQuery.data ?? [],
    links: linksQuery.data ?? [],
    contactById,
    form,
    linkForm,
    feedback,
    updateFormField: <K extends keyof PropertyForm>(field: K, value: PropertyForm[K]) => {
      setForm((current) => ({ ...current, [field]: value }))
    },
    updateLinkFormField: <K extends keyof LinkForm>(field: K, value: LinkForm[K]) => {
      setLinkForm((current) => ({ ...current, [field]: value }))
    },
    saveProperty,
    createLink: () => createLinkMutation.mutate(),
    deleteLink: (linkId: string) => deleteLinkMutation.mutate(linkId),
    isSaving: saveMutation.isPending,
    isCreatingLink: createLinkMutation.isPending,
  }
}
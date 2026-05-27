import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { apiFetch } from '../../lib/api'
import { fromDatetimeLocalInput } from '../../lib/datetime'
import type { CalendarEventRead, ContactRead, PropertyContactLinkRead, PropertyRead } from '../../types'

type EventForm = {
  title: string
  description: string
  event_type: string
  status: string
  property_id: string
  contact_id: string
  starts_at: string
  ends_at: string
  due_at: string
}

const EMPTY_EVENT_FORM: EventForm = {
  title: '',
  description: '',
  event_type: 'follow_up',
  status: 'pending',
  property_id: '',
  contact_id: '',
  starts_at: '',
  ends_at: '',
  due_at: '',
}

export function useCalendarPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<EventForm>(EMPTY_EVENT_FORM)
  const [error, setError] = useState<string | null>(null)

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: () => apiFetch<CalendarEventRead[]>('/api/events'),
  })
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

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch<CalendarEventRead>('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          event_type: form.event_type,
          status: form.status,
          property_id: form.property_id || null,
          contact_id: form.contact_id || null,
          starts_at: fromDatetimeLocalInput(form.starts_at),
          ends_at: fromDatetimeLocalInput(form.ends_at),
          due_at: fromDatetimeLocalInput(form.due_at),
          source: 'manual',
        }),
      }),
    onSuccess: () => {
      setForm(EMPTY_EVENT_FORM)
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => apiFetch<void>(`/api/events/${eventId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: Record<string, unknown> }) =>
      apiFetch<CalendarEventRead>(`/api/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const events = [...(eventsQuery.data ?? [])].sort((left, right) => {
    const leftValue = left.starts_at ?? left.due_at ?? left.created_at
    const rightValue = right.starts_at ?? right.due_at ?? right.created_at
    return new Date(leftValue).getTime() - new Date(rightValue).getTime()
  })

  const createEvent = (options?: { onSuccess?: () => void }) => {
    setError(null)
    createMutation.mutate(undefined, {
      onSuccess: () => {
        options?.onSuccess?.()
      },
      onError: (submitError) => {
        setError(submitError instanceof Error ? submitError.message : 'Could not create event')
      },
    })
  }

  return {
    events,
    properties: propertiesQuery.data ?? [],
    contacts: contactsQuery.data ?? [],
    links: linksQuery.data ?? [],
    form,
    error,
    resetForm: () => setForm(EMPTY_EVENT_FORM),
    updateFormField: <K extends keyof EventForm>(field: K, value: EventForm[K]) => {
      setForm((current) => ({ ...current, [field]: value }))
    },
    createEvent,
    updateEvent: (eventId: string, payload: Record<string, unknown>) => updateMutation.mutate({ eventId, payload }),
    deleteEvent: (eventId: string) => deleteMutation.mutate(eventId),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  }
}
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useCalendarPage } from '../features/calendar/useCalendarPage'
import { formatDateTimeLabel } from '../lib/datetime'
import type { CalendarEventRead } from '../types'
import { PageFrame } from '../layout/PageFrame'

type StatusFilter = 'open' | 'complete' | 'all'

export function CalendarPage() {
  const calendar = useCalendarPage()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open')
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const propertyById = Object.fromEntries(calendar.properties.map((property) => [property.id, property]))
  const contactById = Object.fromEntries(calendar.contacts.map((contact) => [contact.id, contact]))
  const roleByPair = new Map(calendar.links.map((link) => [`${link.property_id}:${link.contact_id}`, link.role]))
  const monthKey = formatMonthKey(currentMonth)
  const openCalendarEvents = calendar.events.filter((event) => event.status !== 'done')
  const filteredEvents = calendar.events.filter((event) => {
    if (statusFilter === 'all') {
      return true
    }
    if (statusFilter === 'complete') {
      return event.status === 'done'
    }
    return event.status !== 'done'
  })
  const listEvents = filteredEvents.filter((event) => {
    if (!dateFilter) {
      return true
    }
    return toDateInputValue(event.starts_at ?? event.due_at ?? event.created_at) === dateFilter
  })
  const monthEvents = openCalendarEvents.filter((event) => formatMonthKey(new Date(event.starts_at ?? event.due_at ?? event.created_at)) === monthKey)
  const dayEvents = selectedDate
    ? openCalendarEvents.filter((event) => toDateInputValue(event.starts_at ?? event.due_at ?? event.created_at) === selectedDate)
    : []
  const dayEventMap = new Map<string, CalendarEventRead[]>()
  for (const event of monthEvents) {
    const dateKey = toDateInputValue(event.starts_at ?? event.due_at ?? event.created_at)
    const existing = dayEventMap.get(dateKey)
    if (existing) {
      existing.push(event)
    } else {
      dayEventMap.set(dateKey, [event])
    }
  }
  const calendarDays = buildCalendarDays(currentMonth)

  return (
    <>
      <PageFrame
        title="Events"
      >
        <section className="app-surface mt-1 rounded-[1.75rem] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentMonth((current) => addMonths(current, -1))}
              className="app-button-ghost flex h-11 w-11 items-center justify-center px-0 py-0"
              aria-label="Previous month"
            >
              <ChevronLeftIcon />
            </button>
            <div className="space-y-1 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Calendar</p>
              <h2 className="text-xl font-semibold text-ink-950">{new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(currentMonth)}</h2>
            </div>
            <button
              type="button"
              onClick={() => setCurrentMonth((current) => addMonths(current, 1))}
              className="app-button-ghost flex h-11 w-11 items-center justify-center px-0 py-0"
              aria-label="Next month"
            >
              <ChevronRightIcon />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateKey = toDateInputValue(day)
              const eventsForDay = dayEventMap.get(dateKey) ?? []
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
              const isTodayCell = dateKey === toDateInputValue(new Date())
              const isSelected = selectedDate === dateKey

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(dateKey)}
                  className={[
                    'relative aspect-square rounded-[0.95rem] border text-center transition',
                    isCurrentMonth ? 'border-black/5 bg-white/88 text-ink-900' : 'border-transparent bg-transparent text-ink-400',
                    isTodayCell ? 'ring-2 ring-ink-950/10' : '',
                    isSelected ? 'border-sea-400 bg-[rgba(47,143,134,0.08)] text-sea-800' : '',
                    isCurrentMonth ? 'hover:border-sea-300 hover:bg-[#f8f5ee]' : 'hover:bg-[rgba(255,255,255,0.35)]',
                  ].join(' ')}
                >
                  <span className="flex h-full items-center justify-center text-sm font-semibold">{day.getDate()}</span>
                  {eventsForDay.length ? <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-sea-500" /> : null}
                </button>
              )
            })}
          </div>

          <section className="mt-4 rounded-[1.35rem] border border-black/5 bg-[rgba(255,255,255,0.58)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Selected day</p>
                <h3 className="text-base font-semibold text-ink-950">{selectedDate ? formatDayHeading(selectedDate) : 'Select a day'}</h3>
              </div>
              {selectedDate ? (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="app-button-secondary px-3 py-2 text-sm"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="mt-3 h-52 overflow-y-auto pr-1">
              {selectedDate ? (
                dayEvents.length ? (
                  <div className="space-y-2.5">
                    {dayEvents.map((event) => (
                      <article key={event.id} className="app-surface-muted rounded-[1.1rem] px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-medium text-ink-950">{event.title}</h4>
                          <p className="shrink-0 text-xs text-ink-500">{formatCompactTime(event.starts_at ?? event.due_at ?? event.created_at)}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-[1.1rem] border border-dashed border-black/10 bg-[rgba(255,255,255,0.45)] px-4 text-sm text-ink-600">
                    No events are available for this day.
                  </div>
                )
              ) : (
                <div className="flex h-full items-center justify-center rounded-[1.1rem] border border-dashed border-black/10 bg-[rgba(255,255,255,0.45)] px-4 text-sm text-ink-600">
                  Select a day to view its events.
                </div>
              )}
            </div>
          </section>
        </section>

        <section className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              ['open', 'Open'],
              ['complete', 'Complete'],
              ['all', 'All'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value as StatusFilter)}
                className={[
                  'rounded-[1rem] px-4 py-2 text-sm',
                  statusFilter === value ? 'app-button-primary' : 'app-button-secondary',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="app-input max-w-[12rem] rounded-[1rem] px-4 py-2 text-sm"
              aria-label="Filter events by date"
            />
          </div>

          <div className="space-y-3">
            {listEvents.length ? (
              listEvents.map((event) => {
                const property = event.property_id ? propertyById[event.property_id] : null
                const contact = event.contact_id ? contactById[event.contact_id] : null
                const role = event.property_id && event.contact_id ? roleByPair.get(`${event.property_id}:${event.contact_id}`) : null

                return (
                  <article key={event.id} className="app-surface cursor-default rounded-[1.65rem] p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sea-600">{event.event_type.replace('_', ' ')}</p>
                        <h3 className="mt-1.5 text-lg font-semibold text-ink-950">{event.title}</h3>
                        <p className="mt-1.5 text-sm text-ink-600">{formatDateTimeLabel(event.starts_at ?? event.due_at ?? event.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.source_recording_id ? (
                          <Link
                            to={`/recordings/${event.source_recording_id}/review`}
                            className="app-button-secondary cursor-pointer flex h-12 w-12 items-center justify-center px-0 py-0 text-xs"
                            aria-label="Open transcript"
                            title="Open transcript"
                          >
                            <DocumentIcon />
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => calendar.updateEvent(event.id, { status: event.status === 'done' ? 'pending' : 'done' })}
                          className={[
                            'cursor-pointer rounded-full px-0 py-0',
                            event.status === 'done' ? 'app-button-ghost flex h-12 w-12 items-center justify-center' : 'app-button-primary flex h-12 w-12 items-center justify-center',
                          ].join(' ')}
                          aria-label={event.status === 'done' ? 'Reopen event' : 'Complete event'}
                          title={event.status === 'done' ? 'Reopen event' : 'Complete event'}
                        >
                          {event.status === 'done' ? <UndoIcon /> : <CheckIcon />}
                        </button>
                      </div>
                    </div>

                    {event.description ? <p className="mt-3 text-sm leading-6 text-ink-700">{event.description}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="app-chip app-status-chip">{formatStatusLabel(event.status)}</span>
                      {property ? <span className="app-chip app-tag-property">{property.title}</span> : null}
                      {contact ? <span className={getContactTagClass(role)}>{formatContactTag(role, contact.full_name)}</span> : null}
                    </div>
                  </article>
                )
              })
            ) : (
              <div className="app-surface-muted rounded-[1.65rem] border-dashed p-6 text-sm text-ink-700">
                No events match the current list filters.
              </div>
            )}
          </div>
        </section>
      </PageFrame>

      <button
        type="button"
        onClick={() => setIsCreateOpen(true)}
        className="app-button-primary fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center px-0 py-0 md:bottom-8"
        aria-label="Create event"
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
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">New event</p>
                <h3 className="text-[1.6rem] font-semibold tracking-[-0.03em] text-ink-950">Add a follow-up or visit</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false)
                  calendar.resetForm()
                }}
                className="app-button-ghost px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <form
              className="mt-5 space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                calendar.createEvent({
                  onSuccess: () => {
                    setIsCreateOpen(false)
                  },
                })
              }}
            >
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink-700">Title</span>
                <input
                  value={calendar.form.title}
                  onChange={(event) => calendar.updateFormField('title', event.target.value)}
                  className="app-input"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink-700">Event type</span>
                  <select
                    value={calendar.form.event_type}
                    onChange={(event) => calendar.updateFormField('event_type', event.target.value)}
                    className="app-input"
                  >
                    <option value="follow_up">Follow up</option>
                    <option value="property_visit">Property visit</option>
                    <option value="document_check">Document check</option>
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink-700">Status</span>
                  <select
                    value={calendar.form.status}
                    onChange={(event) => calendar.updateFormField('status', event.target.value)}
                    className="app-input"
                  >
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="done">Done</option>
                  </select>
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink-700">Property</span>
                <select
                  value={calendar.form.property_id}
                  onChange={(event) => calendar.updateFormField('property_id', event.target.value)}
                  className="app-input"
                >
                  <option value="">No property</option>
                  {calendar.properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink-700">Contact</span>
                <select
                  value={calendar.form.contact_id}
                  onChange={(event) => calendar.updateFormField('contact_id', event.target.value)}
                  className="app-input"
                >
                  <option value="">No contact</option>
                  {calendar.contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink-700">Starts at</span>
                  <input
                    type="datetime-local"
                    value={calendar.form.starts_at}
                    onChange={(event) => calendar.updateFormField('starts_at', event.target.value)}
                    className="app-input"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink-700">Ends at</span>
                  <input
                    type="datetime-local"
                    value={calendar.form.ends_at}
                    onChange={(event) => calendar.updateFormField('ends_at', event.target.value)}
                    className="app-input"
                  />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink-700">Due at</span>
                <input
                  type="datetime-local"
                  value={calendar.form.due_at}
                  onChange={(event) => calendar.updateFormField('due_at', event.target.value)}
                  className="app-input"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-ink-700">Description</span>
                <textarea
                  rows={3}
                  value={calendar.form.description}
                  onChange={(event) => calendar.updateFormField('description', event.target.value)}
                  className="app-input min-h-[7rem]"
                />
              </label>
              {calendar.error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{calendar.error}</p> : null}
              <button
                type="submit"
                disabled={calendar.isCreating}
                className="app-button-primary w-full px-4 py-3 disabled:opacity-60"
              >
                {calendar.isCreating ? 'Saving...' : 'Create event'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}

function toTitleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ')
}

function formatStatusLabel(value: string): string {
  if (value === 'done') {
    return 'Complete'
  }
  return toTitleCase(value)
}

function formatContactTag(role: string | null | undefined, name: string): string {
  if (role === 'buyer' || role === 'seller') {
    return `${toTitleCase(role)}: ${name}`
  }
  return name
}

function getContactTagClass(role: string | null | undefined): string {
  if (role === 'buyer') {
    return 'app-chip app-tag-buyer'
  }
  if (role === 'seller') {
    return 'app-chip app-tag-seller'
  }
  return 'app-chip app-tag-contact'
}

function toDateInputValue(value?: string | Date | null): string {
  if (!value) {
    return ''
  }
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

function addMonths(value: Date, delta: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + delta, 1)
}

function formatMonthKey(value: Date): string {
  return `${value.getFullYear()}-${`${value.getMonth() + 1}`.padStart(2, '0')}`
}

function buildCalendarDays(month: Date): Date[] {
  const firstDay = startOfMonth(month)
  const leadingDays = firstDay.getDay()
  const calendarStart = new Date(month.getFullYear(), month.getMonth(), 1 - leadingDays)

  return Array.from({ length: 42 }, (_, index) => new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate() + index))
}

function formatDayHeading(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))
}

function formatCompactTime(value?: string | null): string {
  if (!value) {
    return 'No time'
  }

  const date = new Date(value)
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5L20 7" />
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14 4 9l5-5" />
      <path d="M20 20a8 8 0 0 0-8-8H4" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M8.5 9.5h7" />
      <path d="M8.5 13h7" />
      <path d="M8.5 16.5h5" />
    </svg>
  )
}

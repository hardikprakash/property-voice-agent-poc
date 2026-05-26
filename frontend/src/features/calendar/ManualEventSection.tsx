import type { ContactRead, PropertyRead } from '../../types'

type EventFormValues = {
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

type ManualEventSectionProps = {
  form: EventFormValues
  properties: PropertyRead[]
  contacts: ContactRead[]
  error: string | null
  isCreating: boolean
  onFieldChange: (field: keyof EventFormValues, value: string) => void
  onSubmit: () => void
}

export function ManualEventSection({
  form,
  properties,
  contacts,
  error,
  isCreating,
  onFieldChange,
  onSubmit,
}: ManualEventSectionProps) {
  return (
    <section className="rounded-[2rem] bg-ink-950 p-6 text-white shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-400">Manual event</p>
      <h3 className="mt-3 text-2xl font-semibold">Add a follow-up or visit</h3>
      <form
        className="mt-5 space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-sand-50">Title</span>
          <input
            value={form.title}
            onChange={(event) => onFieldChange('title', event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sea-400"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-sand-50">Event type</span>
            <select
              value={form.event_type}
              onChange={(event) => onFieldChange('event_type', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sea-400"
            >
              <option value="follow_up" className="text-ink-900">Follow up</option>
              <option value="property_visit" className="text-ink-900">Property visit</option>
              <option value="document_check" className="text-ink-900">Document check</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-sand-50">Status</span>
            <select
              value={form.status}
              onChange={(event) => onFieldChange('status', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sea-400"
            >
              <option value="pending" className="text-ink-900">Pending</option>
              <option value="scheduled" className="text-ink-900">Scheduled</option>
              <option value="done" className="text-ink-900">Done</option>
            </select>
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-sand-50">Property</span>
          <select
            value={form.property_id}
            onChange={(event) => onFieldChange('property_id', event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sea-400"
          >
            <option value="" className="text-ink-900">No property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id} className="text-ink-900">
                {property.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-sand-50">Contact</span>
          <select
            value={form.contact_id}
            onChange={(event) => onFieldChange('contact_id', event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sea-400"
          >
            <option value="" className="text-ink-900">No contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id} className="text-ink-900">
                {contact.full_name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-sand-50">Starts at</span>
            <input
              type="datetime-local"
              value={form.starts_at}
              onChange={(event) => onFieldChange('starts_at', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sea-400"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-sand-50">Ends at</span>
            <input
              type="datetime-local"
              value={form.ends_at}
              onChange={(event) => onFieldChange('ends_at', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sea-400"
            />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-sand-50">Due at</span>
          <input
            type="datetime-local"
            value={form.due_at}
            onChange={(event) => onFieldChange('due_at', event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sea-400"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-sand-50">Description</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(event) => onFieldChange('description', event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-sea-400"
          />
        </label>
        {error ? <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
        <button
          type="submit"
          disabled={isCreating}
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-ink-950 transition hover:bg-sand-100 disabled:opacity-60"
        >
          {isCreating ? 'Saving...' : 'Create event'}
        </button>
      </form>
    </section>
  )
}
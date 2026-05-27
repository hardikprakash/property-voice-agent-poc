import { formatDateTimeLabel } from '../../lib/datetime'
import type { ContactRead, DraftActionRead, PropertyRead } from '../../types'

import type { DraftActionForm } from './types'

type DraftActionCardProps = {
  action: DraftActionRead
  form: DraftActionForm
  properties: PropertyRead[]
  contacts: ContactRead[]
  isSaving: boolean
  isApproving: boolean
  onChange: (updater: (current: DraftActionForm) => DraftActionForm) => void
  onSave: () => void
  onApprove: () => void
  onDiscard: () => void
}

export function DraftActionCard({
  action,
  form,
  properties,
  contacts,
  isSaving,
  isApproving,
  onChange,
  onSave,
  onApprove,
  onDiscard,
}: DraftActionCardProps) {
  return (
    <article className="app-surface rounded-[1.65rem] p-5 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">{action.action_type}</p>
          <h3 className="text-xl font-semibold text-ink-950">{action.title}</h3>
          <p className="text-sm text-ink-600">Confidence {action.confidence_label} · status {action.review_status}</p>
          <p className="text-xs text-ink-500">Created {formatDateTimeLabel(action.created_at)}</p>
        </div>
        {form.unresolved_fields.length ? (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Resolve: {form.unresolved_fields.join(', ')}</div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <label className="block space-y-2 lg:col-span-2">
          <span className="text-sm font-medium text-ink-700">Title</span>
          <input
            value={form.title}
            onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
            className="app-input"
          />
        </label>
        <label className="block space-y-2 lg:col-span-2">
          <span className="text-sm font-medium text-ink-700">Description</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
            className="app-input min-h-[7rem]"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink-700">Property</span>
          <select
            value={form.property_id}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                property_id: event.target.value,
                unresolved_fields: current.unresolved_fields.filter((item) => item !== 'property_id'),
              }))
            }
            className="app-input"
          >
            <option value="">Select property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink-700">Contact</span>
          <select
            value={form.contact_id}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                contact_id: event.target.value,
                unresolved_fields: current.unresolved_fields.filter((item) => item !== 'contact_id'),
              }))
            }
            className="app-input"
          >
            <option value="">Select contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink-700">Contact role</span>
          <select
            value={form.contact_role}
            onChange={(event) => onChange((current) => ({ ...current, contact_role: event.target.value }))}
            className="app-input"
          >
            <option value="">Unknown</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="tenant_candidate">Tenant candidate</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink-700">Confidence</span>
          <select
            value={form.confidence_label}
            onChange={(event) => onChange((current) => ({ ...current, confidence_label: event.target.value }))}
            className="app-input"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink-700">Starts at</span>
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                starts_at: event.target.value,
                unresolved_fields: current.unresolved_fields.filter((item) => item !== 'timing'),
              }))
            }
            className="app-input"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink-700">Ends at</span>
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(event) => onChange((current) => ({ ...current, ends_at: event.target.value }))}
            className="app-input"
          />
        </label>
        <label className="block space-y-2 lg:col-span-2">
          <span className="text-sm font-medium text-ink-700">Due at</span>
          <input
            type="datetime-local"
            value={form.due_at}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                due_at: event.target.value,
                unresolved_fields: current.unresolved_fields.filter((item) => item !== 'timing'),
              }))
            }
            className="app-input"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="app-button-secondary px-4 py-2 disabled:opacity-60"
        >
          Save changes
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={isApproving}
          className="app-button-primary px-4 py-2 disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
        >
          Discard
        </button>
      </div>
    </article>
  )
}
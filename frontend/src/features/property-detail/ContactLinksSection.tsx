import type { ContactRead, PropertyContactLinkRead } from '../../types'

type LinkFormValues = {
  contact_id: string
  role: string
  notes: string
}

type ContactLinksSectionProps = {
  links: PropertyContactLinkRead[]
  contacts: ContactRead[]
  contactById: Record<string, ContactRead>
  linkForm: LinkFormValues
  isCreatingLink: boolean
  onLinkFieldChange: (field: keyof LinkFormValues, value: string) => void
  onCreateLink: () => void
  onDeleteLink: (linkId: string) => void
}

export function ContactLinksSection({
  links,
  contacts,
  contactById,
  linkForm,
  isCreatingLink,
  onLinkFieldChange,
  onCreateLink,
  onDeleteLink,
}: ContactLinksSectionProps) {
  return (
    <section className="space-y-4">
      <section className="app-surface rounded-[1.65rem] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember-500">Linked contacts</p>
        <div className="mt-4 space-y-3">
          {links.length ? (
            links.map((link) => (
              <div key={link.id} className="app-surface-muted rounded-[1.2rem] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink-950">{contactById[link.contact_id]?.full_name ?? link.contact_id}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-500">{link.role}</p>
                    {link.notes ? <p className="mt-2 text-sm text-ink-700">{link.notes}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteLink(link.id)}
                    className="app-button-secondary px-3 py-2 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="app-surface-muted rounded-[1.2rem] px-4 py-3 text-sm text-ink-700">No linked buyers or sellers yet.</div>
          )}
        </div>
      </section>

      <section className="app-surface rounded-[1.65rem] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Add buyer or seller</p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            onCreateLink()
          }}
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink-700">Contact</span>
            <select
              value={linkForm.contact_id}
              onChange={(event) => onLinkFieldChange('contact_id', event.target.value)}
              className="app-input"
            >
              <option value="">Select a contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink-700">Role</span>
            <select
              value={linkForm.role}
              onChange={(event) => onLinkFieldChange('role', event.target.value)}
              className="app-input"
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="tenant_candidate">Tenant candidate</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink-700">Notes</span>
            <textarea
              rows={3}
              value={linkForm.notes}
              onChange={(event) => onLinkFieldChange('notes', event.target.value)}
              className="app-input min-h-[7rem]"
            />
          </label>
          <button
            type="submit"
            disabled={!linkForm.contact_id || isCreatingLink}
            className="app-button-primary w-full px-4 py-3 disabled:opacity-60"
          >
            {isCreatingLink ? 'Linking...' : 'Link contact'}
          </button>
        </form>
      </section>
    </section>
  )
}
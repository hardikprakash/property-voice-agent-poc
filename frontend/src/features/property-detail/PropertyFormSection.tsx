type PropertyFormValues = {
  title: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  postal_code: string
  property_type: string
  notes: string
}

type PropertyFormSectionProps = {
  title: string
  feedback: string | null
  form: PropertyFormValues
  isSaving: boolean
  onFieldChange: (field: keyof PropertyFormValues, value: string) => void
  onSubmit: () => void
}

const FIELD_LABELS: Array<{ key: Exclude<keyof PropertyFormValues, 'notes'>; label: string }> = [
  { key: 'title', label: 'Title' },
  { key: 'address_line_1', label: 'Address line 1' },
  { key: 'address_line_2', label: 'Address line 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postal_code', label: 'Postal code' },
  { key: 'property_type', label: 'Property type' },
]

export function PropertyFormSection({ title, feedback, form, isSaving, onFieldChange, onSubmit }: PropertyFormSectionProps) {
  return (
    <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sea-600">Property</p>
      <h3 className="mt-3 text-2xl font-semibold text-ink-950">{title}</h3>
      <form
        className="mt-5 space-y-3"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        {FIELD_LABELS.map(({ key, label }) => (
          <label key={key} className="block space-y-2">
            <span className="text-sm font-medium text-ink-700">{label}</span>
            <input
              value={form[key]}
              onChange={(event) => onFieldChange(key, event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-sea-500"
            />
          </label>
        ))}
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink-700">Notes</span>
          <textarea
            rows={4}
            value={form.notes}
            onChange={(event) => onFieldChange('notes', event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-sea-500"
          />
        </label>
        {feedback ? <p className="rounded-2xl bg-sand-100 px-4 py-3 text-sm text-ink-700">{feedback}</p> : null}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-2xl bg-ink-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-ink-900 disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save property'}
        </button>
      </form>
    </section>
  )
}
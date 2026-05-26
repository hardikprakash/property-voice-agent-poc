import { AgendaSection } from '../features/calendar/AgendaSection'
import { ManualEventSection } from '../features/calendar/ManualEventSection'
import { useCalendarPage } from '../features/calendar/useCalendarPage'
import { PageFrame } from '../layout/PageFrame'

export function CalendarPage() {
  const calendar = useCalendarPage()

  return (
    <PageFrame
      title="Calendar"
      subtitle="Agenda comes first on mobile, with month view as a secondary planning aid once the workflow matures."
    >
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <AgendaSection agenda={calendar.agenda} onDelete={calendar.deleteEvent} />

        <ManualEventSection
          form={calendar.form}
          properties={calendar.properties}
          contacts={calendar.contacts}
          error={calendar.error}
          isCreating={calendar.isCreating}
          onFieldChange={calendar.updateFormField}
          onSubmit={calendar.createEvent}
        />
      </div>
    </PageFrame>
  )
}

import { useParams } from 'react-router-dom'

import { ContactLinksSection } from '../features/property-detail/ContactLinksSection'
import { PropertyFormSection } from '../features/property-detail/PropertyFormSection'
import { usePropertyDetail } from '../features/property-detail/usePropertyDetail'
import { PageFrame } from '../layout/PageFrame'

export function PropertyDetailPage() {
  const { propertyId } = useParams()
  const detail = usePropertyDetail(propertyId)

  return (
    <PageFrame
      title="Property detail"
      subtitle="Edit the listing details and connect buyers or sellers so transcript extraction can resolve people against the right property."
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <PropertyFormSection
          title={detail.property?.title ?? propertyId ?? 'Property'}
          feedback={detail.feedback}
          form={detail.form}
          isSaving={detail.isSaving}
          onFieldChange={detail.updateFormField}
          onSubmit={detail.saveProperty}
        />

        <ContactLinksSection
          links={detail.links}
          contacts={detail.contacts}
          contactById={detail.contactById}
          linkForm={detail.linkForm}
          isCreatingLink={detail.isCreatingLink}
          onLinkFieldChange={detail.updateLinkFormField}
          onCreateLink={detail.createLink}
          onDeleteLink={detail.deleteLink}
        />
      </div>
    </PageFrame>
  )
}

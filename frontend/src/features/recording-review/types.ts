import { toDatetimeLocalInput } from '../../lib/datetime'
import type { DraftActionRead } from '../../types'

export type DraftActionForm = {
  title: string
  description: string
  property_id: string
  contact_id: string
  contact_role: string
  action_type: string
  starts_at: string
  ends_at: string
  due_at: string
  confidence_label: string
  review_status: string
  unresolved_fields: string[]
}

export function buildDraftActionForm(action: DraftActionRead): DraftActionForm {
  return {
    title: action.title,
    description: action.description ?? '',
    property_id: action.property_id ?? '',
    contact_id: action.contact_id ?? '',
    contact_role: action.contact_role ?? '',
    action_type: action.action_type,
    starts_at: toDatetimeLocalInput(action.starts_at),
    ends_at: toDatetimeLocalInput(action.ends_at),
    due_at: toDatetimeLocalInput(action.due_at),
    confidence_label: action.confidence_label,
    review_status: action.review_status,
    unresolved_fields: action.unresolved_fields,
  }
}
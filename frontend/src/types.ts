export interface BrokerRead {
  id: string
  email: string
  full_name: string
  created_at: string
  updated_at: string
}

export interface AuthSession {
  access_token: string
  token_type: 'bearer'
  broker: BrokerRead
}

export interface PropertyRead {
  id: string
  broker_id: string
  title: string
  address_line_1: string
  address_line_2?: string | null
  city: string
  state: string
  postal_code: string
  property_type: string
  notes?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ContactRead {
  id: string
  broker_id: string
  full_name: string
  phone_number?: string | null
  email?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface CalendarEventRead {
  id: string
  broker_id: string
  property_id?: string | null
  contact_id?: string | null
  title: string
  description?: string | null
  event_type: string
  status: string
  starts_at?: string | null
  ends_at?: string | null
  due_at?: string | null
  source: string
  source_recording_id?: string | null
  source_draft_action_id?: string | null
  created_at: string
  updated_at: string
}

export interface AudioRecordingRead {
  id: string
  broker_id: string
  original_filename: string
  storage_path: string
  mime_type: string
  file_size_bytes: number
  duration_seconds?: number | null
  capture_source: string
  processing_status: string
  created_at: string
  updated_at: string
}

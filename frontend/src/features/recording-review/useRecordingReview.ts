import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { ApiError, apiFetch } from '../../lib/api'
import { fromDatetimeLocalInput } from '../../lib/datetime'
import type {
  AudioRecordingRead,
  CalendarEventRead,
  ContactRead,
  DraftActionRead,
  ExtractionResultRead,
  PropertyRead,
  TranscriptRead,
} from '../../types'

import { buildDraftActionForm, type DraftActionForm } from './types'

export function useRecordingReview(recordingId?: string) {
  const queryClient = useQueryClient()
  const [transcriptText, setTranscriptText] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [draftForms, setDraftForms] = useState<Record<string, DraftActionForm>>({})

  const recordingQuery = useQuery({
    queryKey: ['recording', recordingId],
    queryFn: () => apiFetch<AudioRecordingRead>(`/api/recordings/${recordingId}`),
    enabled: Boolean(recordingId),
  })
  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiFetch<PropertyRead[]>('/api/properties'),
  })
  const contactsQuery = useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiFetch<ContactRead[]>('/api/contacts'),
  })
  const transcriptQuery = useQuery({
    queryKey: ['recording-transcript', recordingId],
    queryFn: async () => {
      try {
        return await apiFetch<TranscriptRead>(`/api/recordings/${recordingId}/transcript`)
      } catch (queryError) {
        if (queryError instanceof ApiError && queryError.status === 404) {
          return null
        }
        throw queryError
      }
    },
    enabled: Boolean(recordingId),
  })
  const draftActionsQuery = useQuery({
    queryKey: ['recording-draft-actions', recordingId],
    queryFn: () => apiFetch<DraftActionRead[]>(`/api/recordings/${recordingId}/draft-actions`),
    enabled: Boolean(recordingId),
  })

  useEffect(() => {
    setTranscriptText(transcriptQuery.data?.raw_text ?? '')
  }, [transcriptQuery.data?.id, transcriptQuery.data?.raw_text])

  useEffect(() => {
    const nextState: Record<string, DraftActionForm> = {}
    for (const action of draftActionsQuery.data ?? []) {
      nextState[action.id] = buildDraftActionForm(action)
    }
    setDraftForms(nextState)
  }, [draftActionsQuery.data])

  const transcribeMutation = useMutation({
    mutationFn: () => apiFetch<TranscriptRead>(`/api/recordings/${recordingId}/transcribe`, { method: 'POST' }),
    onSuccess: async (transcript) => {
      setFeedback('Stub transcript generated. Edit it if needed, then extract actions.')
      setTranscriptText(transcript.raw_text)
      await queryClient.invalidateQueries({ queryKey: ['recording-transcript', recordingId] })
      await queryClient.invalidateQueries({ queryKey: ['recordings'] })
    },
  })

  const saveTranscriptMutation = useMutation({
    mutationFn: () => {
      if (!transcriptQuery.data) {
        throw new Error('Generate a transcript first.')
      }

      return apiFetch<TranscriptRead>(`/api/transcripts/${transcriptQuery.data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ raw_text: transcriptText, language_code: transcriptQuery.data.language_code }),
      })
    },
    onSuccess: async () => {
      setFeedback('Transcript saved.')
      await queryClient.invalidateQueries({ queryKey: ['recording-transcript', recordingId] })
    },
  })

  const extractMutation = useMutation({
    mutationFn: () => apiFetch<ExtractionResultRead>(`/api/recordings/${recordingId}/extract-actions`, { method: 'POST' }),
    onSuccess: async () => {
      setFeedback('Draft actions extracted. Review each card before approval.')
      await queryClient.invalidateQueries({ queryKey: ['recording-draft-actions', recordingId] })
      await queryClient.invalidateQueries({ queryKey: ['recordings'] })
    },
  })

  const saveDraftActionMutation = useMutation({
    mutationFn: ({ actionId, payload }: { actionId: string; payload: DraftActionForm }) =>
      apiFetch<DraftActionRead>(`/api/draft-actions/${actionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: payload.title,
          description: payload.description || null,
          property_id: payload.property_id || null,
          contact_id: payload.contact_id || null,
          contact_role: payload.contact_role || null,
          action_type: payload.action_type,
          starts_at: fromDatetimeLocalInput(payload.starts_at),
          ends_at: fromDatetimeLocalInput(payload.ends_at),
          due_at: fromDatetimeLocalInput(payload.due_at),
          confidence_label: payload.confidence_label,
          review_status: payload.review_status,
          unresolved_fields: payload.unresolved_fields,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['recording-draft-actions', recordingId] })
    },
  })

  const approveMutation = useMutation({
    mutationFn: (actionId: string) => apiFetch<CalendarEventRead>(`/api/draft-actions/${actionId}/approve`, { method: 'POST' }),
    onSuccess: async () => {
      setFeedback('Draft action approved into the calendar.')
      await queryClient.invalidateQueries({ queryKey: ['recording-draft-actions', recordingId] })
      await queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const bulkApproveMutation = useMutation({
    mutationFn: (draftActionIds: string[]) =>
      apiFetch<CalendarEventRead[]>('/api/draft-actions/bulk-approve', {
        method: 'POST',
        body: JSON.stringify({ draft_action_ids: draftActionIds }),
      }),
    onSuccess: async () => {
      setFeedback('Pending draft actions were approved into the calendar.')
      await queryClient.invalidateQueries({ queryKey: ['recording-draft-actions', recordingId] })
      await queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const pendingDraftActionIds = (draftActionsQuery.data ?? [])
    .filter((action) => action.review_status !== 'approved')
    .map((action) => action.id)

  const updateDraftForm = (actionId: string, updater: (current: DraftActionForm) => DraftActionForm) => {
    setDraftForms((current) => {
      const existing = current[actionId]
      if (!existing) {
        return current
      }
      return { ...current, [actionId]: updater(existing) }
    })
  }

  const saveAction = async (actionId: string, overridePayload?: DraftActionForm) => {
    const payload = overridePayload ?? draftForms[actionId]
    if (!payload) {
      return
    }
    await saveDraftActionMutation.mutateAsync({ actionId, payload })
  }

  const approveAction = async (actionId: string) => {
    await saveAction(actionId)
    await approveMutation.mutateAsync(actionId)
  }

  const discardAction = async (actionId: string) => {
    const payload = draftForms[actionId]
    if (!payload) {
      return
    }
    await saveAction(actionId, { ...payload, review_status: 'discarded' })
  }

  const approveAllPending = async () => {
    if (!pendingDraftActionIds.length) {
      return
    }
    await bulkApproveMutation.mutateAsync(pendingDraftActionIds)
  }

  return {
    recording: recordingQuery.data,
    properties: propertiesQuery.data ?? [],
    contacts: contactsQuery.data ?? [],
    draftActions: draftActionsQuery.data ?? [],
    transcriptText,
    feedback,
    draftForms,
    pendingDraftActionCount: pendingDraftActionIds.length,
    setTranscriptText,
    updateDraftForm,
    generateTranscript: () => transcribeMutation.mutate(),
    saveTranscript: () => saveTranscriptMutation.mutate(),
    extractDraftActions: () => extractMutation.mutate(),
    saveAction: (actionId: string) => saveAction(actionId),
    approveAction,
    discardAction,
    approveAllPending,
    hasTranscript: Boolean(transcriptQuery.data),
    isTranscribing: transcribeMutation.isPending,
    isSavingTranscript: saveTranscriptMutation.isPending,
    isExtracting: extractMutation.isPending,
    isSavingAction: saveDraftActionMutation.isPending,
    isApprovingAction: approveMutation.isPending,
    isApprovingAll: bulkApproveMutation.isPending,
  }
}
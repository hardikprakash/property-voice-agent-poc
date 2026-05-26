import { useParams } from 'react-router-dom'

import { DraftActionCard } from '../features/recording-review/DraftActionCard'
import { ReviewHeader } from '../features/recording-review/ReviewHeader'
import { TranscriptPanel } from '../features/recording-review/TranscriptPanel'
import { useRecordingReview } from '../features/recording-review/useRecordingReview'
import { PageFrame } from '../layout/PageFrame'

export function RecordingReviewPage() {
  const { recordingId } = useParams()
  const review = useRecordingReview(recordingId)

  return (
    <PageFrame
      title="Review"
      subtitle="Inspect the transcript, resolve buyer or seller matches, then approve clean draft actions into the in-app calendar."
    >
      <div className="space-y-4">
        <ReviewHeader
          title={review.recording?.original_filename ?? recordingId ?? 'Recording'}
          recordingStatus={review.recording?.processing_status ?? 'uploaded'}
          durationSeconds={review.recording?.duration_seconds}
          feedback={review.feedback}
          hasTranscript={review.hasTranscript}
          isTranscribing={review.isTranscribing}
          isSavingTranscript={review.isSavingTranscript}
          isExtracting={review.isExtracting}
          onTranscribe={review.generateTranscript}
          onSaveTranscript={review.saveTranscript}
          onExtract={review.extractDraftActions}
        />

        <TranscriptPanel
          transcriptText={review.transcriptText}
          onTranscriptChange={review.setTranscriptText}
          pendingDraftActionCount={review.pendingDraftActionCount}
          isApprovingAll={review.isApprovingAll}
          onApproveAll={() => {
            void review.approveAllPending()
          }}
        />

        <section className="space-y-4">
          {review.draftActions.length ? (
            review.draftActions.map((action) => {
              const form = review.draftForms[action.id]
              if (!form) {
                return null
              }
              return (
                <DraftActionCard
                  key={action.id}
                  action={action}
                  form={form}
                  properties={review.properties}
                  contacts={review.contacts}
                  isSaving={review.isSavingAction}
                  isApproving={review.isApprovingAction}
                  onChange={(updater) => review.updateDraftForm(action.id, updater)}
                  onSave={() => {
                    void review.saveAction(action.id)
                  }}
                  onApprove={() => {
                    void review.approveAction(action.id)
                  }}
                  onDiscard={() => {
                    void review.discardAction(action.id)
                  }}
                />
              )
            })
          ) : (
            <section className="rounded-[2rem] border border-dashed border-black/10 bg-white/70 p-6 text-sm text-ink-700">
              No draft actions yet. Generate or edit the transcript, then run extraction.
            </section>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

import { RecorderSection } from '../features/recordings-new/RecorderSection'
import { UploadSection } from '../features/recordings-new/UploadSection'
import { useRecordingCapture } from '../features/recordings-new/useRecordingCapture'
import { PageFrame } from '../layout/PageFrame'

export function RecordingsNewPage() {
  const capture = useRecordingCapture()

  return (
    <PageFrame
      title="Recordings"
      subtitle="Use the phone microphone for quick capture or upload an existing audio file. Both paths lead into the same review workflow."
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <RecorderSection
          isRecording={capture.isRecording}
          isUploading={capture.isUploading}
          recorderError={capture.recorderError}
          previewUrl={capture.previewUrl}
          hasRecordedBlob={Boolean(capture.recordedBlob)}
          onStart={() => {
            void capture.startRecording()
          }}
          onStop={capture.stopRecording}
          onUpload={() => {
            void capture.uploadRecordedClip()
          }}
        />

        <UploadSection
          durationSeconds={capture.durationSeconds}
          error={capture.error}
          isUploading={capture.isUploading}
          onFileChange={capture.setFile}
          onDurationChange={capture.setDurationSeconds}
          onSubmit={() => {
            void capture.uploadSelectedFile()
          }}
        />
      </div>
    </PageFrame>
  )
}

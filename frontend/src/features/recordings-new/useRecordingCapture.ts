import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiFetch } from '../../lib/api'
import type { AudioRecordingRead } from '../../types'

type UploadRoute = '/api/recordings/upload' | '/api/recordings/browser'

export function useRecordingCapture() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [noteText, setNoteText] = useState('')
  const [durationSeconds, setDurationSeconds] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recorderError, setRecorderError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef<number | null>(null)

  const inferDurationSeconds = async (selectedFile: File) => {
    const objectUrl = URL.createObjectURL(selectedFile)
    const audio = document.createElement('audio')
    audio.preload = 'metadata'

    try {
      const duration = await new Promise<number>((resolve, reject) => {
        audio.onloadedmetadata = () => resolve(audio.duration)
        audio.onerror = () => reject(new Error('Could not read audio metadata'))
        audio.src = objectUrl
      })

      if (Number.isFinite(duration) && duration > 0) {
        setDurationSeconds(String(Math.round(duration)))
        return
      }
    } catch {
      // Leave duration empty if the browser cannot infer it from the uploaded file.
    } finally {
      URL.revokeObjectURL(objectUrl)
    }

    setDurationSeconds('')
  }

  useEffect(() => {
    if (!recordedBlob) {
      setPreviewUrl(null)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(recordedBlob)
    setPreviewUrl(nextPreviewUrl)

    return () => {
      URL.revokeObjectURL(nextPreviewUrl)
    }
  }, [recordedBlob])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      recorderRef.current = null
    }
  }, [])

  const uploadToRoute = async (selectedFile: File, route: UploadRoute, seconds?: string) => {
    const formData = new FormData()
    formData.append('file', selectedFile)
    if (seconds?.trim()) {
      formData.append('duration_seconds', seconds.trim())
    }

    const recording = await apiFetch<AudioRecordingRead>(route, {
      method: 'POST',
      body: formData,
    })
    navigate(`/recordings/${recording.id}/review`)
  }

  const uploadSelectedFile = async () => {
    if (!file) {
      setError('Choose an audio file first.')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      await uploadToRoute(file, '/api/recordings/upload', durationSeconds)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const createQuickNote = async () => {
    const trimmedNote = noteText.trim()
    if (!trimmedNote) {
      setError('Write a quick note first.')
      return
    }

    setError(null)
    setIsCreatingNote(true)

    try {
      const recording = await apiFetch<AudioRecordingRead>('/api/recordings/note', {
        method: 'POST',
        body: JSON.stringify({ raw_text: trimmedNote }),
      })
      navigate(`/recordings/${recording.id}/review`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save note')
    } finally {
      setIsCreatingNote(false)
    }
  }

  const startRecording = async () => {
    setRecorderError(null)
    setRecordedBlob(null)

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setRecorderError('This browser does not support microphone recording.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []
      startedAtRef.current = Date.now()

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      })

      recorder.addEventListener('stop', () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setRecordedBlob(blob)
        setDurationSeconds(startedAtRef.current ? `${Math.round((Date.now() - startedAtRef.current) / 1000)}` : '')
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        recorderRef.current = null
        setIsRecording(false)
      })

      recorder.start()
      setIsRecording(true)
    } catch (recordError) {
      setRecorderError(recordError instanceof Error ? recordError.message : 'Could not access the microphone')
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
  }

  const uploadRecordedClip = async () => {
    if (!recordedBlob) {
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const extension = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm'
      const recordedFile = new File([recordedBlob], `browser-recording.${extension}`, {
        type: recordedBlob.type || 'audio/webm',
      })
      await uploadToRoute(recordedFile, '/api/recordings/browser', durationSeconds)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return {
    file,
    noteText,
    durationSeconds,
    error,
    isUploading,
    isCreatingNote,
    isRecording,
    recordedBlob,
    recorderError,
    previewUrl,
    setNoteText,
    setFile: (selectedFile: File | null) => {
      setFile(selectedFile)
      if (selectedFile) {
        void inferDurationSeconds(selectedFile)
      } else {
        setDurationSeconds('')
      }
    },
    uploadSelectedFile,
    createQuickNote,
    startRecording,
    stopRecording,
    uploadRecordedClip,
  }
}
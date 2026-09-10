import { useState, useRef, useCallback } from 'react'

export interface VoiceRecorderState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
  audioUrl: string | null
  error: string | null
}

export function useVoiceRecorder(maxDurationSeconds = 120) {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setState(s => ({ ...s, error: null, audioBlob: null, audioUrl: null, duration: 0 }))
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const options = { mimeType: 'audio/webm;codecs=opus' }
      const mimeType = MediaRecorder.isTypeSupported(options.mimeType) ? options.mimeType : ''
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const type = mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        const url = URL.createObjectURL(blob)
        setState(s => ({ ...s, isRecording: false, isPaused: false, audioBlob: blob, audioUrl: url }))
        cleanup()
      }

      mediaRecorder.start(200)
      setState(s => ({ ...s, isRecording: true, isPaused: false }))

      timerRef.current = setInterval(() => {
        setState(s => {
          if (s.duration >= maxDurationSeconds) {
            mediaRecorder.stop()
            return s
          }
          return { ...s, duration: s.duration + 1 }
        })
      }, 1000)

    } catch (err: any) {
      console.error(err)
      setState(s => ({ ...s, error: err.message || 'Microphone access denied or unavailable' }))
      cleanup()
    }
  }, [maxDurationSeconds, cleanup])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setState(s => ({
      ...s,
      isRecording: false,
      isPaused: false,
      audioBlob: null,
      audioUrl: null,
      duration: 0
    }))
    chunksRef.current = []
    cleanup()
  }, [cleanup])

  const discardRecording = useCallback(() => {
    setState(s => {
      if (s.audioUrl) URL.revokeObjectURL(s.audioUrl)
      return {
        ...s,
        isRecording: false,
        isPaused: false,
        audioBlob: null,
        audioUrl: null,
        duration: 0
      }
    })
  }, [])

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    discardRecording
  }
}

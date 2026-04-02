import { useEffect, useRef, useState } from 'react'

type RecorderProps = {
  onRecorded: (file: File) => void
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function Recorder({ onRecorded }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!isRecording) return

    const interval = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isRecording])

  const startRecording = async () => {
    setError(null)
    setElapsedSeconds(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const extension = recorder.mimeType.includes('ogg') ? 'ogg' : 'webm'
        const file = new File([blob], `birdsong-sample.${extension}`, { type: blob.type })
        onRecorded(file)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access failed')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  return (
    <div className="record-card card action-card">
      <div className="card-kicker">
        <p className="section-label">Option 2</p>
        <span className={`mode-pill ${isRecording ? 'recording' : ''}`}>{isRecording ? 'Live' : 'Mic'}</span>
      </div>

      <div>
        <h3>Record in browser</h3>
        <p>Best on modern mobile browsers with microphone access enabled.</p>
      </div>

      <div className={`recorder-status ${isRecording ? 'recording' : ''}`}>
        <span className="recorder-dot" />
        <strong>{isRecording ? 'Recording now' : 'Ready to record'}</strong>
        <span className="small muted">{isRecording ? formatDuration(elapsedSeconds) : 'Tap once to start'}</span>
      </div>

      <button className={isRecording ? 'danger' : 'primary'} onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop recording' : 'Start recording'}
      </button>
      <p className="small muted">If your phone blocks recording, use the upload option with a saved voice memo.</p>
      {error ? <p className="error">{error}</p> : null}
    </div>
  )
}

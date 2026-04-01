import { useRef, useState } from 'react'

type RecorderProps = {
  onRecorded: (file: File) => void
}

export function Recorder({ onRecorded }: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    setError(null)

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
    <div className="record-card">
      <div>
        <h3>Record in browser</h3>
        <p>Grab a quick sample if your phone browser allows microphone access.</p>
      </div>
      <button className={isRecording ? 'danger' : 'primary'} onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop recording' : 'Start recording'}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </div>
  )
}

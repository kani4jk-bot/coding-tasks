import { ChangeEvent } from 'react'

type UploadFormProps = {
  onSelect: (file: File) => void
}

export function UploadForm({ onSelect }: UploadFormProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onSelect(file)
  }

  return (
    <label className="upload-card card action-card">
      <div className="card-kicker">
        <p className="section-label">Option 1</p>
        <span className="mode-pill">Upload</span>
      </div>

      <div>
        <span className="upload-title">Upload an audio clip</span>
        <p className="upload-subtitle">Accepts wav, mp3, webm, ogg, m4a, and most phone voice memo exports.</p>
      </div>

      <div className="upload-dropzone">
        <span className="upload-icon">⬆️</span>
        <strong>Choose audio file</strong>
        <span className="small muted">Voice memo, recording app export, or downloaded clip</span>
      </div>

      <input type="file" accept="audio/*" capture="environment" onChange={handleChange} />
    </label>
  )
}

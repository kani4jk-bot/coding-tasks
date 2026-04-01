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
      <div>
        <p className="section-label">Option 1</p>
        <span className="upload-title">Upload an audio clip</span>
      </div>
      <span className="upload-subtitle">Accepts wav, mp3, webm, ogg, m4a, and most phone voice memo exports.</span>
      <input type="file" accept="audio/*" capture="environment" onChange={handleChange} />
    </label>
  )
}

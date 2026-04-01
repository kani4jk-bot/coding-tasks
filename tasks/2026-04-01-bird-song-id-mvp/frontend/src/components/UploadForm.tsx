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
    <label className="upload-card">
      <span className="upload-title">Upload an audio clip</span>
      <span className="upload-subtitle">Accepts wav, mp3, webm, ogg, m4a</span>
      <input type="file" accept="audio/*" onChange={handleChange} />
    </label>
  )
}

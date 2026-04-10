import { useRef } from 'react'

type Props = {
  onSelect: (file: File) => void
  disabled: boolean
}

export function ImageUpload({ onSelect, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onSelect(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      className={`upload-area${disabled ? ' disabled' : ''}`}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        disabled={disabled}
        style={{ display: 'none' }}
        aria-label="Upload plant image"
      />
      <div className="upload-content">
        <span className="upload-icon">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
        <p>Tap to take a photo or upload an image</p>
        <p className="small muted">JPEG, PNG, or WebP · up to 10 MB</p>
      </div>
    </div>
  )
}

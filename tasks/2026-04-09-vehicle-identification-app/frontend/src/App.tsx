import { useState } from 'react'
import { identifyVehicle } from './api'
import { ImageUpload } from './components/ImageUpload'
import { ResultCard } from './components/ResultCard'
import type { IdentifyResponse } from './types'

export default function App() {
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<IdentifyResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileSelect = async (file: File) => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
    setLoading(true)

    try {
      const response = await identifyVehicle(file)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <span className="app-header-icon">🚗</span>
        <h1>Vehicle ID</h1>
        <p>Snap a photo to identify any vehicle and discover its story</p>
      </header>

      <section className="card upload-section">
        <ImageUpload onSelect={handleFileSelect} disabled={loading} />
        {preview && (
          <div className="preview-wrap">
            <img src={preview} alt="Selected vehicle" className="preview-image" />
          </div>
        )}
      </section>

      {loading && (
        <div className="card status-card">
          <div className="spinner" />
          <p>Identifying vehicle…</p>
        </div>
      )}

      {error && (
        <div className="card error-card">
          <p>{error}</p>
        </div>
      )}

      {result && <ResultCard result={result} />}

      {result && (
        <button className="btn-action" onClick={handleReset}>
          Try another vehicle →
        </button>
      )}

      {!preview && !loading && (
        <section className="card hints-card">
          <h2>Tips for best results</h2>
          <ul>
            <li>Capture the full vehicle including make badges and distinctive features</li>
            <li>Good lighting helps reveal colour, trim, and details</li>
            <li>Side or three-quarter angles work better than head-on shots</li>
          </ul>
        </section>
      )}
    </main>
  )
}

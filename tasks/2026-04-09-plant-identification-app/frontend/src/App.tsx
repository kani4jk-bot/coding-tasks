import { useState } from 'react'
import { identifyPlant } from './api'
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
      const response = await identifyPlant(file)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Plant ID</h1>
        <p>Snap a photo to identify any plant and discover its story</p>
      </header>

      <section className="card upload-section">
        <ImageUpload onSelect={handleFileSelect} disabled={loading} />
        {preview && (
          <div className="preview-wrap">
            <img src={preview} alt="Selected plant" className="preview-image" />
          </div>
        )}
      </section>

      {loading && (
        <div className="card status-card">
          <div className="spinner" />
          <p>Identifying plant…</p>
        </div>
      )}

      {error && (
        <div className="card error-card">
          <p>{error}</p>
        </div>
      )}

      {result && <ResultCard result={result} />}

      {!preview && !loading && (
        <section className="card hints-card">
          <h2>Tips for best results</h2>
          <ul>
            <li>Focus on the leaves, flowers, or fruit — these have the most identifying detail</li>
            <li>Natural light gives the clearest colours</li>
            <li>Try to capture the whole plant or a representative section</li>
          </ul>
        </section>
      )}
    </main>
  )
}

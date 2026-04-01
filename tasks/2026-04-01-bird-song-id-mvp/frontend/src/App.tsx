import { useState } from 'react'
import { identifyBird } from './api'
import { Recorder } from './components/Recorder'
import { ResultCard } from './components/ResultCard'
import { UploadForm } from './components/UploadForm'
import type { IdentifyResponse } from './types'

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<IdentifyResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const runIdentification = async (file: File) => {
    setSelectedFile(file)
    setLoading(true)
    setError(null)

    try {
      const response = await identifyBird(file)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Birdsong ID MVP</p>
        <h1>Identify birds from recorded song</h1>
        <p className="lede">
          A mobile-friendly web prototype for uploading or recording a short bird song clip and getting ranked species matches.
        </p>
      </section>

      <section className="input-grid">
        <UploadForm onSelect={runIdentification} />
        <Recorder onRecorded={runIdentification} />
      </section>

      {selectedFile ? (
        <div className="selected-file">Selected clip: <strong>{selectedFile.name}</strong></div>
      ) : null}

      {loading ? <div className="status">Analyzing bird song…</div> : null}
      {error ? <div className="status error">{error}</div> : null}
      {result ? <ResultCard result={result} /> : null}

      <section className="footer-note panel">
        <h3>MVP honesty</h3>
        <p>
          This scaffold currently uses a mock provider for local development. The backend is intentionally structured so a real
          BirdNET-style model can replace it without changing the frontend contract.
        </p>
      </section>
    </main>
  )
}

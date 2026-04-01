import { useEffect, useMemo, useState } from 'react'
import { identifyBird } from './api'
import { Recorder } from './components/Recorder'
import { ResultCard } from './components/ResultCard'
import { UploadForm } from './components/UploadForm'
import type { BeforeInstallPromptEvent, IdentifyResponse } from './types'

const phoneTips = [
  'Stand still for 5–15 seconds and point the mic toward the loudest bird.',
  'If wind or traffic is heavy, move closer instead of recording longer.',
  'Upload a saved voice memo if your browser blocks live recording.',
]

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<IdentifyResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installState, setInstallState] = useState<'idle' | 'installing' | 'installed'>('idle')

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => {
      setInstallState('installed')
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

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

  const selectedLabel = useMemo(() => {
    if (!selectedFile) return 'No clip picked yet'
    const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(1)
    return `${selectedFile.name} · ${sizeMb} MB`
  }, [selectedFile])

  const handleInstall = async () => {
    if (!installPrompt) return
    setInstallState('installing')
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallPrompt(null)
    setInstallState(choice.outcome === 'accepted' ? 'installed' : 'idle')
  }

  return (
    <main className="app-shell">
      <section className="hero card card-hero">
        <div>
          <p className="eyebrow">Birdsong ID MVP</p>
          <h1>Bird ID that feels at home on your phone</h1>
          <p className="lede">
            Record a quick clip outside, or upload an existing one, and get a ranked species guess from the local API.
          </p>
        </div>

        <div className="hero-actions">
          <div className="pill">📱 Phone-first layout</div>
          <div className="pill">🎙️ Live recording</div>
          <div className="pill">🪶 Installable web app basics</div>
        </div>

        {installPrompt ? (
          <button className="secondary" onClick={handleInstall} disabled={installState === 'installing'}>
            {installState === 'installing' ? 'Opening install prompt…' : 'Install app'}
          </button>
        ) : installState === 'installed' ? (
          <div className="install-note success">App installed. You can launch it from your home screen.</div>
        ) : (
          <div className="install-note muted">Tip: use Add to Home Screen in your browser if no install button appears.</div>
        )}
      </section>

      <section className="card workflow-card">
        <div>
          <p className="section-label">Quick field flow</p>
          <h2>Capture, identify, compare</h2>
        </div>
        <ol className="step-list">
          <li>Grab a short clean clip.</li>
          <li>Upload it or record in the browser.</li>
          <li>Check the top match, alternatives, and tips.</li>
        </ol>
      </section>

      <section className="input-grid">
        <UploadForm onSelect={runIdentification} />
        <Recorder onRecorded={runIdentification} />
      </section>

      <section className="meta-grid">
        <div className="card compact-card">
          <p className="section-label">Current clip</p>
          <strong>{selectedLabel}</strong>
        </div>

        <div className="card compact-card">
          <p className="section-label">Best use on phone</p>
          <ul>
            {phoneTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </section>

      {loading ? <div className="status">Analyzing bird song…</div> : null}
      {error ? <div className="status error">{error}</div> : null}
      {result ? <ResultCard result={result} /> : null}

      <section className="footer-note card">
        <h3>MVP honesty</h3>
        <p>
          This scaffold still uses a mock provider for local development. The installability and mobile UX work here is groundwork so the real BirdNET-style model can slot in later without redoing the shell.
        </p>
      </section>
    </main>
  )
}

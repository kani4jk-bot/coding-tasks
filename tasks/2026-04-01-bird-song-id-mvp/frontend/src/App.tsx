import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { identifyBird } from './api'
import { Recorder } from './components/Recorder'
import { ResultCard } from './components/ResultCard'
import { UploadForm } from './components/UploadForm'
import type { BeforeInstallPromptEvent, IdentifyOptions, IdentifyResponse } from './types'

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
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [recordedOn, setRecordedOn] = useState('')

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

  const buildOptions = (): IdentifyOptions => ({
    latitude: latitude.trim() === '' ? undefined : Number(latitude),
    longitude: longitude.trim() === '' ? undefined : Number(longitude),
    recordedOn: recordedOn || undefined,
  })

  const runIdentification = async (file: File) => {
    setSelectedFile(file)
    setLoading(true)
    setError(null)

    try {
      const response = await identifyBird(file, buildOptions())
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

  const statusMessage = useMemo(() => {
    if (loading) return 'Analyzing bird song…'
    if (error) return error
    if (result) return `Ready · top match ${result.top_match.common_name}`
    return 'Waiting for a recording or upload'
  }, [error, loading, result])

  const handleInstall = async () => {
    if (!installPrompt) return
    setInstallState('installing')
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallPrompt(null)
    setInstallState(choice.outcome === 'accepted' ? 'installed' : 'idle')
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not available in this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(5))
        setLongitude(position.coords.longitude.toFixed(5))
      },
      (geoError) => setError(geoError.message),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRecordedOn(event.target.value)
  }

  return (
    <main className="app-shell">
      <section className="hero-stack">
        <section className="hero card card-hero">
          <div className="hero-topline">
            <p className="eyebrow">Birdsong ID MVP</p>
            <div className="hero-badge">Mobile field kit</div>
          </div>

          <div>
            <h1>Find the bird behind the song</h1>
            <p className="lede">
              Record a quick clip outside, or upload an existing one, and get a ranked species guess from the local API.
            </p>
          </div>

          <div className="hero-actions">
            <div className="pill">📱 Clean phone layout</div>
            <div className="pill">🎙️ Fast capture</div>
            <div className="pill">🪶 Ranked matches</div>
          </div>

          <div className="hero-footer">
            {installPrompt ? (
              <button className="secondary" onClick={handleInstall} disabled={installState === 'installing'}>
                {installState === 'installing' ? 'Opening install prompt…' : 'Install app'}
              </button>
            ) : installState === 'installed' ? (
              <div className="install-note success">App installed. You can launch it from your home screen.</div>
            ) : (
              <div className="install-note muted">Tip: use Add to Home Screen in your browser if no install button appears.</div>
            )}
          </div>
        </section>

        <section className="status-strip card">
          <div>
            <p className="section-label">Session status</p>
            <strong>{statusMessage}</strong>
          </div>
          <div className="status-pills">
            <span className={`state-pill ${loading ? 'active' : ''}`}>Listening</span>
            <span className={`state-pill ${result ? 'success' : ''}`}>Results</span>
            <span className={`state-pill ${error ? 'error' : ''}`}>Alerts</span>
          </div>
        </section>
      </section>

      <section className="card workflow-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Quick field flow</p>
            <h2>Capture, identify, compare</h2>
          </div>
          <span className="section-chip">3 steps</span>
        </div>
        <ol className="step-list step-cards">
          <li>
            <strong>Capture</strong>
            <span>Grab a short clean clip.</span>
          </li>
          <li>
            <strong>Add context</strong>
            <span>Location and date help narrow species.</span>
          </li>
          <li>
            <strong>Compare</strong>
            <span>Review the top match and alternates.</span>
          </li>
        </ol>
      </section>

      <section className="card context-card">
        <div className="section-heading">
          <div>
            <p className="section-label">Helpful context</p>
            <h2>Give the model a better shot</h2>
            <p className="muted">Optional, but useful when nearby species sound similar.</p>
          </div>
          <span className="section-chip muted-chip">Optional</span>
        </div>

        <div className="context-grid">
          <label>
            <span>Latitude</span>
            <input value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="37.7749" inputMode="decimal" />
          </label>
          <label>
            <span>Longitude</span>
            <input value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="-122.4194" inputMode="decimal" />
          </label>
          <label>
            <span>Recording date</span>
            <input type="date" value={recordedOn} onChange={handleDateChange} />
          </label>
          <div className="context-actions">
            <button className="secondary" type="button" onClick={handleUseMyLocation}>
              Use my location
            </button>
          </div>
        </div>
      </section>

      <section className="input-grid">
        <UploadForm onSelect={runIdentification} />
        <Recorder onRecorded={runIdentification} />
      </section>

      <section className="meta-grid">
        <div className="card compact-card current-clip-card">
          <p className="section-label">Current clip</p>
          <strong>{selectedLabel}</strong>
          <p className="small muted">New recordings and uploads automatically replace the previous clip.</p>
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

      {loading ? <div className="status status-info">Analyzing bird song… This can take a few seconds.</div> : null}
      {error ? <div className="status error">{error}</div> : null}
      {result ? <ResultCard result={result} /> : null}

      <section className="footer-note card">
        <h3>MVP honesty</h3>
        <p>
          Mock mode still exists for local scaffolding, but the backend now has a real BirdNET integration path with ffmpeg normalization and optional location/date context.
        </p>
      </section>
    </main>
  )
}

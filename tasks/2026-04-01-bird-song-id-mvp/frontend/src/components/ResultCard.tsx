import type { IdentifyResponse, SpeciesPrediction } from '../types'

type ResultCardProps = {
  result: IdentifyResponse
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="confidence-track" aria-hidden="true">
      <div className="confidence-fill" style={{ width: `${Math.max(6, Math.round(value * 100))}%` }} />
    </div>
  )
}

function AlternativeRow({ item }: { item: SpeciesPrediction }) {
  return (
    <li className="alternative-row">
      <div>
        <strong>{item.common_name}</strong>
        <div className="scientific small">{item.scientific_name}</div>
      </div>
      <div className="alternative-confidence">
        <span>{formatConfidence(item.confidence)}</span>
        <ConfidenceBar value={item.confidence} />
      </div>
    </li>
  )
}

export function ResultCard({ result }: ResultCardProps) {
  return (
    <section className="results">
      <div className="result-hero card">
        <div className="result-hero-top">
          <div>
            <p className="eyebrow">Best match</p>
            <h2>{result.top_match.common_name}</h2>
            <p className="scientific">{result.top_match.scientific_name}</p>
          </div>
          <div className="hero-score">
            <span>Confidence</span>
            <strong>{formatConfidence(result.top_match.confidence)}</strong>
          </div>
        </div>

        <ConfidenceBar value={result.top_match.confidence} />
        <p className="reason">{result.top_match.reason}</p>
      </div>

      <div className="result-grid">
        <div className="card panel">
          <div className="section-heading tight">
            <h3>Alternatives</h3>
            <span className="section-chip">{result.alternatives.length}</span>
          </div>
          {result.alternatives.length === 0 ? (
            <p>No alternatives returned.</p>
          ) : (
            <ul className="alternatives-list">
              {result.alternatives.map((item) => (
                <AlternativeRow key={item.species_code} item={item} />
              ))}
            </ul>
          )}
        </div>

        <div className="card panel">
          <div className="section-heading tight">
            <h3>Capture tips</h3>
            <span className="section-chip muted-chip">{result.provider}</span>
          </div>
          <ul className="tips-list">
            {result.advice.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <p className="small muted">Inference provider: {result.provider}</p>
        </div>
      </div>
    </section>
  )
}

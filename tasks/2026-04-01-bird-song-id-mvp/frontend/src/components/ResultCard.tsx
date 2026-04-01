import type { IdentifyResponse } from '../types'

type ResultCardProps = {
  result: IdentifyResponse
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`
}

export function ResultCard({ result }: ResultCardProps) {
  return (
    <section className="results">
      <div className="result-hero">
        <p className="eyebrow">Best match</p>
        <h2>{result.top_match.common_name}</h2>
        <p className="scientific">{result.top_match.scientific_name}</p>
        <p className="confidence">Confidence: {formatConfidence(result.top_match.confidence)}</p>
        <p className="reason">{result.top_match.reason}</p>
      </div>

      <div className="result-grid">
        <div className="panel">
          <h3>Alternatives</h3>
          {result.alternatives.length === 0 ? (
            <p>No alternatives returned.</p>
          ) : (
            <ul>
              {result.alternatives.map((item) => (
                <li key={item.species_code}>
                  <strong>{item.common_name}</strong> — {formatConfidence(item.confidence)}
                  <div className="scientific small">{item.scientific_name}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3>Capture tips</h3>
          <ul>
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

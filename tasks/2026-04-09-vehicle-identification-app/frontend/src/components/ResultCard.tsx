import type { IdentifyResponse } from '../types'

type Props = {
  result: IdentifyResponse
}

const confidenceBadge: Record<string, string> = {
  high: 'badge badge-high',
  medium: 'badge badge-medium',
  low: 'badge badge-low',
}

export function ResultCard({ result }: Props) {
  const { summary, top_match, alternatives } = result
  const match = top_match

  const label = [match.make, match.model, match.year_range].filter(Boolean).join(' · ') || match.vehicle_type

  return (
    <article className="card result-card">
      <div className="result-header">
        <h2>{summary.headline}</h2>
        <span className={confidenceBadge[summary.confidence_band] ?? 'badge'}>
          {summary.confidence_band} confidence
        </span>
      </div>

      <p className="result-description">{summary.short_description}</p>

      <div className="result-section">
        <h3>Top match</h3>
        <p className="result-name">{label}</p>
        {match.country_of_origin && (
          <p className="result-meta">Origin: {match.country_of_origin}</p>
        )}
        {match.reason && <p className="result-reason">{match.reason}</p>}
      </div>

      {Object.keys(match.specs).length > 0 && (
        <div className="result-section">
          <h3>Specs</h3>
          <dl className="specs-grid">
            {Object.entries(match.specs).map(([key, val]) => (
              <div key={key} className="spec-row">
                <dt>{key}</dt>
                <dd>{val}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {match.fun_facts.length > 0 && (
        <div className="result-section">
          <h3>Fun facts</h3>
          <ul className="facts-list">
            {match.fun_facts.map((fact, i) => (
              <li key={i}>{fact}</li>
            ))}
          </ul>
        </div>
      )}

      {match.brief_history && (
        <div className="result-section">
          <h3>History</h3>
          <p>{match.brief_history}</p>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="result-section">
          <h3>Other possibilities</h3>
          <ul className="alternatives-list">
            {alternatives.map((alt, i) => {
              const altLabel = [alt.make, alt.model, alt.year_range].filter(Boolean).join(' ') || alt.vehicle_type
              return (
                <li key={i}>
                  <span className="alt-name">{altLabel}</span>
                  <span className="alt-conf">{Math.round(alt.confidence * 100)}%</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </article>
  )
}

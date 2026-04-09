import type { IdentifyResponse } from '../types'

const CONFIDENCE_META = {
  high: { label: 'High confidence', cls: 'confidence-high' },
  medium: { label: 'Medium confidence', cls: 'confidence-medium' },
  low: { label: 'Low confidence', cls: 'confidence-low' },
}

const CATEGORY_ICONS: Record<string, string> = {
  Light: '☀️',
  Watering: '💧',
  Soil: '🪱',
  Humidity: '💨',
  Fertilizing: '🌿',
  Temperature: '🌡️',
  Pruning: '✂️',
  Repotting: '🪴',
}

type Props = {
  result: IdentifyResponse
}

export function ResultCard({ result }: Props) {
  const plant = result.result
  const conf = CONFIDENCE_META[plant.confidence]

  return (
    <div className="result-section">
      <div className="card result-header-card">
        <div className="plant-name-block">
          <h2>{plant.common_name}</h2>
          <p className="scientific-name">{plant.scientific_name}</p>
        </div>
        <span className={`confidence-badge ${conf.cls}`}>{conf.label}</span>
        <p className="plant-description">{plant.description}</p>
      </div>

      <div className="card fun-facts-card">
        <h3>Fun facts</h3>
        <ul className="fun-facts-list">
          {plant.fun_facts.map((fact, i) => (
            <li key={i}>{fact}</li>
          ))}
        </ul>
      </div>

      {plant.is_houseplant && plant.growing_tips.length > 0 && (
        <div className="card growing-tips-card">
          <h3>How to grow at home</h3>
          <div className="tips-grid">
            {plant.growing_tips.map((tip, i) => (
              <div key={i} className="tip-item">
                <div className="tip-header">
                  <span className="tip-icon">{CATEGORY_ICONS[tip.category] ?? '🌱'}</span>
                  <strong>{tip.category}</strong>
                </div>
                <p>{tip.tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

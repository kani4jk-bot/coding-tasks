import type { Segment, SegmentType } from '../types';

interface Props {
  segment: Segment;
  onDelete: (id: number) => void;
}

const TYPE_META: Record<SegmentType, { icon: string; label: string; color: string }> = {
  flight:     { icon: '✈️', label: 'Flight',     color: '#3b82f6' },
  hotel:      { icon: '🏨', label: 'Hotel',      color: '#8b5cf6' },
  airbnb:     { icon: '🏠', label: 'Airbnb',     color: '#ef4444' },
  car_rental: { icon: '🚗', label: 'Car Rental', color: '#f59e0b' },
  activity:   { icon: '🎭', label: 'Activity',   color: '#10b981' },
  train:      { icon: '🚂', label: 'Train',      color: '#06b6d4' },
  cruise:     { icon: '🚢', label: 'Cruise',     color: '#0ea5e9' },
  other:      { icon: '📌', label: 'Other',      color: '#6b7280' },
};

function fmtTime(dt: string): string {
  try {
    const d = new Date(dt);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

function fmtDateTime(dt: string): string {
  try {
    const d = new Date(dt);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch {
    return dt;
  }
}

function duration(start: string, end: string): string {
  try {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms <= 0) return '';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  } catch {
    return '';
  }
}

export default function SegmentCard({ segment, onDelete }: Props) {
  const meta = TYPE_META[segment.type] ?? TYPE_META.other;

  return (
    <div className="segment-card">
      <div className="segment-card-accent" style={{ background: meta.color }} />
      <div className="segment-card-body">
        <div className="segment-card-header">
          <div>
            <span
              className="segment-type-badge"
              style={{
                background: `${meta.color}18`,
                color: meta.color,
              }}
            >
              {meta.icon} {meta.label}
            </span>
          </div>
          <div className="segment-card-actions">
            <button
              className="btn-delete-seg"
              onClick={() => onDelete(segment.id)}
              title="Remove segment"
            >
              ×
            </button>
          </div>
        </div>

        <div className="segment-title">{segment.title}</div>

        {/* Flight / Train route */}
        {(segment.origin || segment.destination) && (
          <div className="segment-route">
            {segment.origin && <span>{segment.origin}</span>}
            {segment.origin && segment.destination && (
              <span className="segment-route-arrow">→</span>
            )}
            {segment.destination && <span>{segment.destination}</span>}
          </div>
        )}

        <div className="segment-details">
          {/* Time */}
          <div className="segment-detail">
            <span className="segment-detail-icon">🕐</span>
            <span>
              {fmtTime(segment.start_datetime)}
              {segment.end_datetime && segment.type === 'flight' && (
                <> → {fmtTime(segment.end_datetime)}</>
              )}
            </span>
          </div>

          {/* Duration for flights */}
          {segment.type === 'flight' && segment.end_datetime && (
            <div className="segment-detail">
              <span className="segment-detail-icon">⏱</span>
              <span>{duration(segment.start_datetime, segment.end_datetime)}</span>
            </div>
          )}

          {/* Airline + flight number */}
          {segment.airline && (
            <div className="segment-detail">
              <span className="segment-detail-icon">✈</span>
              <span>
                {segment.airline}
                {segment.flight_number && ` · ${segment.flight_number}`}
              </span>
            </div>
          )}

          {/* Location (hotels, activities) */}
          {segment.location && (
            <div className="segment-detail">
              <span className="segment-detail-icon">📍</span>
              <span>{segment.location}</span>
            </div>
          )}

          {/* Check-out time for hotels */}
          {segment.end_datetime && ['hotel', 'airbnb', 'car_rental'].includes(segment.type) && (
            <div className="segment-detail">
              <span className="segment-detail-icon">📅</span>
              <span>Until {fmtDateTime(segment.end_datetime)}</span>
            </div>
          )}
        </div>

        {/* Confirmation number */}
        {segment.confirmation_number && (
          <div className="segment-confirmation">
            # {segment.confirmation_number}
          </div>
        )}

        {/* Notes */}
        {segment.notes && (
          <div className="segment-notes">{segment.notes}</div>
        )}
      </div>
    </div>
  );
}

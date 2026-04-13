import { useState, useEffect, useCallback } from 'react';
import { getTrips, updateTrip, deleteTrip, deleteSegment } from './api';
import type { Trip } from './types';
import EmailModal from './components/EmailModal';
import SegmentCard from './components/SegmentCard';

// ── Date helpers ───────────────────────────────────────────────────────────

function fmtDate(s: string): string {
  try {
    const d = new Date(s + (s.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return s;
  }
}

function fmtDateShort(s: string): string {
  try {
    const d = new Date(s + (s.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return s;
  }
}

function fmtTripDates(trip: Trip): string {
  if (!trip.start_date) return '';
  if (!trip.end_date || trip.end_date === trip.start_date) {
    return fmtDate(trip.start_date);
  }
  const startYear = trip.start_date.slice(0, 4);
  const endYear = trip.end_date.slice(0, 4);
  if (startYear === endYear) {
    return `${fmtDateShort(trip.start_date)} – ${fmtDate(trip.end_date)}`;
  }
  return `${fmtDate(trip.start_date)} – ${fmtDate(trip.end_date)}`;
}

// Group segments by calendar date
function groupByDate(trip: Trip): Record<string, Trip['segments']> {
  const groups: Record<string, Trip['segments']> = {};
  for (const seg of trip.segments) {
    const day = seg.start_datetime.slice(0, 10);
    if (!groups[day]) groups[day] = [];
    groups[day].push(seg);
  }
  return groups;
}

function fmtDayHeader(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'trip' | 'segment'; id: number } | null>(null);

  const selectedTrip = trips.find(t => t.id === selectedId) ?? null;

  const loadTrips = useCallback(async () => {
    try {
      const data = await getTrips();
      setTrips(data);
      if (data.length > 0 && selectedId === null) {
        setSelectedId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load trips:', e);
    }
  }, [selectedId]);

  useEffect(() => {
    loadTrips();
  }, []);

  function handleParsed(trip: Trip) {
    setTrips(prev => {
      const idx = prev.findIndex(t => t.id === trip.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = trip;
        return updated;
      }
      return [trip, ...prev];
    });
    setSelectedId(trip.id);
  }

  async function handleRenameSubmit() {
    if (!selectedTrip || !nameInput.trim()) {
      setEditingName(false);
      return;
    }
    try {
      const updated = await updateTrip(selectedTrip.id, nameInput.trim());
      setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (e) {
      console.error('Rename failed:', e);
    }
    setEditingName(false);
  }

  async function handleDeleteTrip(id: number) {
    try {
      await deleteTrip(id);
      setTrips(prev => prev.filter(t => t.id !== id));
      if (selectedId === id) {
        const remaining = trips.filter(t => t.id !== id);
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (e) {
      console.error('Delete trip failed:', e);
    }
  }

  async function handleDeleteSegment(segId: number) {
    try {
      await deleteSegment(segId);
      // Reload trips since a segment deletion may delete the trip too
      const data = await getTrips();
      setTrips(data);
      if (selectedId !== null && !data.find(t => t.id === selectedId)) {
        setSelectedId(data.length > 0 ? data[0].id : null);
      }
    } catch (e) {
      console.error('Delete segment failed:', e);
    }
  }

  function startEdit() {
    if (!selectedTrip) return;
    setNameInput(selectedTrip.name);
    setEditingName(true);
  }

  const dayGroups = selectedTrip ? groupByDate(selectedTrip) : {};
  const sortedDays = Object.keys(dayGroups).sort();

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">✈️</div>
            <span className="sidebar-logo-text">Travel Planner</span>
          </div>
          <button className="add-email-btn" onClick={() => setShowModal(true)}>
            + Add from Email
          </button>
        </div>

        <div className="sidebar-section-label">My Trips</div>

        <div className="trip-list">
          {trips.length === 0 && (
            <div style={{ padding: '12px', color: 'var(--text-on-dark-muted)', fontSize: '13px', textAlign: 'center' }}>
              No trips yet. Add a booking email to get started.
            </div>
          )}
          {trips.map(trip => (
            <div
              key={trip.id}
              className={`trip-list-item${trip.id === selectedId ? ' active' : ''}`}
              onClick={() => setSelectedId(trip.id)}
            >
              <div className="trip-list-item-name">{trip.name}</div>
              <div className="trip-list-item-meta">
                {trip.start_date && <span>{fmtTripDates(trip)}</span>}
                {trip.start_date && trip.segments.length > 0 && <span className="trip-dot" />}
                {trip.segments.length > 0 && (
                  <span>{trip.segments.length} item{trip.segments.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main">
        {!selectedTrip ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗺️</div>
            <h2>Plan your next adventure</h2>
            <p>
              Forward or paste booking confirmation emails and we'll automatically
              organize your flights, hotels, and activities into a beautiful itinerary.
            </p>
            <button className="empty-state-btn" onClick={() => setShowModal(true)}>
              + Add from Email
            </button>
          </div>
        ) : (
          <>
            {/* Trip header */}
            <div className="trip-header">
              <div className="trip-header-top">
                <div className="trip-title-row">
                  {editingName ? (
                    <input
                      className="trip-name-input"
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onBlur={handleRenameSubmit}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameSubmit();
                        if (e.key === 'Escape') setEditingName(false);
                      }}
                      autoFocus
                    />
                  ) : (
                    <h1 className="trip-name">{selectedTrip.name}</h1>
                  )}
                </div>
                <div className="trip-header-actions">
                  <span className="segment-count-badge">
                    {selectedTrip.segments.length} item{selectedTrip.segments.length !== 1 ? 's' : ''}
                  </span>
                  <button className="btn-icon" onClick={startEdit} title="Rename trip">✏️</button>
                  <button
                    className="btn-icon danger"
                    onClick={() => setConfirmDelete({ type: 'trip', id: selectedTrip.id })}
                    title="Delete trip"
                  >
                    🗑
                  </button>
                </div>
              </div>
              {(selectedTrip.start_date) && (
                <div className="trip-dates">{fmtTripDates(selectedTrip)}</div>
              )}
            </div>

            {/* Timeline */}
            <div className="timeline">
              {selectedTrip.segments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  No segments yet for this trip.
                </div>
              ) : (
                sortedDays.map(day => (
                  <div key={day} className="timeline-day">
                    <div className="timeline-date">{fmtDayHeader(day)}</div>
                    <div className="timeline-day-segments">
                      {dayGroups[day].map(seg => (
                        <SegmentCard
                          key={seg.id}
                          segment={seg}
                          onDelete={id => setConfirmDelete({ type: 'segment', id })}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* ── Modals ── */}
      {showModal && (
        <EmailModal
          onClose={() => setShowModal(false)}
          onParsed={handleParsed}
        />
      )}

      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3>
              {confirmDelete.type === 'trip' ? 'Delete trip?' : 'Remove segment?'}
            </h3>
            <p>
              {confirmDelete.type === 'trip'
                ? 'This will permanently delete the trip and all its segments.'
                : 'This segment will be removed from the trip.'}
            </p>
            <div className="confirm-actions">
              <button className="btn-confirm-cancel" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                className="btn-confirm-delete"
                onClick={async () => {
                  const c = confirmDelete;
                  setConfirmDelete(null);
                  if (c.type === 'trip') await handleDeleteTrip(c.id);
                  else await handleDeleteSegment(c.id);
                }}
              >
                {confirmDelete.type === 'trip' ? 'Delete Trip' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

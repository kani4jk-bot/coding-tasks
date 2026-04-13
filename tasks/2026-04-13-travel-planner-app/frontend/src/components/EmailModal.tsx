import { useState } from 'react';
import { parseEmail } from '../api';
import type { Trip } from '../types';

interface Props {
  onClose: () => void;
  onParsed: (trip: Trip) => void;
}

const PLACEHOLDER = `Paste your booking confirmation email here...

Example:
Your flight is confirmed!
Flight: AA 123
From: New York (JFK) → Los Angeles (LAX)
Departure: April 15, 2026 at 8:30 AM
Arrival: April 15, 2026 at 11:45 AM
Confirmation: ABC123`;

export default function EmailModal({ onClose, onParsed }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await parseEmail(text);
      if (!result.trip) {
        setError(result.message ?? 'No travel segments found. Try pasting a booking confirmation email.');
        return;
      }
      onParsed(result.trip);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">✉️ Add from Email</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <label className="modal-label">Email Content</label>
          <p className="modal-hint">
            Paste a booking confirmation email (flight, hotel, Airbnb, car rental, etc.).
            Claude will automatically extract the travel details.
          </p>
          <textarea
            className="email-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            autoFocus
          />
          {error && <div className="modal-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="modal-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="modal-parse-btn"
            onClick={handleParse}
            disabled={!text.trim() || loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Parsing...
              </>
            ) : (
              '✨ Extract Travel Info'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

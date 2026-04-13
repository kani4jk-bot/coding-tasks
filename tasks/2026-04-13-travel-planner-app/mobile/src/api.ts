import { Trip } from './types';

const BASE = (process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:8000').replace(/\/$/, '');

export async function fetchTrips(): Promise<Trip[]> {
  const res = await fetch(`${BASE}/api/trips`);
  if (!res.ok) throw new Error('Failed to fetch trips');
  return res.json();
}

export async function fetchTrip(id: number): Promise<Trip> {
  const res = await fetch(`${BASE}/api/trips/${id}`);
  if (!res.ok) throw new Error('Failed to fetch trip');
  return res.json();
}

export async function parseEmail(emailText: string): Promise<{ trip: Trip | null; segments: unknown[] }> {
  const res = await fetch(`${BASE}/api/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_text: emailText }),
  });
  if (!res.ok) throw new Error('Failed to parse email');
  return res.json();
}

export async function renameTrip(id: number, name: string): Promise<Trip> {
  const res = await fetch(`${BASE}/api/trips/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to rename trip');
  return res.json();
}

export async function deleteTrip(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/trips/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete trip');
}

export async function deleteSegment(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/segments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete segment');
}

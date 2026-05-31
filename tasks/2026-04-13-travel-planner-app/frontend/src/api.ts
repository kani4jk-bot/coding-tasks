import type { Trip } from './types';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:8000';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.detail) message = parsed.detail;
    } catch {
      // not JSON — use raw text
    }
    throw new Error(message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function parseEmail(emailText: string): Promise<{ segments: unknown[]; trip: Trip | null; message?: string }> {
  return req('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email_text: emailText }),
  });
}

export async function getTrips(): Promise<Trip[]> {
  return req('/api/trips');
}

export async function updateTrip(id: number, name: string): Promise<Trip> {
  return req(`/api/trips/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function deleteTrip(id: number): Promise<void> {
  await req(`/api/trips/${id}`, { method: 'DELETE' });
}

export async function deleteSegment(id: number): Promise<void> {
  await req(`/api/segments/${id}`, { method: 'DELETE' });
}

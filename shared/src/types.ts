// ─── Loading / async state ───────────────────────────────────────────────────

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  status: LoadingState;
}

export function initialState<T>(): AsyncState<T> {
  return { data: null, error: null, status: 'idle' };
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// ─── Convenience aliases ─────────────────────────────────────────────────────

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// ─── Common app types ────────────────────────────────────────────────────────

export interface IdentificationResult {
  label: string;
  confidence: number;
  description?: string;
  imageUrl?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

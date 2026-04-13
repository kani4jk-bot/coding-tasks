export type SegmentType =
  | 'flight'
  | 'hotel'
  | 'airbnb'
  | 'car_rental'
  | 'activity'
  | 'train'
  | 'cruise'
  | 'other';

export interface Segment {
  id: number;
  trip_id: number;
  type: SegmentType;
  title: string;
  confirmation_number?: string | null;
  start_datetime: string;
  end_datetime?: string | null;
  origin?: string | null;
  destination?: string | null;
  location?: string | null;
  airline?: string | null;
  flight_number?: string | null;
  notes?: string | null;
}

export interface Trip {
  id: number;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  segments: Segment[];
}

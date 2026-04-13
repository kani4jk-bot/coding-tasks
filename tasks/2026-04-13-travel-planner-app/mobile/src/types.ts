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
  confirmation_number?: string;
  start_datetime: string;
  end_datetime?: string;
  origin?: string;
  destination?: string;
  location?: string;
  airline?: string;
  flight_number?: string;
  notes?: string;
}

export interface Trip {
  id: number;
  name: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  segments: Segment[];
}

export type RootStackParamList = {
  Trips: undefined;
  TripDetail: { tripId: number; tripName: string };
};

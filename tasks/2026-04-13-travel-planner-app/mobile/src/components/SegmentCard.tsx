import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Segment, SegmentType } from '../types';

const TYPE_COLORS: Record<SegmentType, string> = {
  flight: '#3b82f6',
  hotel: '#8b5cf6',
  airbnb: '#f59e0b',
  car_rental: '#10b981',
  activity: '#f97316',
  train: '#06b6d4',
  cruise: '#0ea5e9',
  other: '#6b7280',
};

const TYPE_LABELS: Record<SegmentType, string> = {
  flight: '✈️ Flight',
  hotel: '🏨 Hotel',
  airbnb: '🏠 Airbnb',
  car_rental: '🚗 Car Rental',
  activity: '🎯 Activity',
  train: '🚂 Train',
  cruise: '🚢 Cruise',
  other: '📌 Other',
};

function formatTime(dt?: string): string {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return '';
  try {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs <= 0) return '';
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  } catch {
    return '';
  }
}

interface Props {
  segment: Segment;
  onDelete?: (id: number) => void;
}

export default function SegmentCard({ segment, onDelete }: Props) {
  const color = TYPE_COLORS[segment.type] ?? TYPE_COLORS.other;
  const label = TYPE_LABELS[segment.type] ?? TYPE_LABELS.other;
  const duration = formatDuration(segment.start_datetime, segment.end_datetime);

  function confirmDelete() {
    Alert.alert('Delete segment?', segment.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(segment.id) },
    ]);
  }

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: color + '22' }]}>
          <Text style={[styles.badgeText, { color }]}>{label}</Text>
        </View>
        {onDelete && (
          <TouchableOpacity onPress={confirmDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.deleteBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>{segment.title}</Text>

      {(segment.origin || segment.destination) && (
        <Text style={styles.route}>
          {segment.origin}
          {segment.origin && segment.destination ? ' → ' : ''}
          {segment.destination}
        </Text>
      )}

      {segment.location && !segment.origin && !segment.destination && (
        <Text style={styles.meta}>📍 {segment.location}</Text>
      )}

      <View style={styles.row}>
        {segment.start_datetime && (
          <Text style={styles.meta}>{formatTime(segment.start_datetime)}</Text>
        )}
        {segment.end_datetime && (
          <Text style={styles.meta}> – {formatTime(segment.end_datetime)}</Text>
        )}
        {duration ? <Text style={styles.meta}>  ·  {duration}</Text> : null}
      </View>

      {segment.airline && (
        <Text style={styles.meta}>{segment.airline}{segment.flight_number ? ` · ${segment.flight_number}` : ''}</Text>
      )}

      {segment.confirmation_number && (
        <Text style={styles.confirmation}>Conf: {segment.confirmation_number}</Text>
      )}

      {segment.notes && <Text style={styles.notes}>{segment.notes}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteBtn: {
    color: '#9ca3af',
    fontSize: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  route: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  confirmation: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  notes: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

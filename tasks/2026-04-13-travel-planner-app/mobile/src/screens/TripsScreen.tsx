import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { deleteTrip, fetchTrips } from '../api';
import { RootStackParamList, Trip } from '../types';
import EmailModal from '../components/EmailModal';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Trips'>;

function formatDateRange(start?: string, end?: string): string {
  if (!start) return '';
  try {
    const s = new Date(start + 'T00:00:00');
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (!end || end === start) return s.toLocaleDateString(undefined, { ...opts, year: 'numeric' });
    const e = new Date(end + 'T00:00:00');
    const sameYear = s.getFullYear() === e.getFullYear();
    return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, sameYear ? opts : { ...opts, year: 'numeric' })}`;
  } catch {
    return start;
  }
}

export default function TripsScreen() {
  const navigation = useNavigation<Nav>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  async function load(showSpinner = false) {
    if (showSpinner) setLoading(true);
    try {
      const data = await fetchTrips();
      setTrips(data.sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? '')));
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  function confirmDelete(trip: Trip) {
    Alert.alert('Delete trip?', `"${trip.name}" and all its segments will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTrip(trip.id);
          setTrips((prev) => prev.filter((t) => t.id !== trip.id));
        },
      },
    ]);
  }

  function renderTrip({ item }: { item: Trip }) {
    const dateRange = formatDateRange(item.start_date, item.end_date);
    const count = item.segments.length;
    return (
      <TouchableOpacity
        style={styles.tripCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('TripDetail', { tripId: item.id, tripName: item.name })}
        onLongPress={() => confirmDelete(item)}
      >
        <View style={styles.tripCardLeft}>
          <Text style={styles.tripName}>{item.name}</Text>
          {dateRange ? <Text style={styles.tripDate}>{dateRange}</Text> : null}
          <Text style={styles.tripMeta}>{count} segment{count !== 1 ? 's' : ''}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => String(t.id)}
          renderItem={renderTrip}
          contentContainerStyle={trips.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✈️</Text>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptyHint}>Tap the button below to add your first booking email.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+ Add Email</Text>
      </TouchableOpacity>

      <EmailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={(trip) => {
          load();
          navigation.navigate('TripDetail', { tripId: trip.id, tripName: trip.name });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tripCardLeft: { flex: 1 },
  tripName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 3 },
  tripDate: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  tripMeta: { fontSize: 12, color: '#9ca3af' },
  chevron: { fontSize: 22, color: '#d1d5db', marginLeft: 8 },
  empty: { alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptyHint: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

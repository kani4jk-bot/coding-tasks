import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { deleteSegment, deleteTrip, fetchTrip, renameTrip } from '../api';
import { RootStackParamList, Segment, Trip } from '../types';
import SegmentCard from '../components/SegmentCard';
import EmailModal from '../components/EmailModal';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TripDetail'>;
type Route = RouteProp<RootStackParamList, 'TripDetail'>;

interface Section {
  title: string;
  data: Segment[];
}

function dateLabel(dt: string): string {
  try {
    const d = new Date(dt);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dt.slice(0, 10);
  }
}

function groupByDay(segments: Segment[]): Section[] {
  const map = new Map<string, Segment[]>();
  for (const seg of segments) {
    const key = seg.start_datetime?.slice(0, 10) ?? 'Unknown';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(seg);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => ({
      title: key === 'Unknown' ? 'Unknown Date' : dateLabel(key + 'T00:00:00'),
      data,
    }));
}

export default function TripDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchTrip(tripId);
      setTrip(data);
      navigation.setOptions({ title: data.name });
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function handleRename() {
    if (!nameInput.trim() || !trip) return;
    const updated = await renameTrip(trip.id, nameInput.trim());
    setTrip(updated);
    navigation.setOptions({ title: updated.name });
    setEditing(false);
  }

  async function handleDeleteSegment(id: number) {
    await deleteSegment(id);
    await load();
  }

  function confirmDeleteTrip() {
    if (!trip) return;
    Alert.alert('Delete trip?', `"${trip.name}" and all its segments will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTrip(trip.id);
          navigation.goBack();
        },
      },
    ]);
  }

  if (loading || !trip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const sections = groupByDay(trip.segments);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(seg) => String(seg.id)}
        renderItem={({ item }) => (
          <SegmentCard segment={item} onDelete={handleDeleteSegment} />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.tripHeader}>
            {editing ? (
              <View style={styles.renameRow}>
                <TextInput
                  style={styles.renameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  onSubmitEditing={handleRename}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={handleRename} style={styles.renameConfirm}>
                  <Text style={styles.renameConfirmText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditing(false)} style={styles.renameCancel}>
                  <Text style={styles.renameCancelText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.nameRow}>
                <Text style={styles.tripName}>{trip.name}</Text>
                <TouchableOpacity onPress={() => { setNameInput(trip.name); setEditing(true); }}>
                  <Text style={styles.editIcon}>✏️</Text>
                </TouchableOpacity>
              </View>
            )}

            {(trip.start_date || trip.end_date) && (
              <Text style={styles.tripDates}>
                {trip.start_date}
                {trip.end_date && trip.end_date !== trip.start_date ? ` – ${trip.end_date}` : ''}
              </Text>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                <Text style={styles.addBtnText}>+ Add Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={confirmDeleteTrip}>
                <Text style={styles.deleteBtnText}>Delete Trip</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No segments yet. Add a booking email to get started.</Text>
          </View>
        }
      />

      <EmailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => load()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },
  tripHeader: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  tripName: { fontSize: 20, fontWeight: '700', color: '#111827', flex: 1 },
  editIcon: { fontSize: 16, marginLeft: 8 },
  tripDates: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  renameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  renameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
    color: '#111827',
  },
  renameConfirm: { marginLeft: 8, backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  renameConfirmText: { color: '#fff', fontWeight: '600' },
  renameCancel: { marginLeft: 6, padding: 8 },
  renameCancelText: { color: '#9ca3af', fontSize: 16 },
  actionRow: { flexDirection: 'row', gap: 8 },
  addBtn: {
    flex: 1,
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  addBtnText: { color: '#7c3aed', fontWeight: '600', fontSize: 14 },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 14 },
  sectionHeader: {
    paddingVertical: 6,
    marginBottom: 6,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingTop: 32 },
  emptyText: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
});

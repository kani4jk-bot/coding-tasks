import { useCallback, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { SectionCard } from '../components/SectionCard'
import { getAllIdentifications, removeIdentification } from '../lib/history'
import type { RootStackParamList, SavedIdentification } from '../types'

const CONFIDENCE_COLOR: Record<string, string> = {
  high: '#D1FAE5',
  medium: '#FEF9C3',
  low: '#FEE2E2',
}

function IdentificationRow({
  item,
  onPress,
  onDelete,
}: {
  item: SavedIdentification
  onPress: () => void
  onDelete: () => void
}) {
  const plant = item.result.result
  const bandBg = CONFIDENCE_COLOR[plant.confidence] ?? '#F3F4F6'

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Text style={styles.rowEmoji}>🌿</Text>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName} numberOfLines={1}>{plant.common_name}</Text>
          {item.starred ? <Text style={styles.star}>★</Text> : null}
        </View>
        <Text style={styles.rowSci} numberOfLines={1}>{plant.scientific_name}</Text>
        <Text style={styles.rowDate}>{new Date(item.savedAt).toLocaleDateString()}</Text>
        <View style={[styles.bandPill, { backgroundColor: bandBg }]}>
          <Text style={styles.bandText}>{plant.confidence.toUpperCase()}</Text>
        </View>
      </View>
      <Pressable
        onPress={onDelete}
        hitSlop={16}
        style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.5 }]}
      >
        <Text style={styles.deleteText}>✕</Text>
      </Pressable>
    </Pressable>
  )
}

export function HistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [items, setItems] = useState<SavedIdentification[]>([])

  const refresh = useCallback(async () => {
    const all = await getAllIdentifications()
    setItems(all)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => undefined)
    }, [refresh]),
  )

  const handleDelete = useCallback(
    (item: SavedIdentification) => {
      Alert.alert('Delete result?', `Remove "${item.result.result.common_name}" from history?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeIdentification(item.id)
              .then(refresh)
              .catch(() => undefined)
          },
        },
      ])
    },
    [refresh],
  )

  const starred = items.filter((i) => i.starred)
  const rest = items.filter((i) => !i.starred)

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {items.length === 0 ? (
        <SectionCard eyebrow="History" title="No identifications yet">
          <Text style={styles.empty}>
            Tap the Capture tab, take a photo of any plant, and your results will appear here.
          </Text>
        </SectionCard>
      ) : null}

      {starred.length > 0 ? (
        <SectionCard eyebrow="Starred" title="Your favourites">
          {starred.map((item) => (
            <IdentificationRow
              key={item.id}
              item={item}
              onPress={() => navigation.navigate('Result', { result: item.result })}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </SectionCard>
      ) : null}

      {rest.length > 0 ? (
        <SectionCard eyebrow="Recent" title="All identifications">
          {rest.map((item) => (
            <IdentificationRow
              key={item.id}
              item={item}
              onPress={() => navigation.navigate('Result', { result: item.result })}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </SectionCard>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    backgroundColor: '#F0F8F2',
  },
  empty: {
    color: '#4B5563',
    fontSize: 15,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomColor: '#D1FAE5',
    borderBottomWidth: 1,
  },
  rowPressed: { opacity: 0.65 },
  rowEmoji: { fontSize: 26 },
  rowBody: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowName: { color: '#111827', fontWeight: '700', fontSize: 15, flex: 1 },
  rowSci: { color: '#6B7280', fontSize: 13, fontStyle: 'italic' },
  rowDate: { color: '#9CA3AF', fontSize: 12 },
  star: { color: '#C89820', fontSize: 14 },
  bandPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  bandText: { fontSize: 10, fontWeight: '800', color: '#1A2A1A' },
  deleteButton: { padding: 8 },
  deleteText: { color: '#9CA3AF', fontSize: 16, fontWeight: '700' },
})

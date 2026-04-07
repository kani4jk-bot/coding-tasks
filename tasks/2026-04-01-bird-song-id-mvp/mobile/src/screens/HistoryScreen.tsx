import { useCallback, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { listSightings, removeSighting, toggleStar } from '../lib/history'
import type { RootStackParamList, SavedSighting } from '../types'

export function HistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [items, setItems] = useState<SavedSighting[]>([])

  const refresh = useCallback(async () => {
    setItems(await listSightings())
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => undefined)
    }, [refresh]),
  )

  const starred = items.filter((item) => item.starred)
  const all = items

  const handleToggleStar = useCallback(async (id: string) => {
    await toggleStar(id)
    await refresh()
  }, [refresh])

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete sighting?', 'This removes the result and any notes from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await removeSighting(id); await refresh() } },
    ])
  }, [refresh])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.screenTitle}>Journal</Text>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🪶</Text>
          <Text style={styles.emptyTitle}>No sightings yet</Text>
          <Text style={styles.emptyBody}>Record a clip in Listen and it will appear here.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {starred.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Starred</Text>
              <View style={styles.group}>
                {starred.map((item, i) => (
                  <SightingRow
                    key={`star-${item.id}`}
                    item={item}
                    isLast={i === starred.length - 1}
                    onOpen={() => navigation.navigate('Result', { result: item.result })}
                    onToggleStar={() => { handleToggleStar(item.id).catch(() => undefined) }}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionHeader}>All sightings</Text>
          <View style={styles.group}>
            {all.map((item, i) => (
              <SightingRow
                key={item.id}
                item={item}
                isLast={i === all.length - 1}
                onOpen={() => navigation.navigate('Result', { result: item.result })}
                onToggleStar={() => { handleToggleStar(item.id).catch(() => undefined) }}
                onDelete={() => handleDelete(item.id)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function SightingRow({
  item,
  isLast,
  onOpen,
  onToggleStar,
  onDelete,
}: {
  item: SavedSighting
  isLast: boolean
  onOpen: () => void
  onToggleStar: () => void
  onDelete: () => void
}) {
  const confidence = Math.round(item.result.top_match.confidence * 100)
  const date = new Date(item.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const band = item.result.summary.confidence_band

  return (
    <Pressable style={[styles.row, isLast && styles.rowLast]} onPress={onOpen}>
      <View style={[styles.confidenceDot, band === 'high' ? styles.dotHigh : band === 'medium' ? styles.dotMedium : styles.dotLow]} />
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>{item.result.top_match.common_name}</Text>
        <Text style={styles.rowMeta}>{date} · {confidence}% confidence</Text>
        {item.notes ? <Text style={styles.rowNotePreview} numberOfLines={1}>{item.notes}</Text> : null}
      </View>
      <View style={styles.rowActions}>
        <Pressable style={styles.actionBtn} onPress={onToggleStar} hitSlop={8}>
          <Text style={styles.starIcon}>{item.starred ? '★' : '☆'}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onDelete} hitSlop={8}>
          <Text style={styles.deleteIcon}>✕</Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F1',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#102016',
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A9484',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    marginTop: 16,
    marginBottom: 6,
  },
  group: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBF0E8',
    gap: 12,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  confidenceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  dotHigh: { backgroundColor: '#2E7D32' },
  dotMedium: { backgroundColor: '#F9A825' },
  dotLow: { backgroundColor: '#C62828' },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102016',
  },
  rowMeta: {
    fontSize: 13,
    color: '#7A9484',
    fontWeight: '500',
  },
  rowNotePreview: {
    fontSize: 13,
    color: '#5A4A1B',
    fontStyle: 'italic',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  actionBtn: {
    padding: 6,
  },
  starIcon: {
    fontSize: 20,
    color: '#C06B2D',
  },
  deleteIcon: {
    fontSize: 16,
    color: '#B0B8B4',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 48,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#304237',
  },
  emptyBody: {
    fontSize: 15,
    color: '#7A9484',
    textAlign: 'center',
    lineHeight: 21,
  },
})

import { useCallback, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { SectionCard } from '../components/SectionCard'
import { getAllIdentifications, removeIdentification } from '../lib/history'
import type { RootStackParamList, SavedIdentification } from '../types'

const VEHICLE_TYPE_EMOJI: Record<string, string> = {
  car: '🚗', truck: '🚚', motorcycle: '🏍️', bicycle: '🚲', scooter: '🛵',
  airplane: '✈️', helicopter: '🚁', train: '🚂', boat: '⛵', ship: '🚢',
  bus: '🚌', tractor: '🚜', other: '🚙',
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
  const match = item.result.top_match
  const emoji = VEHICLE_TYPE_EMOJI[match.vehicle_type] ?? '🚗'
  const headline = item.result.summary.headline
  const band = item.result.summary.confidence_band
  const bandStyle = band === 'high' ? styles.bandHigh : band === 'medium' ? styles.bandMedium : styles.bandLow

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowHeadline} numberOfLines={1}>{headline}</Text>
          {item.starred ? <Text style={styles.star}>★</Text> : null}
        </View>
        <Text style={styles.rowDate}>{new Date(item.savedAt).toLocaleDateString()}</Text>
        <View style={[styles.bandPill, bandStyle]}>
          <Text style={styles.bandText}>{band.toUpperCase()}</Text>
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
      Alert.alert('Delete result?', `Remove "${item.result.summary.headline}" from history?`, [
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
            Tap the Capture tab, take a photo of any vehicle, and your results will appear here.
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
    backgroundColor: '#F0F2F8',
  },
  empty: {
    color: '#4A5E72',
    fontSize: 15,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomColor: '#EEF1F8',
    borderBottomWidth: 1,
  },
  rowPressed: {
    opacity: 0.65,
  },
  rowEmoji: {
    fontSize: 28,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowHeadline: {
    color: '#0D1B2A',
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
  },
  star: {
    color: '#C89820',
    fontSize: 14,
  },
  rowDate: {
    color: '#4A5E72',
    fontSize: 13,
  },
  bandPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  bandHigh: { backgroundColor: '#D4EDDA' },
  bandMedium: { backgroundColor: '#FFF3CD' },
  bandLow: { backgroundColor: '#F8D7DA' },
  bandText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A2A1A',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    color: '#8A9AB0',
    fontSize: 16,
    fontWeight: '700',
  },
})

import { useCallback, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { SectionCard } from '../components/SectionCard'
import { listSightings, toggleStar } from '../lib/history'
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

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Field notebook" title="Recent identifications">
        <Text style={styles.copy}>
          Every successful identification is saved on-device. Star the ones you want to keep as your standout sightings.
        </Text>
      </SectionCard>

      {starred.length ? (
        <SectionCard eyebrow="Saved sightings" title={`${starred.length} starred`}>
          {starred.map((item) => (
            <HistoryRow
              key={`star-${item.id}`}
              item={item}
              onOpen={() => navigation.navigate('Result', { result: item.result })}
              onToggleStar={async () => {
                await toggleStar(item.id)
                await refresh()
              }}
            />
          ))}
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="All history" title={items.length ? `${items.length} saved clip${items.length === 1 ? '' : 's'}` : 'No saved clips yet'}>
        {items.length ? (
          items.map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              onOpen={() => navigation.navigate('Result', { result: item.result })}
              onToggleStar={async () => {
                await toggleStar(item.id)
                await refresh()
              }}
            />
          ))
        ) : (
          <Text style={styles.copy}>Record a clip in Listen and the app will build your birding history here.</Text>
        )}
      </SectionCard>
    </ScrollView>
  )
}

function HistoryRow({ item, onOpen, onToggleStar }: { item: SavedSighting; onOpen: () => void; onToggleStar: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onOpen}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{item.result.top_match.common_name}</Text>
        <Text style={styles.rowSubtitle}>
          {Math.round(item.result.top_match.confidence * 100)}% • {new Date(item.savedAt).toLocaleDateString()}
        </Text>
        <Text style={styles.rowMeta}>{item.result.summary.short_description}</Text>
      </View>
      <Pressable style={styles.starButton} onPress={onToggleStar}>
        <Text style={styles.starText}>{item.starred ? '★' : '☆'}</Text>
      </Pressable>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    backgroundColor: '#F4F7F1',
    flexGrow: 1,
  },
  copy: {
    color: '#4E6557',
    fontSize: 15,
    lineHeight: 21,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomColor: '#ECF1EA',
    borderBottomWidth: 1,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: '#16241C',
    fontWeight: '800',
    fontSize: 16,
  },
  rowSubtitle: {
    color: '#255F38',
    fontWeight: '700',
    fontSize: 13,
  },
  rowMeta: {
    color: '#5B7162',
    fontSize: 14,
    lineHeight: 19,
  },
  starButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  starText: {
    fontSize: 24,
    color: '#C06B2D',
  },
})

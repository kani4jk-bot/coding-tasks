import { useCallback, useEffect, useMemo, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { SectionCard } from '../components/SectionCard'
import { getSavedSighting, toggleStar, upsertSighting } from '../lib/history'
import type { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>

function ConfidenceBar({ value }: { value: number }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.round(value * 100)}%` }]} />
    </View>
  )
}

export function ResultScreen({ route }: Props) {
  const { result } = route.params
  const [starred, setStarred] = useState(false)
  const hasAlternatives = result.alternatives.length > 0
  const hasAdvice = result.advice.length > 0

  useEffect(() => {
    getSavedSighting(result.request_id)
      .then((saved) => setStarred(Boolean(saved?.starred)))
      .catch(() => undefined)
  }, [result.request_id])

  const badgeTone = useMemo(() => {
    if (result.summary.confidence_band === 'high') return styles.badgeHigh
    if (result.summary.confidence_band === 'medium') return styles.badgeMedium
    return styles.badgeLow
  }, [result.summary.confidence_band])

  const handleToggleSave = useCallback(async () => {
    const existing = await getSavedSighting(result.request_id)
    if (!existing) {
      const created = await upsertSighting(result, { starred: true })
      setStarred(created.starred)
      return
    }

    const updated = await toggleStar(existing.id)
    setStarred(Boolean(updated?.starred))
  }, [result])

  const metadata = result.top_match.metadata

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Top match" title={result.summary.headline}>
        <View style={styles.heroRow}>
          <View style={[styles.badge, badgeTone]}>
            <Text style={styles.badgeText}>{result.summary.confidence_band.toUpperCase()} confidence</Text>
          </View>
          <Pressable style={styles.saveButton} onPress={() => { handleToggleSave().catch(() => undefined) }}>
            <Text style={styles.saveButtonText}>{starred ? '★ Saved' : '☆ Save sighting'}</Text>
          </Pressable>
        </View>
        <Text style={styles.scientific}>{result.top_match.scientific_name}</Text>
        <ConfidenceBar value={result.top_match.confidence} />
        <Text style={styles.confidence}>{Math.round(result.top_match.confidence * 100)}% confidence</Text>
        <Text style={styles.reason}>{result.top_match.reason}</Text>
        <Text style={styles.summary}>{result.summary.short_description}</Text>
      </SectionCard>

      {metadata ? (
        <SectionCard eyebrow="Bird notes" title="Groundwork for richer species details">
          {metadata.family ? <Text style={styles.meta}><Text style={styles.metaLabel}>Family:</Text> {metadata.family}</Text> : null}
          {metadata.best_time_to_find ? <Text style={styles.meta}><Text style={styles.metaLabel}>Best time:</Text> {metadata.best_time_to_find}</Text> : null}
          {metadata.seasonal_status ? <Text style={styles.meta}><Text style={styles.metaLabel}>Seasonality:</Text> {metadata.seasonal_status}</Text> : null}
          {metadata.conservation_status ? <Text style={styles.meta}><Text style={styles.metaLabel}>Conservation:</Text> {metadata.conservation_status}</Text> : null}
          {metadata.habitat.length ? <Text style={styles.meta}><Text style={styles.metaLabel}>Habitat:</Text> {metadata.habitat.join(', ')}</Text> : null}
          {metadata.look_for.length ? <Text style={styles.meta}><Text style={styles.metaLabel}>Look for:</Text> {metadata.look_for.join(', ')}</Text> : null}
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Alternatives" title="Also worth checking">
        {hasAlternatives ? (
          result.alternatives.map((item) => (
            <View key={item.species_code} style={styles.altRow}>
              <View style={styles.altCopy}>
                <Text style={styles.altTitle}>{item.common_name}</Text>
                <Text style={styles.altSubtitle}>{item.scientific_name}</Text>
                <Text style={styles.altReason}>{item.reason}</Text>
              </View>
              <Text style={styles.altConfidence}>{Math.round(item.confidence * 100)}%</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No alternative matches came back for this clip.</Text>
        )}
      </SectionCard>

      <SectionCard eyebrow="Clip" title={result.clip.filename}>
        <Text style={styles.meta}>Provider: {result.provider}</Text>
        <Text style={styles.meta}>Size: {(result.clip.file_size_bytes / 1024 / 1024).toFixed(1)} MB</Text>
        <Text style={styles.meta}>Request: {result.request_id}</Text>
        <Text style={styles.meta}>Context used: {result.flags.used_location_context ? 'location' : 'no location'} / {result.flags.used_date_context ? 'date' : 'no date'}</Text>
        {result.clip.latitude != null && result.clip.longitude != null ? (
          <Text style={styles.meta}>Location: {result.clip.latitude.toFixed(4)}, {result.clip.longitude.toFixed(4)}</Text>
        ) : null}
        {result.clip.recorded_on ? <Text style={styles.meta}>Recorded on: {result.clip.recorded_on}</Text> : null}
      </SectionCard>

      <SectionCard eyebrow="Advice" title="How to improve the next try">
        {hasAdvice ? result.advice.map((line) => <Text key={line} style={styles.tip}>• {line}</Text>) : <Text style={styles.empty}>No extra advice from the backend for this clip.</Text>}
      </SectionCard>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    backgroundColor: '#F4F7F1',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeHigh: {
    backgroundColor: '#D9F0DD',
  },
  badgeMedium: {
    backgroundColor: '#F6E8C8',
  },
  badgeLow: {
    backgroundColor: '#F8D8D4',
  },
  badgeText: {
    color: '#1E4E2E',
    fontWeight: '800',
    fontSize: 12,
  },
  saveButton: {
    borderRadius: 999,
    backgroundColor: '#FFF4E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#9A551C',
    fontWeight: '800',
  },
  scientific: {
    color: '#4C6555',
    fontStyle: 'italic',
    fontSize: 16,
  },
  confidence: {
    color: '#255F38',
    fontWeight: '800',
    fontSize: 16,
  },
  reason: {
    color: '#33453A',
    fontSize: 15,
    lineHeight: 22,
  },
  summary: {
    color: '#4E6557',
    fontSize: 15,
    lineHeight: 21,
  },
  empty: {
    color: '#5B7162',
    fontSize: 15,
    lineHeight: 22,
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E3EDE1',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#255F38',
    borderRadius: 999,
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomColor: '#ECF1EA',
    borderBottomWidth: 1,
    gap: 12,
  },
  altCopy: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  altTitle: {
    color: '#16241C',
    fontWeight: '700',
    fontSize: 16,
  },
  altSubtitle: {
    color: '#5B7162',
    fontSize: 14,
  },
  altReason: {
    color: '#4E6557',
    fontSize: 14,
    lineHeight: 20,
  },
  altConfidence: {
    color: '#255F38',
    fontWeight: '800',
  },
  meta: {
    color: '#33453A',
    fontSize: 15,
    lineHeight: 21,
  },
  metaLabel: {
    fontWeight: '800',
  },
  tip: {
    color: '#304237',
    fontSize: 15,
    lineHeight: 22,
  },
})

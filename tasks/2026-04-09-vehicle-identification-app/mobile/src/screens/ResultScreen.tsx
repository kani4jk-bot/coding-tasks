import { useCallback, useEffect, useMemo, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { PrimaryButton } from '../components/PrimaryButton'
import { SectionCard } from '../components/SectionCard'
import { getSavedIdentification, removeIdentification, saveNotes, toggleStar, upsertIdentification } from '../lib/history'
import type { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>

function ConfidenceBar({ value }: { value: number }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.round(value * 100)}%` }]} />
    </View>
  )
}

const VEHICLE_TYPE_EMOJI: Record<string, string> = {
  car: '🚗',
  truck: '🚚',
  motorcycle: '🏍️',
  bicycle: '🚲',
  scooter: '🛵',
  airplane: '✈️',
  helicopter: '🚁',
  train: '🚂',
  boat: '⛵',
  ship: '🚢',
  bus: '🚌',
  tractor: '🚜',
  other: '🚙',
}

export function ResultScreen({ route, navigation }: Props) {
  const { result } = route.params
  const [starred, setStarred] = useState(false)
  const [notes, setNotes] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    getSavedIdentification(result.request_id)
      .then((saved) => {
        setStarred(Boolean(saved?.starred))
        setNotes(saved?.notes ?? '')
      })
      .catch(() => undefined)
  }, [result.request_id])

  const badgeTone = useMemo(() => {
    if (result.summary.confidence_band === 'high') return styles.badgeHigh
    if (result.summary.confidence_band === 'medium') return styles.badgeMedium
    return styles.badgeLow
  }, [result.summary.confidence_band])

  const vehicleEmoji = VEHICLE_TYPE_EMOJI[result.top_match.vehicle_type] ?? '🚗'

  const handleToggleSave = useCallback(async () => {
    const existing = await getSavedIdentification(result.request_id)
    if (!existing) {
      const created = await upsertIdentification(result, { starred: true, notes })
      setStarred(created.starred)
      setSavedMessage('Saved to history.')
      return
    }
    const updated = await toggleStar(existing.id)
    setStarred(Boolean(updated?.starred))
    setSavedMessage(updated?.starred ? 'Starred.' : 'Removed from starred.')
  }, [notes, result])

  const handleSaveNotes = useCallback(async () => {
    const existing = await getSavedIdentification(result.request_id)
    if (!existing) {
      await upsertIdentification(result, { notes })
      setSavedMessage('Notes saved.')
      return
    }
    await saveNotes(existing.id, notes)
    setSavedMessage(notes.trim() ? 'Notes updated.' : 'Notes cleared.')
  }, [notes, result])

  const match = result.top_match
  const hasSpecs = Object.keys(match.specs).length > 0
  const hasAlternatives = result.alternatives.length > 0

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Top match" title={result.summary.headline}>
        <View style={styles.heroRow}>
          <Text style={styles.vehicleEmoji}>{vehicleEmoji}</Text>
          <View style={[styles.badge, badgeTone]}>
            <Text style={styles.badgeText}>{result.summary.confidence_band.toUpperCase()} confidence</Text>
          </View>
          <Pressable style={styles.saveButton} onPress={() => { handleToggleSave().catch(() => undefined) }}>
            <Text style={styles.saveButtonText}>{starred ? '★ Saved' : '☆ Save'}</Text>
          </Pressable>
        </View>

        {match.make || match.model ? (
          <Text style={styles.makeModel}>
            {[match.make, match.model].filter(Boolean).join(' ')}
            {match.year_range ? ` · ${match.year_range}` : ''}
          </Text>
        ) : null}
        {match.country_of_origin ? <Text style={styles.origin}>{match.country_of_origin}</Text> : null}

        <ConfidenceBar value={match.confidence} />
        <Text style={styles.confidenceLabel}>{Math.round(match.confidence * 100)}% confidence</Text>
        <Text style={styles.reason}>{match.reason}</Text>
        <Text style={styles.summary}>{result.summary.short_description}</Text>
      </SectionCard>

      {match.fun_facts.length > 0 ? (
        <SectionCard eyebrow="Fun facts" title="Interesting things about this vehicle">
          {match.fun_facts.map((fact, i) => (
            <View key={i} style={styles.factRow}>
              <Text style={styles.factBullet}>★</Text>
              <Text style={styles.factText}>{fact}</Text>
            </View>
          ))}
        </SectionCard>
      ) : null}

      {hasSpecs ? (
        <SectionCard eyebrow="Specifications" title="Key specs at a glance">
          {Object.entries(match.specs).map(([key, value]) => (
            <View key={key} style={styles.specRow}>
              <Text style={styles.specKey}>{key}</Text>
              <Text style={styles.specValue}>{value}</Text>
            </View>
          ))}
        </SectionCard>
      ) : null}

      {match.brief_history ? (
        <SectionCard eyebrow="History" title="Background on this vehicle">
          <Text style={styles.history}>{match.brief_history}</Text>
        </SectionCard>
      ) : null}

      {hasAlternatives ? (
        <SectionCard eyebrow="Alternatives" title="Other possibilities">
          {result.alternatives.map((alt, i) => (
            <View key={i} style={styles.altRow}>
              <View style={styles.altCopy}>
                <Text style={styles.altTitle}>
                  {[alt.make, alt.model].filter(Boolean).join(' ') || alt.vehicle_type}
                  {alt.year_range ? ` · ${alt.year_range}` : ''}
                </Text>
                <Text style={styles.altReason}>{alt.reason}</Text>
              </View>
              <Text style={styles.altConfidence}>{Math.round(alt.confidence * 100)}%</Text>
            </View>
          ))}
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Notes" title="Add your own notes">
        <TextInput
          value={notes}
          onChangeText={(v) => {
            setNotes(v)
            if (savedMessage) setSavedMessage('')
          }}
          placeholder="Where did you see it? Any other details…"
          placeholderTextColor="#8A9AB0"
          multiline
          textAlignVertical="top"
          style={styles.notesInput}
        />
        <View style={styles.buttonStack}>
          <PrimaryButton title="Save notes" onPress={() => { handleSaveNotes().catch(() => undefined) }} />
          <PrimaryButton
            title="Clear notes"
            onPress={() => {
              setNotes('')
              setSavedMessage('')
            }}
            variant="secondary"
          />
        </View>
        {savedMessage ? (
          <View style={styles.savedBanner}>
            <Text style={styles.savedMessage}>✓ {savedMessage}</Text>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard eyebrow="Image" title={result.image.filename}>
        <Text style={styles.meta}>Provider: {result.provider}</Text>
        <Text style={styles.meta}>Size: {(result.image.file_size_bytes / 1024 / 1024).toFixed(1)} MB</Text>
        <Text style={styles.meta}>Request: {result.request_id}</Text>
      </SectionCard>

      <SectionCard eyebrow="Manage" title="Remove this result">
        <PrimaryButton
          title="Delete from history"
          variant="danger"
          onPress={() => {
            Alert.alert('Delete result?', 'This removes the identification and any notes from this device.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  removeIdentification(result.request_id)
                    .then(() => navigation.goBack())
                    .catch(() => undefined)
                },
              },
            ])
          }}
        />
      </SectionCard>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    backgroundColor: '#F0F2F8',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  vehicleEmoji: {
    fontSize: 30,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeHigh: { backgroundColor: '#D4EDDA' },
  badgeMedium: { backgroundColor: '#FFF3CD' },
  badgeLow: { backgroundColor: '#F8D7DA' },
  badgeText: {
    color: '#1A2A1A',
    fontWeight: '800',
    fontSize: 11,
  },
  saveButton: {
    marginLeft: 'auto',
    borderRadius: 999,
    backgroundColor: '#FFF4E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonText: {
    color: '#7A4E00',
    fontWeight: '800',
    fontSize: 13,
  },
  makeModel: {
    color: '#1A3C6B',
    fontSize: 17,
    fontWeight: '700',
  },
  origin: {
    color: '#4A5E72',
    fontSize: 14,
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#1A3C6B',
    borderRadius: 999,
  },
  confidenceLabel: {
    color: '#1A3C6B',
    fontWeight: '800',
    fontSize: 15,
  },
  reason: {
    color: '#2E3F50',
    fontSize: 15,
    lineHeight: 22,
  },
  summary: {
    color: '#4A5E72',
    fontSize: 15,
    lineHeight: 21,
  },
  factRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  factBullet: {
    color: '#C89820',
    fontSize: 14,
    marginTop: 2,
  },
  factText: {
    flex: 1,
    color: '#2E3F50',
    fontSize: 15,
    lineHeight: 22,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: '#EEF1F8',
    borderBottomWidth: 1,
    gap: 12,
  },
  specKey: {
    color: '#4A5E72',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  specValue: {
    color: '#0D1B2A',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  history: {
    color: '#2E3F50',
    fontSize: 15,
    lineHeight: 23,
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomColor: '#EEF1F8',
    borderBottomWidth: 1,
    gap: 12,
  },
  altCopy: {
    flex: 1,
    gap: 3,
  },
  altTitle: {
    color: '#0D1B2A',
    fontWeight: '700',
    fontSize: 15,
  },
  altReason: {
    color: '#4A5E72',
    fontSize: 14,
    lineHeight: 20,
  },
  altConfidence: {
    color: '#1A3C6B',
    fontWeight: '800',
    fontSize: 15,
  },
  notesInput: {
    minHeight: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E0F0',
    backgroundColor: '#FAFBFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0D1B2A',
    fontSize: 15,
    lineHeight: 21,
  },
  buttonStack: {
    gap: 10,
  },
  savedBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  savedMessage: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  meta: {
    color: '#4A5E72',
    fontSize: 14,
    lineHeight: 20,
  },
})

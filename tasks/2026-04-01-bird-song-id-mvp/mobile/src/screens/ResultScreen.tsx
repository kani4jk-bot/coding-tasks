import { useCallback, useEffect, useMemo, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { getSavedSighting, removeSighting, saveSightingNotes, toggleStar, upsertSighting } from '../lib/history'
import type { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>

const BAND_COLORS = {
  high: { bg: '#D4EDDA', text: '#1A5C2E', label: 'High confidence' },
  medium: { bg: '#FFF3CD', text: '#7B5800', label: 'Medium confidence' },
  low: { bg: '#FADBD8', text: '#7B2421', label: 'Low confidence' },
}

export function ResultScreen({ route, navigation }: Props) {
  const { result } = route.params
  const [starred, setStarred] = useState(false)
  const [notes, setNotes] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const metadata = result.top_match.metadata
  const band = BAND_COLORS[result.summary.confidence_band]
  const confidencePct = Math.round(result.top_match.confidence * 100)

  useEffect(() => {
    getSavedSighting(result.request_id)
      .then((saved) => {
        setStarred(Boolean(saved?.starred))
        setNotes(saved?.notes ?? '')
      })
      .catch(() => undefined)
  }, [result.request_id])

  const handleToggleSave = useCallback(async () => {
    const existing = await getSavedSighting(result.request_id)
    if (!existing) {
      const created = await upsertSighting(result, { starred: true, notes })
      setStarred(created.starred)
      setSavedMessage('Saved to journal.')
      return
    }
    const updated = await toggleStar(existing.id)
    setStarred(Boolean(updated?.starred))
    setSavedMessage(updated?.starred ? 'Starred.' : 'Unstarred.')
  }, [notes, result])

  const handleSaveNotes = useCallback(async () => {
    const existing = await getSavedSighting(result.request_id)
    if (!existing) {
      await upsertSighting(result, { notes })
      setSavedMessage('Notes saved.')
      return
    }
    await saveSightingNotes(existing.id, notes)
    setSavedMessage(notes.trim() ? 'Notes updated.' : 'Notes cleared.')
  }, [notes, result])

  const handleDelete = useCallback(() => {
    Alert.alert('Delete sighting?', 'This removes the result and any notes from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeSighting(result.request_id)
            .then(() => navigation.goBack())
            .catch(() => undefined)
        },
      },
    ])
  }, [navigation, result.request_id])

  const confidenceBarWidth = useMemo(() => `${confidencePct}%` as const, [confidencePct])

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Hero image */}
      {metadata?.image_url ? (
        <Image source={{ uri: metadata.image_url }} style={styles.heroImage} resizeMode="cover" />
      ) : (
        <View style={styles.heroPlaceholder}>
          <Text style={styles.heroPlaceholderEmoji}>🐦</Text>
        </View>
      )}

      {/* Main card */}
      <View style={styles.card}>
        <View style={styles.nameRow}>
          <View style={styles.nameCopy}>
            <Text style={styles.commonName}>{result.top_match.common_name}</Text>
            <Text style={styles.scientificName}>{result.top_match.scientific_name}</Text>
          </View>
          <Pressable style={styles.starButton} onPress={() => { handleToggleSave().catch(() => undefined) }}>
            <Text style={styles.starIcon}>{starred ? '★' : '☆'}</Text>
          </Pressable>
        </View>

        <View style={styles.confidenceRow}>
          <View style={[styles.bandBadge, { backgroundColor: band.bg }]}>
            <Text style={[styles.bandText, { color: band.text }]}>{band.label}</Text>
          </View>
          <Text style={[styles.confidencePct, { color: band.text }]}>{confidencePct}%</Text>
        </View>

        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: confidenceBarWidth, backgroundColor: band.text }]} />
        </View>

        {metadata?.description ? (
          <Text style={styles.description}>{metadata.description}</Text>
        ) : (
          <Text style={styles.description}>{result.summary.short_description}</Text>
        )}

        {savedMessage ? <Text style={styles.savedMessage}>{savedMessage}</Text> : null}
      </View>

      {/* Metadata chips */}
      {metadata && (metadata.habitat.length > 0 || metadata.family || metadata.seasonal_status) ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>About this bird</Text>
          <View style={styles.metaGrid}>
            {metadata.family ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaItemLabel}>Family</Text>
                <Text style={styles.metaItemValue}>{metadata.family}</Text>
              </View>
            ) : null}
            {metadata.seasonal_status ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaItemLabel}>Season</Text>
                <Text style={styles.metaItemValue}>{metadata.seasonal_status}</Text>
              </View>
            ) : null}
            {metadata.conservation_status ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaItemLabel}>Status</Text>
                <Text style={styles.metaItemValue}>{metadata.conservation_status}</Text>
              </View>
            ) : null}
            {metadata.best_time_to_find ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaItemLabel}>Best time</Text>
                <Text style={styles.metaItemValue}>{metadata.best_time_to_find}</Text>
              </View>
            ) : null}
          </View>
          {metadata.habitat.length > 0 ? (
            <Text style={styles.metaLine}><Text style={styles.metaLineLabel}>Habitat  </Text>{metadata.habitat.join(', ')}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Alternatives */}
      {result.alternatives.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Also possible</Text>
          {result.alternatives.map((item) => (
            <View key={item.species_code} style={styles.altRow}>
              <View style={styles.altCopy}>
                <Text style={styles.altName}>{item.common_name}</Text>
                <Text style={styles.altScientific}>{item.scientific_name}</Text>
              </View>
              <Text style={styles.altPct}>{Math.round(item.confidence * 100)}%</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Field notes */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Field notes</Text>
        <TextInput
          value={notes}
          onChangeText={(v) => { setNotes(v); if (savedMessage) setSavedMessage('') }}
          placeholder="Heard near creek edge, two short chirps…"
          placeholderTextColor="#9AA89E"
          multiline
          textAlignVertical="top"
          style={styles.notesInput}
        />
        <Pressable style={styles.saveNotesButton} onPress={() => { handleSaveNotes().catch(() => undefined) }}>
          <Text style={styles.saveNotesText}>Save notes</Text>
        </Pressable>
      </View>

      {/* Delete */}
      <Pressable style={styles.deleteRow} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete this sighting</Text>
      </Pressable>

    </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F4F7F1',
  },
  content: {
    paddingBottom: 48,
  },
  heroImage: {
    width: '100%',
    height: 240,
  },
  heroPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#E0EBE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderEmoji: {
    fontSize: 64,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  nameCopy: {
    flex: 1,
    gap: 3,
  },
  commonName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#102016',
    letterSpacing: -0.5,
  },
  scientificName: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#5B7162',
  },
  starButton: {
    paddingTop: 4,
  },
  starIcon: {
    fontSize: 28,
    color: '#C06B2D',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bandBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  bandText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confidencePct: {
    fontSize: 22,
    fontWeight: '800',
  },
  barTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E8EFE6',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
  description: {
    fontSize: 15,
    color: '#304237',
    lineHeight: 22,
  },
  savedMessage: {
    fontSize: 13,
    color: '#255F38',
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A9484',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    backgroundColor: '#F4F7F1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: '45%',
    flexGrow: 1,
    gap: 2,
  },
  metaItemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A9484',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaItemValue: {
    fontSize: 14,
    color: '#1C2E22',
    fontWeight: '600',
  },
  metaLine: {
    fontSize: 14,
    color: '#304237',
    lineHeight: 20,
  },
  metaLineLabel: {
    fontWeight: '700',
    color: '#1C2E22',
  },
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECF1EA',
  },
  altCopy: {
    flex: 1,
    gap: 2,
  },
  altName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C2E22',
  },
  altScientific: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#7A9484',
  },
  altPct: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5B7162',
  },
  notesInput: {
    minHeight: 100,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D0DDD0',
    backgroundColor: '#FAFCF9',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#102016',
    fontSize: 15,
    lineHeight: 21,
  },
  saveNotesButton: {
    backgroundColor: '#255F38',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveNotesText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  deleteRow: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  deleteText: {
    fontSize: 14,
    color: '#9B2335',
    fontWeight: '500',
  },
})

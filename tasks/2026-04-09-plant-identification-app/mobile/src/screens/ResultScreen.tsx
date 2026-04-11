import { useCallback, useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { PrimaryButton } from '../components/PrimaryButton'
import { SectionCard } from '../components/SectionCard'
import { getSavedIdentification, removeIdentification, toggleStar, upsertIdentification } from '../lib/history'
import type { GrowingTip, RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>

const CATEGORY_ICONS: Record<string, string> = {
  Light: '☀️',
  Watering: '💧',
  Soil: '🪱',
  Humidity: '💨',
  Fertilizing: '🌿',
  Temperature: '🌡️',
  Pruning: '✂️',
  Repotting: '🪴',
}

const CONFIDENCE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  high:   { label: 'High confidence',   bg: '#D1FAE5', text: '#065F46' },
  medium: { label: 'Medium confidence', bg: '#FEF9C3', text: '#854D0E' },
  low:    { label: 'Low confidence',    bg: '#FEE2E2', text: '#991B1B' },
}

export function ResultScreen({ route, navigation }: Props) {
  const { result } = route.params
  const plant = result.result
  const conf = CONFIDENCE_CONFIG[plant.confidence]
  const [starred, setStarred] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    getSavedIdentification(result.request_id)
      .then((saved) => { setStarred(Boolean(saved?.starred)) })
      .catch(() => undefined)
  }, [result.request_id])

  const handleToggleSave = useCallback(async () => {
    const existing = await getSavedIdentification(result.request_id)
    if (!existing) {
      const created = await upsertIdentification(result, { starred: true })
      setStarred(created.starred)
      setSavedMessage('Saved to history.')
      return
    }
    const updated = await toggleStar(existing.id)
    setStarred(Boolean(updated?.starred))
    setSavedMessage(updated?.starred ? 'Starred.' : 'Unstarred.')
  }, [result])

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Top match" title={plant.common_name}>
        <View style={styles.heroRow}>
          <Text style={styles.sci}>{plant.scientific_name}</Text>
          <Pressable style={styles.saveButton} onPress={() => { handleToggleSave().catch(() => undefined) }}>
            <Text style={styles.saveButtonText}>{starred ? '★ Saved' : '☆ Save'}</Text>
          </Pressable>
        </View>
        <View style={[styles.badge, { backgroundColor: conf.bg }]}>
          <Text style={[styles.badgeText, { color: conf.text }]}>{conf.label}</Text>
        </View>
        <Text style={styles.description}>{plant.description}</Text>
        {savedMessage ? (
          <View style={styles.savedBanner}>
            <Text style={styles.savedMessage}>✓ {savedMessage}</Text>
          </View>
        ) : null}
      </SectionCard>

      {plant.fun_facts.length > 0 ? (
        <SectionCard eyebrow="Fun facts" title="Interesting things about this plant">
          {plant.fun_facts.map((fact, i) => (
            <View key={i} style={styles.factRow}>
              <Text style={styles.factBullet}>🌱</Text>
              <Text style={styles.factText}>{fact}</Text>
            </View>
          ))}
        </SectionCard>
      ) : null}

      {plant.is_houseplant && plant.growing_tips.length > 0 ? (
        <SectionCard eyebrow="Care guide" title="How to grow at home">
          <View style={styles.tipsGrid}>
            {plant.growing_tips.map((tip: GrowingTip, i: number) => (
              <View key={i} style={styles.tipItem}>
                <View style={styles.tipHeader}>
                  <Text style={styles.tipIcon}>{CATEGORY_ICONS[tip.category] ?? '🌱'}</Text>
                  <Text style={styles.tipCategory}>{tip.category}</Text>
                </View>
                <Text style={styles.tipText}>{tip.tip}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}

      {result.alternatives.length > 0 ? (
        <SectionCard eyebrow="Alternatives" title="Other possibilities">
          {result.alternatives.map((alt, i) => (
            <View key={i} style={styles.altRow}>
              <View style={styles.altCopy}>
                <Text style={styles.altName}>{alt.common_name}</Text>
                <Text style={styles.altSci}>{alt.scientific_name}</Text>
                <Text style={styles.altDesc}>{alt.description}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: CONFIDENCE_CONFIG[alt.confidence]?.bg ?? '#F3F4F6' }]}>
                <Text style={[styles.badgeText, { color: CONFIDENCE_CONFIG[alt.confidence]?.text ?? '#374151' }]}>
                  {alt.confidence.toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Manage" title="Remove this result">
        <PrimaryButton
          title="Delete from history"
          variant="danger"
          onPress={() => {
            Alert.alert('Delete result?', 'This removes the identification from this device.', [
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
    backgroundColor: '#F0F8F2',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sci: {
    fontStyle: 'italic',
    color: '#6B7280',
    fontSize: 15,
    flex: 1,
  },
  saveButton: {
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
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  description: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 23,
  },
  savedBanner: {
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  savedMessage: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  factRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  factBullet: { fontSize: 14, marginTop: 2 },
  factText: {
    flex: 1,
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tipItem: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    width: '47%',
    gap: 4,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipIcon: { fontSize: 16 },
  tipCategory: {
    color: '#2d6a4f',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tipText: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 19,
  },
  altRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomColor: '#D1FAE5',
    borderBottomWidth: 1,
    gap: 12,
  },
  altCopy: { flex: 1, gap: 2 },
  altName: { color: '#111827', fontWeight: '700', fontSize: 15 },
  altSci: { color: '#6B7280', fontSize: 13, fontStyle: 'italic' },
  altDesc: { color: '#4B5563', fontSize: 14, lineHeight: 20 },
})

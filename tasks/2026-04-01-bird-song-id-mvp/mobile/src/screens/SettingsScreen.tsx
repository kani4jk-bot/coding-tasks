import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'

import { PrimaryButton } from '../components/PrimaryButton'
import { SectionCard } from '../components/SectionCard'
import { getApiBase } from '../lib/api'
import { clearSightings, getHistoryStats } from '../lib/history'

export function SettingsScreen() {
  const [stats, setStats] = useState({
    total: 0,
    starred: 0,
    noted: 0,
    uniqueSpecies: 0,
    latestSavedAt: null as string | null,
  })

  const refresh = useCallback(async () => {
    setStats(await getHistoryStats())
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => undefined)
    }, [refresh]),
  )

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Backend" title="Service connection">
        <Text style={styles.copy}>Uses `EXPO_PUBLIC_API_BASE` when set.</Text>
        <Text style={styles.mono}>{getApiBase()}</Text>
      </SectionCard>

      <SectionCard eyebrow="Field journal" title="Saved sightings on this device">
        <View style={styles.statGrid}>
          <Stat label="Saved clips" value={String(stats.total)} />
          <Stat label="Starred" value={String(stats.starred)} />
          <Stat label="With notes" value={String(stats.noted)} />
          <Stat label="Species seen" value={String(stats.uniqueSpecies)} />
        </View>
        <Text style={styles.copy}>
          {stats.latestSavedAt
            ? `Latest saved result: ${new Date(stats.latestSavedAt).toLocaleDateString()}`
            : 'No saved results yet.'}
        </Text>
      </SectionCard>

      <SectionCard eyebrow="History" title="Storage controls">
        <Text style={styles.copy}>History is local-only for now. Clear it if you want a clean slate before field testing.</Text>
        <PrimaryButton
          title="Clear all saved sightings"
          variant="secondary"
          onPress={() => {
            Alert.alert('Clear all history?', 'This removes all saved sightings, stars, and notes from this device.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Clear',
                style: 'destructive',
                onPress: () => {
                  clearSightings()
                    .then(() => refresh())
                    .catch(() => undefined)
                },
              },
            ])
          }}
        />
      </SectionCard>

      <SectionCard eyebrow="Native app roadmap" title="What is still next">
        <Text style={styles.copy}>Best next layer after this: a retry queue for weak connectivity, then richer species enrichment for real BirdNET matches.</Text>
      </SectionCard>
    </ScrollView>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  mono: {
    marginTop: 10,
    color: '#255F38',
    fontFamily: 'monospace',
    fontSize: 13,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: 16,
    backgroundColor: '#F6FAF4',
    borderWidth: 1,
    borderColor: '#E1EADF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  statValue: {
    color: '#255F38',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: '#5B7162',
    fontSize: 13,
    fontWeight: '600',
  },
})

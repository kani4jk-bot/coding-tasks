import { useCallback, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'

import { PrimaryButton } from '../components/PrimaryButton'
import { SectionCard } from '../components/SectionCard'
import { getApiBase } from '../lib/api'
import { clearSightings, getHistoryStats } from '../lib/history'
import { clearRetryQueue, getRetryQueueStats, processRetryQueue } from '../lib/retryQueue'
import type { RootStackParamList } from '../types'

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [stats, setStats] = useState({
    total: 0,
    starred: 0,
    noted: 0,
    uniqueSpecies: 0,
    latestSavedAt: null as string | null,
  })
  const [queueStats, setQueueStats] = useState({
    pending: 0,
    attempted: 0,
    newestQueuedAt: null as string | null,
  })
  const [queueMessage, setQueueMessage] = useState('')
  const [queueProcessing, setQueueProcessing] = useState(false)

  const refresh = useCallback(async () => {
    const [history, queue] = await Promise.all([getHistoryStats(), getRetryQueueStats()])
    setStats(history)
    setQueueStats(queue)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => undefined)
    }, [refresh]),
  )

  const handleRetryNow = useCallback(async () => {
    setQueueProcessing(true)
    setQueueMessage('')

    try {
      const result = await processRetryQueue()
      await refresh()

      if (!result.processed) {
        setQueueMessage('Nothing is waiting in the retry queue.')
        return
      }

      if (result.succeeded > 0) {
        setQueueMessage(`${result.succeeded} queued clip${result.succeeded === 1 ? '' : 's'} uploaded successfully.`)
        if (result.latestSuccess) {
          navigation.navigate('Result', { result: result.latestSuccess })
        }
        return
      }

      setQueueMessage('Queued clips were retried, but they still could not reach the backend.')
    } catch (err) {
      setQueueMessage(err instanceof Error ? err.message : 'Could not retry queued clips.')
    } finally {
      setQueueProcessing(false)
    }
  }, [navigation, refresh])

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

      <SectionCard eyebrow="Offline uploads" title="Retry queue on this device">
        <View style={styles.statGrid}>
          <Stat label="Pending clips" value={String(queueStats.pending)} />
          <Stat label="Attempted" value={String(queueStats.attempted)} />
        </View>
        <Text style={styles.copy}>
          {queueStats.newestQueuedAt
            ? `Newest queued clip: ${new Date(queueStats.newestQueuedAt).toLocaleDateString()}`
            : 'No queued uploads right now.'}
        </Text>
        <View style={styles.buttonStack}>
          <PrimaryButton
            title={queueProcessing ? 'Retrying queued clips…' : 'Retry queued clips now'}
            variant="secondary"
            onPress={() => {
              handleRetryNow().catch(() => undefined)
            }}
            disabled={queueProcessing}
          />
          <PrimaryButton
            title="Clear retry queue"
            variant="secondary"
            onPress={() => {
              Alert.alert('Clear retry queue?', 'This deletes any saved offline clips that have not uploaded yet.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => {
                    clearRetryQueue()
                      .then(() => refresh())
                      .then(() => setQueueMessage('Retry queue cleared.'))
                      .catch(() => undefined)
                  },
                },
              ])
            }}
            disabled={queueProcessing || queueStats.pending === 0}
          />
        </View>
        {queueMessage ? <Text style={styles.queueMessage}>{queueMessage}</Text> : null}
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
        <Text style={styles.copy}>After this retry foundation, the smart next layer is richer upload diagnostics plus optional background retry triggers when connectivity returns.</Text>
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
  queueMessage: {
    color: '#255F38',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
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
  buttonStack: {
    gap: 10,
  },
})

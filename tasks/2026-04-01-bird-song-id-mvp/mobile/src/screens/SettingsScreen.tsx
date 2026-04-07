import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getApiBase } from '../lib/api'
import { clearSightings, getHistoryStats } from '../lib/history'
import { clearRetryQueue, getRetryQueueStats, processRetryQueue } from '../lib/retryQueue'

export function SettingsScreen() {
  const [stats, setStats] = useState({ total: 0, starred: 0, noted: 0, uniqueSpecies: 0, latestSavedAt: null as string | null })
  const [queueStats, setQueueStats] = useState({ pending: 0, attempted: 0, newestQueuedAt: null as string | null })
  const [queueProcessing, setQueueProcessing] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    const [history, queue] = await Promise.all([getHistoryStats(), getRetryQueueStats()])
    setStats(history)
    setQueueStats(queue)
  }, [])

  useFocusEffect(useCallback(() => { refresh().catch(() => undefined) }, [refresh]))

  const handleRetryNow = useCallback(async () => {
    setQueueProcessing(true)
    setMessage('')
    try {
      const result = await processRetryQueue()
      await refresh()
      if (!result.processed) { setMessage('Nothing in the retry queue.'); return }
      setMessage(result.succeeded > 0 ? `${result.succeeded} clip${result.succeeded === 1 ? '' : 's'} uploaded.` : 'Retry failed — will try again later.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Retry failed.')
    } finally {
      setQueueProcessing(false)
    }
  }, [refresh])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.screenTitle}>Settings</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Stats */}
        <Text style={styles.sectionHeader}>Field journal</Text>
        <View style={styles.statGrid}>
          <StatCard label="Saved clips" value={String(stats.total)} />
          <StatCard label="Starred" value={String(stats.starred)} />
          <StatCard label="With notes" value={String(stats.noted)} />
          <StatCard label="Species" value={String(stats.uniqueSpecies)} />
        </View>

        {/* Queue */}
        <Text style={styles.sectionHeader}>Offline queue</Text>
        <View style={styles.group}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pending clips</Text>
            <Text style={styles.infoValue}>{queueStats.pending}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Previously attempted</Text>
            <Text style={styles.infoValue}>{queueStats.attempted}</Text>
          </View>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {/* Actions */}
        <Text style={styles.sectionHeader}>Actions</Text>
        <View style={styles.group}>
          <Pressable
            style={styles.actionRow}
            onPress={() => { handleRetryNow().catch(() => undefined) }}
            disabled={queueProcessing || queueStats.pending === 0}
          >
            <Text style={[styles.actionLabel, (queueProcessing || queueStats.pending === 0) && styles.actionDisabled]}>
              {queueProcessing ? 'Retrying…' : 'Retry queued clips'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionRow}
            onPress={() => {
              Alert.alert('Clear retry queue?', 'Deletes saved offline clips that haven\'t uploaded.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: () => { clearRetryQueue().then(refresh).then(() => setMessage('Queue cleared.')).catch(() => undefined) } },
              ])
            }}
            disabled={queueStats.pending === 0}
          >
            <Text style={[styles.actionLabel, styles.actionDestructive, queueStats.pending === 0 && styles.actionDisabled]}>
              Clear retry queue
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionRow, styles.actionRowLast]}
            onPress={() => {
              Alert.alert('Clear all history?', 'Removes all saved sightings, stars, and notes from this device.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: () => { clearSightings().then(refresh).catch(() => undefined) } },
              ])
            }}
          >
            <Text style={[styles.actionLabel, styles.actionDestructive]}>Clear all history</Text>
          </Pressable>
        </View>

        {/* Backend info */}
        <Text style={styles.sectionHeader}>Backend</Text>
        <View style={styles.group}>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>API</Text>
            <Text style={styles.apiUrl} numberOfLines={1}>{getApiBase()}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 6,
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
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minWidth: '47%',
    flexGrow: 1,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#255F38',
  },
  statLabel: {
    fontSize: 13,
    color: '#7A9484',
    fontWeight: '600',
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBF0E8',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 15,
    color: '#1C2E22',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#5B7162',
    fontWeight: '700',
  },
  apiUrl: {
    fontSize: 13,
    color: '#7A9484',
    maxWidth: '60%',
  },
  actionRow: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBF0E8',
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionLabel: {
    fontSize: 15,
    color: '#255F38',
    fontWeight: '600',
  },
  actionDestructive: {
    color: '#9B2335',
  },
  actionDisabled: {
    opacity: 0.35,
  },
  message: {
    fontSize: 13,
    color: '#255F38',
    fontWeight: '600',
    paddingHorizontal: 4,
    marginTop: 4,
  },
})

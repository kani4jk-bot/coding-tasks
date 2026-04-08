import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Audio } from 'expo-av'
import * as Location from 'expo-location'
import { Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'

import { PrimaryButton } from '../components/PrimaryButton'
import { SectionCard } from '../components/SectionCard'
import { identifyBirdClip } from '../lib/api'
import { upsertSighting } from '../lib/history'
import {
  approximateLocationToRegion,
  formatApproximateLocationPreview,
  getApproximateLocationRegionLabel,
} from '../lib/locationPrivacy'
import { enqueueIdentification, getRetryQueueStats, processRetryQueue } from '../lib/retryQueue'
import type { CaptureContext, LocationPermissionState, RecordingPermissionState, RootStackParamList } from '../types'

function toPermissionState(granted: boolean, canAskAgain: boolean): RecordingPermissionState {
  return granted ? 'granted' : canAskAgain ? 'undetermined' : 'denied'
}

export function ListenScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [permissionState, setPermissionState] = useState<RecordingPermissionState>('undetermined')
  const [locationPermissionState, setLocationPermissionState] = useState<LocationPermissionState>('undetermined')
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [status, setStatus] = useState<'idle' | 'recording' | 'uploading'>('idle')
  const [useLocationContext, setUseLocationContext] = useState(false)
  const [useDateContext, setUseDateContext] = useState(true)
  const [capturedLocation, setCapturedLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [capturedDate, setCapturedDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [statusMessage, setStatusMessage] = useState('Tap once to start listening. Tap again to stop and identify.')
  const [error, setError] = useState<string | null>(null)
  const [queueStats, setQueueStats] = useState({ pending: 0, attempted: 0, newestQueuedAt: null as string | null })
  const [queueMessage, setQueueMessage] = useState('')
  const [queueProcessing, setQueueProcessing] = useState(false)
  const locationRegionLabel = useMemo(() => getApproximateLocationRegionLabel(), [])

  const refreshQueueStats = useCallback(async () => {
    setQueueStats(await getRetryQueueStats())
  }, [])

  const syncPermission = useCallback(async () => {
    const current = await Audio.getPermissionsAsync()
    setPermissionState(toPermissionState(current.granted, current.canAskAgain))
  }, [])

  const syncLocationPermission = useCallback(async () => {
    const current = await Location.getForegroundPermissionsAsync()
    setLocationPermissionState(toPermissionState(current.granted, current.canAskAgain))
  }, [])

  const runQueuedRetries = useCallback(async (reason: 'auto' | 'manual') => {
    setQueueProcessing(true)

    try {
      const result = await processRetryQueue()
      await refreshQueueStats()

      if (!result.processed) {
        if (reason === 'manual') {
          setQueueMessage('Nothing is waiting in the retry queue.')
        }
        return
      }

      if (result.succeeded > 0) {
        const base = `${result.succeeded} queued clip${result.succeeded === 1 ? '' : 's'} uploaded successfully.`
        setQueueMessage(result.failed > 0 ? `${base} ${result.failed} still waiting for another retry.` : base)
      } else if (reason === 'manual') {
        setQueueMessage('Queued clips were retried, but they still could not reach the backend.')
      }

      if (reason === 'manual' && result.latestSuccess) {
        navigation.navigate('Result', { result: result.latestSuccess })
      }
    } catch (err) {
      if (reason === 'manual') {
        setQueueMessage(err instanceof Error ? err.message : 'Could not retry queued clips.')
      }
    } finally {
      setQueueProcessing(false)
    }
  }, [navigation, refreshQueueStats])

  useEffect(() => {
    syncPermission().catch(() => undefined)
    syncLocationPermission().catch(() => undefined)
    refreshQueueStats().catch(() => undefined)
    setCapturedDate(new Date().toISOString().slice(0, 10))
  }, [refreshQueueStats, syncLocationPermission, syncPermission])

  useFocusEffect(
    useCallback(() => {
      syncPermission().catch(() => undefined)
      syncLocationPermission().catch(() => undefined)
      refreshQueueStats().catch(() => undefined)
      runQueuedRetries('auto').catch(() => undefined)
      setCapturedDate(new Date().toISOString().slice(0, 10))

      return () => {
        if (recording) {
          recording.stopAndUnloadAsync().catch(() => undefined)
          setRecording(null)
          setStatus('idle')
        }
      }
    }, [recording, refreshQueueStats, runQueuedRetries, syncLocationPermission, syncPermission]),
  )

  const requestPermission = useCallback(async () => {
    setError(null)
    const result = await Audio.requestPermissionsAsync()
    setPermissionState(toPermissionState(result.granted, result.canAskAgain))
    if (!result.granted) {
      setError('Microphone access is required to record bird songs on your phone.')
    }
    return result.granted
  }, [])

  const requestLocationPermission = useCallback(async () => {
    setError(null)
    const result = await Location.requestForegroundPermissionsAsync()
    setLocationPermissionState(toPermissionState(result.granted, result.canAskAgain))

    if (!result.granted) {
      setCapturedLocation(null)
      setError('Approximate location is optional, but it can still help with similar-species matches.')
    }

    return result.granted
  }, [])

  const refreshLocationContext = useCallback(async () => {
    const hasPermission = locationPermissionState === 'granted' ? true : await requestLocationPermission()
    if (!hasPermission) return null

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    })

    const next = approximateLocationToRegion(location.coords.latitude, location.coords.longitude)

    setCapturedLocation({
      latitude: next.latitude,
      longitude: next.longitude,
    })
    return next
  }, [locationPermissionState, requestLocationPermission])

  const startRecording = useCallback(async () => {
    const hasPermission = permissionState === 'granted' ? true : await requestPermission()
    if (!hasPermission) return

    setError(null)
    setStatus('recording')
    setStatusMessage('Listening now… tap again when the bird call is done.')

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const nextRecording = new Audio.Recording()
      await nextRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await nextRecording.startAsync()
      setRecording(nextRecording)
    } catch (err) {
      setStatus('idle')
      setStatusMessage('Tap once to start listening. Tap again to stop and identify.')
      setError(err instanceof Error ? err.message : 'Could not start recording.')
    }
  }, [permissionState, requestPermission])

  const stopRecordingAndIdentify = useCallback(async () => {
    if (!recording) return

    setStatus('uploading')
    setStatusMessage('Preparing clip, context, and backend lookup…')
    setError(null)
    setQueueMessage('')

    let uri: string | null = null
    let context: CaptureContext = {}
    const clipName = `birdsong-${Date.now()}.m4a`

    try {
      await recording.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      })

      uri = recording.getURI()
      setRecording(null)

      if (!uri) {
        throw new Error('Recording finished, but no audio file was produced.')
      }

      if (useDateContext) {
        const recordedOn = new Date().toISOString().slice(0, 10)
        setCapturedDate(recordedOn)
        context.recordedOn = recordedOn
      }

      if (useLocationContext) {
        setStatusMessage(`Creating an approximate ${locationRegionLabel} for a better match…`)
        const location = await refreshLocationContext()
        if (location) {
          context = {
            ...context,
            latitude: location.latitude,
            longitude: location.longitude,
          }
        }
      }

      setStatusMessage('Uploading clip and asking the backend for a match…')
      const result = await identifyBirdClip({
        uri,
        name: clipName,
        mimeType: 'audio/m4a',
        context,
      })

      await upsertSighting(result)
      await refreshQueueStats()
      setStatus('idle')
      setStatusMessage(`Top match ready: ${result.top_match.common_name}`)
      navigation.navigate('Result', { result })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not finish identification.'

      if (uri) {
        try {
          await enqueueIdentification({
            clipUri: uri,
            clipName,
            mimeType: 'audio/m4a',
            context,
            lastError: message,
          })
          await refreshQueueStats()
          setQueueMessage('Upload failed, so this clip was saved to the retry queue for later.')
        } catch (queueErr) {
          const queueMessageText = queueErr instanceof Error ? queueErr.message : 'Could not save the clip for retry.'
          setQueueMessage(queueMessageText)
        }
      }

      setRecording(null)
      setStatus('idle')
      setStatusMessage('Tap once to start listening. Tap again to stop and identify.')
      setError(message)
    }
  }, [locationRegionLabel, navigation, recording, refreshLocationContext, refreshQueueStats, useDateContext, useLocationContext])

  const handlePrimaryPress = useCallback(async () => {
    if (status === 'uploading') return
    if (status === 'recording') {
      await stopRecordingAndIdentify()
      return
    }
    await startRecording()
  }, [startRecording, status, stopRecordingAndIdentify])

  const handleLocationToggle = useCallback(async (nextValue: boolean) => {
    setUseLocationContext(nextValue)
    setError(null)

    if (!nextValue) {
      setCapturedLocation(null)
      return
    }

    try {
      setStatusMessage('Checking location permission…')
      await refreshLocationContext()
      setStatusMessage('Tap once to start listening. Tap again to stop and identify.')
    } catch (err) {
      setUseLocationContext(false)
      setStatusMessage('Tap once to start listening. Tap again to stop and identify.')
      setError(err instanceof Error ? err.message : 'Could not get your location.')
    }
  }, [refreshLocationContext])

  const permissionCopy = useMemo(() => {
    if (permissionState === 'granted') return 'Mic ready'
    if (permissionState === 'denied') return 'Mic blocked'
    return 'Permission needed'
  }, [permissionState])

  const locationCopy = useMemo(() => {
    if (!useLocationContext) return 'Approx. region off'
    if (locationPermissionState === 'granted') return 'Approx. region ready'
    if (locationPermissionState === 'denied') return 'Approx. region blocked'
    return 'Approx. region opt-in'
  }, [locationPermissionState, useLocationContext])

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Field capture" title="Listen for the loudest bird">
        <Text style={styles.lede}>
          Record a real clip, send it to the API, and save the result into your local field history automatically.
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.pill, permissionState === 'granted' && styles.pillActive]}><Text style={styles.pillText}>{permissionCopy}</Text></View>
          <View style={[styles.pill, useLocationContext && locationPermissionState === 'granted' && styles.pillActive]}><Text style={styles.pillText}>{locationCopy}</Text></View>
          <View style={[styles.pill, useDateContext && styles.pillActive]}><Text style={styles.pillText}>{useDateContext ? 'Date on' : 'Date off'}</Text></View>
          <View style={[styles.pill, status === 'recording' && styles.pillActive]}><Text style={styles.pillText}>Recording</Text></View>
          <View style={[styles.pill, status === 'uploading' && styles.pillProcessing]}><Text style={styles.pillText}>Identifying</Text></View>
          <View style={[styles.pill, queueStats.pending > 0 && styles.pillQueued]}><Text style={styles.pillText}>Queued {queueStats.pending}</Text></View>
        </View>
      </SectionCard>

      <SectionCard eyebrow="Context before upload" title="Attach the clues that help most">
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Use approximate location</Text>
            <Text style={styles.toggleHelp}>Optional. Ask once, then attach a fresh coarse region right before upload instead of a precise pin.</Text>
          </View>
          <Switch value={useLocationContext} onValueChange={(value) => { handleLocationToggle(value).catch(() => undefined) }} />
        </View>
        <Text style={styles.contextPreview}>Approximate region preview: {formatApproximateLocationPreview(capturedLocation?.latitude, capturedLocation?.longitude)}</Text>
        <Text style={styles.contextPreview}>Most specific location sent: {locationRegionLabel}</Text>
        {locationPermissionState === 'denied' ? (
          <PrimaryButton
            title="Open app settings"
            onPress={() => {
              Linking.openSettings().catch(() => undefined)
            }}
            variant="secondary"
            disabled={status === 'recording' || status === 'uploading'}
          />
        ) : null}
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Use device date</Text>
            <Text style={styles.toggleHelp}>On by default. No extra permission needed.</Text>
          </View>
          <Switch value={useDateContext} onValueChange={setUseDateContext} />
        </View>
        <Text style={styles.contextPreview}>Date preview: {useDateContext ? capturedDate : 'No date attached'}</Text>
      </SectionCard>

      <SectionCard eyebrow="Retry queue" title="Don’t lose a field clip to bad signal">
        <Text style={styles.helper}>
          If upload fails, the app now saves the recording locally and retries it later. Opening this screen will make another pass automatically.
        </Text>
        <Text style={styles.contextPreview}>
          Pending clips: {queueStats.pending} • Previously attempted: {queueStats.attempted}
        </Text>
        {queueStats.newestQueuedAt ? (
          <Text style={styles.contextPreview}>Newest queued clip: {new Date(queueStats.newestQueuedAt).toLocaleDateString()}</Text>
        ) : null}
        <View style={styles.buttonStack}>
          <PrimaryButton
            title={queueProcessing ? 'Retrying queued clips…' : 'Retry queued clips now'}
            onPress={() => {
              runQueuedRetries('manual').catch(() => undefined)
            }}
            disabled={queueProcessing || status === 'recording' || status === 'uploading'}
            variant="secondary"
          />
        </View>
        {queueMessage ? <Text style={styles.queueMessage}>{queueMessage}</Text> : null}
      </SectionCard>

      <SectionCard eyebrow="One-tap flow" title={status === 'recording' ? 'Tap to stop and identify' : 'Tap to start listening'}>
        <Text style={styles.helper}>{statusMessage}</Text>
        <View style={styles.buttonStack}>
          <PrimaryButton
            title={status === 'uploading' ? 'Working…' : status === 'recording' ? 'Stop and identify' : 'Start listening'}
            onPress={() => {
              handlePrimaryPress().catch(() => undefined)
            }}
            disabled={status === 'uploading'}
          />
          <PrimaryButton
            title="Request microphone permission"
            onPress={() => {
              requestPermission().catch(() => undefined)
            }}
            variant="secondary"
            disabled={status === 'recording' || status === 'uploading'}
          />
        </View>
      </SectionCard>

      {error ? (
        <SectionCard eyebrow="Problem" title="Could not continue">
          <Text style={styles.error}>{error}</Text>
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Field tips" title="Make the first clip count">
        <Text style={styles.tip}>• Keep clips around 5–15 seconds.</Text>
        <Text style={styles.tip}>• Point the phone toward the loudest singer.</Text>
        <Text style={styles.tip}>• Approximate location is opt-in, but it still helps a lot when similar species overlap.</Text>
        <Text style={styles.tip}>• The app snaps location to about a {locationRegionLabel} before upload instead of sending a precise point.</Text>
        <Text style={styles.tip}>• If you lose signal, the retry queue keeps the clip around for another shot.</Text>
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
  lede: {
    color: '#3E5345',
    fontSize: 16,
    lineHeight: 22,
  },
  helper: {
    color: '#4E6557',
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    color: '#8A2F23',
    fontSize: 15,
    lineHeight: 21,
  },
  queueMessage: {
    color: '#255F38',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#EEF3EC',
  },
  pillActive: {
    backgroundColor: '#D4EBD8',
  },
  pillProcessing: {
    backgroundColor: '#F6E1CF',
  },
  pillQueued: {
    backgroundColor: '#E8E0FA',
  },
  pillText: {
    color: '#255F38',
    fontWeight: '700',
  },
  buttonStack: {
    gap: 12,
    marginTop: 4,
  },
  tip: {
    color: '#304237',
    fontSize: 15,
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    color: '#16241C',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleHelp: {
    color: '#4E6557',
    fontSize: 14,
    lineHeight: 20,
  },
  contextPreview: {
    color: '#33453A',
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E3EDE1',
  },
})

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Audio } from 'expo-av'
import * as Location from 'expo-location'
import { Animated, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { upsertSighting } from '../lib/history'
import { identifyBirdClip } from '../lib/api'
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
  const [error, setError] = useState<string | null>(null)
  const [queueStats, setQueueStats] = useState({ pending: 0, attempted: 0, newestQueuedAt: null as string | null })
  const [queueProcessing, setQueueProcessing] = useState(false)

  const pulseAnim = useRef(new Animated.Value(1)).current
  const pulseOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (status === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.35, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start()
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start()
    } else {
      pulseAnim.stopAnimation()
      pulseOpacity.stopAnimation()
      pulseAnim.setValue(1)
      pulseOpacity.setValue(0)
    }
  }, [status, pulseAnim, pulseOpacity])

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

  const runQueuedRetries = useCallback(async () => {
    setQueueProcessing(true)
    try {
      const result = await processRetryQueue()
      await refreshQueueStats()
      if (result.succeeded > 0 && result.latestSuccess) {
        navigation.navigate('Result', { result: result.latestSuccess })
      }
    } catch {
      // silent on auto-retry
    } finally {
      setQueueProcessing(false)
    }
  }, [navigation, refreshQueueStats])

  useEffect(() => {
    syncPermission().catch(() => undefined)
    syncLocationPermission().catch(() => undefined)
    refreshQueueStats().catch(() => undefined)
  }, [refreshQueueStats, syncLocationPermission, syncPermission])

  useFocusEffect(
    useCallback(() => {
      syncPermission().catch(() => undefined)
      syncLocationPermission().catch(() => undefined)
      refreshQueueStats().catch(() => undefined)
      runQueuedRetries().catch(() => undefined)

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
    if (!result.granted) setError('Microphone access is needed to record bird songs.')
    return result.granted
  }, [])

  const requestLocationPermission = useCallback(async () => {
    const result = await Location.requestForegroundPermissionsAsync()
    setLocationPermissionState(toPermissionState(result.granted, result.canAskAgain))
    if (!result.granted) setCapturedLocation(null)
    return result.granted
  }, [])

  const refreshLocationContext = useCallback(async () => {
    const hasPermission = locationPermissionState === 'granted' ? true : await requestLocationPermission()
    if (!hasPermission) return null
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    const next = { latitude: location.coords.latitude, longitude: location.coords.longitude }
    setCapturedLocation(next)
    return next
  }, [locationPermissionState, requestLocationPermission])

  const startRecording = useCallback(async () => {
    const hasPermission = permissionState === 'granted' ? true : await requestPermission()
    if (!hasPermission) return
    setError(null)
    setStatus('recording')
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
      const nextRecording = new Audio.Recording()
      await nextRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await nextRecording.startAsync()
      setRecording(nextRecording)
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Could not start recording.')
    }
  }, [permissionState, requestPermission])

  const stopRecordingAndIdentify = useCallback(async () => {
    if (!recording) return
    setStatus('uploading')
    setError(null)
    let uri: string | null = null
    let context: CaptureContext = {}
    const clipName = `birdsong-${Date.now()}.m4a`

    try {
      await recording.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true })
      uri = recording.getURI()
      setRecording(null)
      if (!uri) throw new Error('Recording finished but no audio file was produced.')

      if (useDateContext) context.recordedOn = new Date().toISOString().slice(0, 10)
      if (useLocationContext) {
        const location = await refreshLocationContext()
        if (location) context = { ...context, latitude: location.latitude, longitude: location.longitude }
      }

      const result = await identifyBirdClip({ uri, name: clipName, mimeType: 'audio/m4a', context })
      await upsertSighting(result)
      await refreshQueueStats()
      setStatus('idle')
      navigation.navigate('Result', { result })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not finish identification.'
      if (uri) {
        try {
          await enqueueIdentification({ clipUri: uri, clipName, mimeType: 'audio/m4a', context, lastError: message })
          await refreshQueueStats()
        } catch {
          // queue save failed silently
        }
      }
      setRecording(null)
      setStatus('idle')
      setError(message)
    }
  }, [navigation, recording, refreshLocationContext, refreshQueueStats, useDateContext, useLocationContext])

  const handlePrimaryPress = useCallback(async () => {
    if (status === 'uploading') return
    if (status === 'recording') { await stopRecordingAndIdentify(); return }
    await startRecording()
  }, [startRecording, status, stopRecordingAndIdentify])

  const handleLocationToggle = useCallback(async (nextValue: boolean) => {
    setUseLocationContext(nextValue)
    setError(null)
    if (!nextValue) { setCapturedLocation(null); return }
    try { await refreshLocationContext() } catch { setUseLocationContext(false) }
  }, [refreshLocationContext])

  const buttonLabel = useMemo(() => {
    if (status === 'uploading') return 'Identifying…'
    if (status === 'recording') return 'Tap to stop'
    return 'Tap to listen'
  }, [status])

  const buttonIcon = useMemo(() => {
    if (status === 'uploading') return '◌'
    if (status === 'recording') return '■'
    return '●'
  }, [status])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Birdsong ID</Text>
        <View style={styles.headerRight}>
          {queueStats.pending > 0 && (
            <Pressable onPress={() => { runQueuedRetries().catch(() => undefined) }} disabled={queueProcessing}>
              <View style={styles.queueBadge}>
                <Text style={styles.queueBadgeText}>{queueStats.pending} queued</Text>
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {/* Status chips */}
      <View style={styles.statusRow}>
        <View style={[styles.chip, permissionState === 'granted' && styles.chipActive]}>
          <Text style={styles.chipText}>
            {permissionState === 'granted' ? '🎙 Ready' : permissionState === 'denied' ? '🎙 Blocked' : '🎙 Tap to allow'}
          </Text>
        </View>
        {useLocationContext && (
          <View style={[styles.chip, locationPermissionState === 'granted' && styles.chipActive]}>
            <Text style={styles.chipText}>
              {capturedLocation ? '📍 Located' : locationPermissionState === 'denied' ? '📍 Blocked' : '📍 Getting…'}
            </Text>
          </View>
        )}
      </View>

      {/* Center — record button */}
      <View style={styles.center}>
        <View style={styles.buttonWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
            ]}
          />
          <Pressable
            style={[
              styles.recordButton,
              status === 'recording' && styles.recordButtonActive,
              status === 'uploading' && styles.recordButtonUploading,
            ]}
            onPress={() => { handlePrimaryPress().catch(() => undefined) }}
            disabled={status === 'uploading'}
          >
            <Text style={styles.recordIcon}>{buttonIcon}</Text>
          </Pressable>
        </View>

        <Text style={styles.buttonLabel}>{buttonLabel}</Text>

        {permissionState === 'denied' && (
          <Pressable onPress={() => { Linking.openSettings().catch(() => undefined) }}>
            <Text style={styles.permissionLink}>Open Settings to allow microphone</Text>
          </Pressable>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      {/* Bottom — context toggles */}
      <View style={styles.bottom}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>📍  Location context</Text>
          <Switch
            value={useLocationContext}
            onValueChange={(v) => { handleLocationToggle(v).catch(() => undefined) }}
            trackColor={{ true: '#255F38' }}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>📅  Date context</Text>
          <Switch
            value={useDateContext}
            onValueChange={setUseDateContext}
            trackColor={{ true: '#255F38' }}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  appTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#102016',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  queueBadge: {
    backgroundColor: '#E8E0FA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  queueBadgeText: {
    color: '#4A2E8A',
    fontSize: 12,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 8,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#E8EFE6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipActive: {
    backgroundColor: '#C8E6C9',
  },
  chipText: {
    fontSize: 13,
    color: '#1E4E2E',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  buttonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#255F38',
  },
  recordButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#255F38',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#255F38',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  recordButtonActive: {
    backgroundColor: '#C0392B',
    shadowColor: '#C0392B',
  },
  recordButtonUploading: {
    backgroundColor: '#8E9E92',
    shadowColor: '#8E9E92',
  },
  recordIcon: {
    fontSize: 52,
    color: '#FFFFFF',
    lineHeight: 58,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#304237',
    letterSpacing: -0.2,
  },
  permissionLink: {
    fontSize: 14,
    color: '#255F38',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  error: {
    fontSize: 14,
    color: '#9B2335',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  bottom: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#1C2E22',
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E3EDE1',
  },
})

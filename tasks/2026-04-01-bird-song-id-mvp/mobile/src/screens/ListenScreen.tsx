import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Audio } from 'expo-av'
import * as Location from 'expo-location'
import { Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'

import { PrimaryButton } from '../components/PrimaryButton'
import { SectionCard } from '../components/SectionCard'
import { upsertSighting } from '../lib/history'
import { identifyBirdClip } from '../lib/api'
import type { CaptureContext, LocationPermissionState, RecordingPermissionState, RootStackParamList } from '../types'

function toPermissionState(granted: boolean, canAskAgain: boolean): RecordingPermissionState {
  return granted ? 'granted' : canAskAgain ? 'undetermined' : 'denied'
}

function formatLocationPreview(latitude?: number, longitude?: number) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return 'No location attached yet'
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
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

  const syncPermission = useCallback(async () => {
    const current = await Audio.getPermissionsAsync()
    setPermissionState(toPermissionState(current.granted, current.canAskAgain))
  }, [])

  const syncLocationPermission = useCallback(async () => {
    const current = await Location.getForegroundPermissionsAsync()
    setLocationPermissionState(toPermissionState(current.granted, current.canAskAgain))
  }, [])

  useEffect(() => {
    syncPermission().catch(() => undefined)
    syncLocationPermission().catch(() => undefined)
    setCapturedDate(new Date().toISOString().slice(0, 10))
  }, [syncLocationPermission, syncPermission])

  useFocusEffect(
    useCallback(() => {
      syncPermission().catch(() => undefined)
      syncLocationPermission().catch(() => undefined)
      setCapturedDate(new Date().toISOString().slice(0, 10))

      return () => {
        if (recording) {
          recording.stopAndUnloadAsync().catch(() => undefined)
          setRecording(null)
          setStatus('idle')
        }
      }
    }, [recording, syncLocationPermission, syncPermission]),
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
      setError('Location is optional, but enabling it can improve similar-species matches.')
    }

    return result.granted
  }, [])

  const refreshLocationContext = useCallback(async () => {
    const hasPermission = locationPermissionState === 'granted' ? true : await requestLocationPermission()
    if (!hasPermission) return null

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    const next = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    }

    setCapturedLocation(next)
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

    try {
      await recording.stopAndUnloadAsync()
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      })

      const uri = recording.getURI()
      setRecording(null)

      if (!uri) {
        throw new Error('Recording finished, but no audio file was produced.')
      }

      let context: CaptureContext = {}
      if (useDateContext) {
        const recordedOn = new Date().toISOString().slice(0, 10)
        setCapturedDate(recordedOn)
        context.recordedOn = recordedOn
      }

      if (useLocationContext) {
        setStatusMessage('Getting your current location for a better match…')
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
        name: `birdsong-${Date.now()}.m4a`,
        mimeType: 'audio/m4a',
        context,
      })

      await upsertSighting(result)
      setStatus('idle')
      setStatusMessage(`Top match ready: ${result.top_match.common_name}`)
      navigation.navigate('Result', { result })
    } catch (err) {
      setRecording(null)
      setStatus('idle')
      setStatusMessage('Tap once to start listening. Tap again to stop and identify.')
      setError(err instanceof Error ? err.message : 'Could not finish identification.')
    }
  }, [navigation, recording, refreshLocationContext, useDateContext, useLocationContext])

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
    if (!useLocationContext) return 'Location off'
    if (locationPermissionState === 'granted') return 'Location ready'
    if (locationPermissionState === 'denied') return 'Location blocked'
    return 'Location opt-in'
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
        </View>
      </SectionCard>

      <SectionCard eyebrow="Context before upload" title="Attach the clues that help most">
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Use current location</Text>
            <Text style={styles.toggleHelp}>Optional. Ask once, then attach a fresh GPS fix right before upload.</Text>
          </View>
          <Switch value={useLocationContext} onValueChange={(value) => { handleLocationToggle(value).catch(() => undefined) }} />
        </View>
        <Text style={styles.contextPreview}>Location preview: {formatLocationPreview(capturedLocation?.latitude, capturedLocation?.longitude)}</Text>
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
        <Text style={styles.tip}>• Location is opt-in, but it helps a lot when similar species overlap.</Text>
        <Text style={styles.tip}>• Each result is saved to the History tab for later review.</Text>
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
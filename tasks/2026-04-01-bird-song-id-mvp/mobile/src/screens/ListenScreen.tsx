import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Audio } from 'expo-av'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { PrimaryButton } from '../components/PrimaryButton'
import { SectionCard } from '../components/SectionCard'
import { upsertSighting } from '../lib/history'
import { identifyBirdClip } from '../lib/api'
import type { RecordingPermissionState, RootStackParamList } from '../types'

export function ListenScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [permissionState, setPermissionState] = useState<RecordingPermissionState>('undetermined')
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [status, setStatus] = useState<'idle' | 'recording' | 'uploading'>('idle')
  const [statusMessage, setStatusMessage] = useState('Tap once to start listening. Tap again to stop and identify.')
  const [error, setError] = useState<string | null>(null)

  const syncPermission = useCallback(async () => {
    const current = await Audio.getPermissionsAsync()
    setPermissionState(current.granted ? 'granted' : current.canAskAgain ? 'undetermined' : 'denied')
  }, [])

  useEffect(() => {
    syncPermission().catch(() => undefined)
  }, [syncPermission])

  useFocusEffect(
    useCallback(() => {
      syncPermission().catch(() => undefined)

      return () => {
        if (recording) {
          recording.stopAndUnloadAsync().catch(() => undefined)
          setRecording(null)
          setStatus('idle')
        }
      }
    }, [recording, syncPermission]),
  )

  const requestPermission = useCallback(async () => {
    setError(null)
    const result = await Audio.requestPermissionsAsync()
    setPermissionState(result.granted ? 'granted' : result.canAskAgain ? 'undetermined' : 'denied')
    if (!result.granted) {
      setError('Microphone access is required to record bird songs on your phone.')
    }
    return result.granted
  }, [])

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
    setStatusMessage('Uploading clip and asking the backend for a match…')
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

      const result = await identifyBirdClip({
        uri,
        name: `birdsong-${Date.now()}.m4a`,
        mimeType: 'audio/m4a',
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
  }, [navigation, recording])

  const handlePrimaryPress = useCallback(async () => {
    if (status === 'uploading') return
    if (status === 'recording') {
      await stopRecordingAndIdentify()
      return
    }
    await startRecording()
  }, [startRecording, status, stopRecordingAndIdentify])

  const permissionCopy = useMemo(() => {
    if (permissionState === 'granted') return 'Mic ready'
    if (permissionState === 'denied') return 'Mic blocked'
    return 'Permission needed'
  }, [permissionState])

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Field capture" title="Listen for the loudest bird">
        <Text style={styles.lede}>
          Record a real clip, send it to the API, and save the result into your local field history automatically.
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.pill, permissionState === 'granted' && styles.pillActive]}><Text style={styles.pillText}>{permissionCopy}</Text></View>
          <View style={[styles.pill, status === 'recording' && styles.pillActive]}><Text style={styles.pillText}>Recording</Text></View>
          <View style={[styles.pill, status === 'uploading' && styles.pillProcessing]}><Text style={styles.pillText}>Identifying</Text></View>
        </View>
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
})

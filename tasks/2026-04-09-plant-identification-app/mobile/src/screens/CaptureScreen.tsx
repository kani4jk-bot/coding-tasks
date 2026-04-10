import { useCallback, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { PrimaryButton } from '../components/PrimaryButton'
import { SectionCard } from '../components/SectionCard'
import { identifyPlant } from '../lib/api'
import type { RootStackParamList } from '../types'

export function CaptureScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [status, setStatus] = useState<'idle' | 'uploading'>('idle')
  const [error, setError] = useState<string | null>(null)

  const pickAndIdentify = useCallback(
    async (uri: string, filename: string, mimeType: string) => {
      setStatus('uploading')
      setError(null)
      try {
        const result = await identifyPlant(uri, filename, mimeType)
        setStatus('idle')
        navigation.navigate('Result', { result })
      } catch (err) {
        setStatus('idle')
        setError(err instanceof Error ? err.message : 'Could not identify the plant. Please try again.')
      }
    },
    [navigation],
  )

  const handleCamera = useCallback(async () => {
    setError(null)
    const picked = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 })
    if (picked.canceled || !picked.assets[0]) return
    const asset = picked.assets[0]
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg'
    await pickAndIdentify(asset.uri, `plant-${Date.now()}.${ext}`, ext === 'png' ? 'image/png' : 'image/jpeg')
  }, [pickAndIdentify])

  const handleLibrary = useCallback(async () => {
    setError(null)
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 })
    if (picked.canceled || !picked.assets[0]) return
    const asset = picked.assets[0]
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg'
    await pickAndIdentify(asset.uri, `plant-${Date.now()}.${ext}`, ext === 'png' ? 'image/png' : 'image/jpeg')
  }, [pickAndIdentify])

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>🌿</Text>
        <Text style={styles.heroTitle}>Identify any plant</Text>
        <Text style={styles.heroSub}>
          Take or upload a photo and get instant species identification, care tips, and fun facts.
        </Text>
      </View>

      <SectionCard eyebrow="Capture" title="Choose a photo source">
        <View style={styles.buttonStack}>
          <PrimaryButton
            title={status === 'uploading' ? 'Identifying…' : 'Take a photo'}
            onPress={() => { handleCamera().catch(() => undefined) }}
            disabled={status === 'uploading'}
            loading={status === 'uploading'}
          />
          <PrimaryButton
            title="Pick from library"
            onPress={() => { handleLibrary().catch(() => undefined) }}
            variant="secondary"
            disabled={status === 'uploading'}
          />
        </View>
      </SectionCard>

      {error ? (
        <SectionCard eyebrow="Problem" title="Could not continue">
          <Text style={styles.error}>{error}</Text>
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Tips" title="Get the best identification">
        <Text style={styles.tip}>• Focus on leaves, flowers, or fruit — they carry the most identifying detail.</Text>
        <Text style={styles.tip}>• Natural light gives the clearest colours.</Text>
        <Text style={styles.tip}>• Try to capture the whole plant or a representative section.</Text>
        <Text style={styles.tip}>• Avoid blurry or overexposed shots for higher confidence.</Text>
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
  hero: {
    backgroundColor: '#1b4332',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  heroIcon: {
    fontSize: 48,
    lineHeight: 56,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonStack: {
    gap: 12,
  },
  error: {
    color: '#991b1b',
    fontSize: 15,
    lineHeight: 22,
  },
  tip: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
  },
})

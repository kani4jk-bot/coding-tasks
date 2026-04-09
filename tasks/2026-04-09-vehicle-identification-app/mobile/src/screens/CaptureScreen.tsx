import { useCallback, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native'

import { PrimaryButton } from '../components/PrimaryButton'
import { SectionCard } from '../components/SectionCard'
import { identifyVehicle } from '../lib/api'
import { upsertIdentification } from '../lib/history'
import type { RootStackParamList } from '../types'

const VEHICLE_TYPES = ['Cars & trucks', 'Motorcycles', 'Bicycles & scooters', 'Aircraft', 'Trains', 'Boats & ships', 'Buses', 'And more…']

export function CaptureScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()
  const [status, setStatus] = useState<'idle' | 'uploading'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [previewUri, setPreviewUri] = useState<string | null>(null)

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings().catch(() => undefined)
  }, [])

  const pickAndIdentify = useCallback(
    async (imageUri: string, filename: string, mimeType: string) => {
      setPreviewUri(imageUri)
      setStatus('uploading')
      setError(null)

      try {
        const result = await identifyVehicle(imageUri, filename, mimeType)
        await upsertIdentification(result)
        setStatus('idle')
        navigation.navigate('Result', { result })
      } catch (err) {
        setStatus('idle')
        setError(err instanceof Error ? err.message : 'Could not identify the vehicle. Please try again.')
      }
    },
    [navigation],
  )

  const handleCamera = useCallback(async () => {
    setError(null)

    const hasPerm = cameraPermission?.granted ?? false
    if (!hasPerm) {
      const result = await requestCameraPermission()
      if (!result.granted) {
        setError('Camera permission is required to take photos.')
        return
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    })

    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    const uri = asset.uri
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    await pickAndIdentify(uri, `vehicle-${Date.now()}.${ext}`, mime)
  }, [cameraPermission, pickAndIdentify, requestCameraPermission])

  const handleLibrary = useCallback(async () => {
    setError(null)

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    })

    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    const uri = asset.uri
    const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg'
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    await pickAndIdentify(uri, `vehicle-${Date.now()}.${ext}`, mime)
  }, [pickAndIdentify])

  const cameraBlocked = cameraPermission?.granted === false && !cameraPermission?.canAskAgain

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Vehicle ID" title="Point at any vehicle and identify it">
        <Text style={styles.lede}>
          Take a photo or pick one from your library. The app uses AI vision to identify the vehicle and fetch fun facts, specs, and history.
        </Text>

        <View style={styles.typeGrid}>
          {VEHICLE_TYPES.map((t) => (
            <View key={t} style={styles.typeChip}>
              <Text style={styles.typeChipText}>{t}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      {previewUri && status === 'uploading' ? (
        <SectionCard eyebrow="Analyzing" title="Identifying vehicle…">
          <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />
          <Text style={styles.helper}>Sending image to the AI identification engine…</Text>
        </SectionCard>
      ) : null}

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
          {cameraBlocked ? (
            <PrimaryButton title="Open app settings" onPress={handleOpenSettings} variant="secondary" />
          ) : null}
        </View>
      </SectionCard>

      {error ? (
        <SectionCard eyebrow="Problem" title="Could not continue">
          <Text style={styles.error}>{error}</Text>
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Tips" title="Get the best identification">
        <Text style={styles.tip}>• Fill the frame with the vehicle for the clearest match.</Text>
        <Text style={styles.tip}>• Good lighting makes a big difference — avoid deep shadows.</Text>
        <Text style={styles.tip}>• A side or three-quarter view helps identify make and model.</Text>
        <Text style={styles.tip}>• Works on cars, planes, trains, bikes, boats, scooters, and more.</Text>
        <Text style={styles.tip}>• Badges, grilles, and taillights are key identification clues.</Text>
      </SectionCard>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    backgroundColor: '#F0F2F8',
  },
  lede: {
    color: '#364861',
    fontSize: 16,
    lineHeight: 23,
  },
  helper: {
    color: '#4A5E72',
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    color: '#8A2323',
    fontSize: 15,
    lineHeight: 21,
  },
  buttonStack: {
    gap: 12,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    backgroundColor: '#E8EDF8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  typeChipText: {
    color: '#1A3C6B',
    fontSize: 13,
    fontWeight: '600',
  },
  tip: {
    color: '#2E3F50',
    fontSize: 15,
    lineHeight: 22,
  },
})

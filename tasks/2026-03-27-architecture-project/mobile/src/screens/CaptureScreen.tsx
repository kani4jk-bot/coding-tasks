import { useCallback, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'

import { PrimaryButton } from '../components/PrimaryButton'
import { SectionCard } from '../components/SectionCard'
import type { RootStackParamList } from '../types'

const ROOM_TYPES = ['Living rooms', 'Kitchens', 'Bedrooms', 'Bathrooms', 'Home offices', 'Dining rooms']

export function CaptureScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions()
  const [error, setError] = useState<string | null>(null)

  const cameraBlocked = cameraPermission?.granted === false && !cameraPermission?.canAskAgain

  const handlePick = useCallback(
    async (picker: () => Promise<ImagePicker.ImagePickerResult>) => {
      setError(null)
      const result = await picker()
      if (result.canceled || !result.assets[0]) return
      const asset = result.assets[0]
      navigation.navigate('Editor', {
        imageUri: asset.uri,
        imageWidth: asset.width ?? 1024,
        imageHeight: asset.height ?? 768,
      })
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
    handlePick(() =>
      ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: false }),
    ).catch(() => undefined)
  }, [cameraPermission, handlePick, requestCameraPermission])

  const handleLibrary = useCallback(() => {
    handlePick(() =>
      ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: false }),
    ).catch(() => undefined)
  }, [handlePick])

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>🏠✨</Text>
        <Text style={styles.heroTitle}>AI Room Editor</Text>
        <Text style={styles.heroSub}>
          Photograph any room, select an area, and describe the change you want. AI does the rest.
        </Text>
      </View>

      <SectionCard eyebrow="Works with" title="Supported room types" dark>
        <View style={styles.chipGrid}>
          {ROOM_TYPES.map((t) => (
            <View key={t} style={styles.chip}>
              <Text style={styles.chipText}>{t}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard eyebrow="Step 1" title="Choose a room photo" dark>
        <View style={styles.buttonStack}>
          <PrimaryButton title="Take a photo" onPress={handleCamera} />
          <PrimaryButton title="Pick from library" onPress={handleLibrary} variant="secondary" />
          {cameraBlocked ? (
            <PrimaryButton
              title="Open app settings"
              onPress={() => { Linking.openSettings().catch(() => undefined) }}
              variant="secondary"
            />
          ) : null}
        </View>
      </SectionCard>

      {error ? (
        <SectionCard eyebrow="Problem" title="Could not continue" dark>
          <Text style={styles.error}>{error}</Text>
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="How it works" title="Three simple steps" dark>
        <Text style={styles.step}>① Choose a room photo</Text>
        <Text style={styles.step}>② Draw a box or tap points on the area to change</Text>
        <Text style={styles.step}>③ Describe what you want — AI generates the edit</Text>
      </SectionCard>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    backgroundColor: '#0F172A',
  },
  hero: {
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  heroIcon: {
    fontSize: 44,
    lineHeight: 52,
  },
  heroTitle: {
    color: '#F1F5F9',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroSub: {
    color: 'rgba(241,245,249,0.7)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  chipText: {
    color: '#c4b5fd',
    fontWeight: '600',
    fontSize: 13,
  },
  buttonStack: {
    gap: 12,
  },
  error: {
    color: '#FCA5A5',
    fontSize: 15,
    lineHeight: 22,
  },
  step: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 24,
  },
})

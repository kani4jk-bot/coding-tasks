import { useCallback, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { PrimaryButton } from '../components/PrimaryButton'
import { SectionCard } from '../components/SectionCard'
import { editImage } from '../lib/api'
import type { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>

const PRESETS = [
  'Warm oak flooring',
  'Sage green walls',
  'Stone countertops',
  'Modern sofa',
  'Brass accents',
  'Mood lighting',
]

export function EditorScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { imageUri } = route.params

  const [modification, setModification] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!modification.trim()) {
      Alert.alert('Describe the change', 'Enter a description before generating.')
      return
    }
    setGenerating(true)
    setError(null)
    try {
      const result = await editImage({ imageUri, modification: modification.trim() })
      navigation.navigate('Result', { original: imageUri, edited: result })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }, [modification, imageUri, navigation])

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        </View>

        <SectionCard eyebrow="Step 2 — Describe" title="What should change?" dark>
          <TextInput
            value={modification}
            onChangeText={setModification}
            placeholder="e.g. warm oak flooring with natural grain…"
            placeholderTextColor="#64748B"
            multiline
            textAlignVertical="top"
            style={styles.input}
          />
          <View style={styles.presetRow}>
            {PRESETS.map((p) => (
              <Pressable key={p} style={styles.preset} onPress={() => setModification(p)}>
                <Text style={styles.presetText}>{p}</Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        {error ? (
          <SectionCard eyebrow="Error" title="Generation failed" dark>
            <Text style={styles.errorText}>{error}</Text>
          </SectionCard>
        ) : null}

        <PrimaryButton
          title={generating ? 'Generating edit…' : '✦ Generate edit'}
          onPress={() => { handleGenerate().catch(() => undefined) }}
          loading={generating}
          disabled={generating}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0F172A' },
  content: {
    padding: 16,
    gap: 16,
    backgroundColor: '#0F172A',
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  input: {
    minHeight: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F1F5F9',
    fontSize: 15,
    lineHeight: 21,
  },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  presetText: { color: '#CBD5E1', fontWeight: '600', fontSize: 13 },
  errorText: { color: '#FCA5A5', fontSize: 15, lineHeight: 22 },
})

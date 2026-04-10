import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import {
  Alert,
  Image,
  PanResponder,
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
import type { Box, Point, RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Editor'>

const PRESETS = [
  'Warm oak flooring',
  'Sage green walls',
  'Stone countertops',
  'Modern sofa',
  'Brass accents',
  'Mood lighting',
]

const IMAGE_CONTAINER_HEIGHT = 300

// Compute where the image actually renders inside a contain-mode container.
function getImageBounds(containerW: number, containerH: number, imgW: number, imgH: number) {
  if (!containerW || !containerH || !imgW || !imgH) return null
  const scale = Math.min(containerW / imgW, containerH / imgH)
  const w = imgW * scale
  const h = imgH * scale
  return { x: (containerW - w) / 2, y: (containerH - h) / 2, w, h, scale }
}

export function EditorScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { imageUri, imageWidth, imageHeight } = route.params

  const [mode, setMode] = useState<'box' | 'point'>('box')
  const [intent, setIntent] = useState<'foreground' | 'background'>('foreground')
  const [points, setPoints] = useState<Point[]>([])
  const [box, setBox] = useState<Box | null>(null)
  const [modification, setModification] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [containerW, setContainerW] = useState(0)

  // Live drag box in screen coordinates (for display only)
  const dragRef = useRef<{ sx: number; sy: number } | null>(null)
  const [liveBox, setLiveBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  const bounds = useMemo(
    () => getImageBounds(containerW, IMAGE_CONTAINER_HEIGHT, imageWidth, imageHeight),
    [containerW, imageWidth, imageHeight],
  )

  // Map a touch coordinate (relative to the container View) to image pixel coords.
  const toImageCoords = useCallback(
    (touchX: number, touchY: number): { x: number; y: number } | null => {
      if (!bounds) return null
      const rx = touchX - bounds.x
      const ry = touchY - bounds.y
      if (rx < 0 || ry < 0 || rx > bounds.w || ry > bounds.h) return null
      return {
        x: Math.round((rx / bounds.w) * imageWidth),
        y: Math.round((ry / bounds.h) * imageHeight),
      }
    },
    [bounds, imageWidth, imageHeight],
  )

  // PanResponder for box mode drag
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => mode === 'box',
        onMoveShouldSetPanResponder: () => mode === 'box',
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent
          dragRef.current = { sx: locationX, sy: locationY }
          setLiveBox(null)
        },
        onPanResponderMove: (evt) => {
          if (!dragRef.current) return
          const { locationX, locationY } = evt.nativeEvent
          const { sx, sy } = dragRef.current
          setLiveBox({
            x: Math.min(sx, locationX),
            y: Math.min(sy, locationY),
            w: Math.abs(locationX - sx),
            h: Math.abs(locationY - sy),
          })
        },
        onPanResponderRelease: (evt) => {
          if (!dragRef.current) return
          const { locationX, locationY } = evt.nativeEvent
          const start = toImageCoords(dragRef.current.sx, dragRef.current.sy)
          const end = toImageCoords(locationX, locationY)
          if (
            start &&
            end &&
            Math.abs(end.x - start.x) >= 10 &&
            Math.abs(end.y - start.y) >= 10
          ) {
            setBox({ start, end })
          }
          dragRef.current = null
          setLiveBox(null)
        },
      }),
    [mode, toImageCoords],
  )

  // Tap handler for point mode
  const handleTap = useCallback(
    (evt: { nativeEvent: { locationX: number; locationY: number } }) => {
      if (mode !== 'point') return
      const coords = toImageCoords(evt.nativeEvent.locationX, evt.nativeEvent.locationY)
      if (!coords) return
      setPoints((prev) => [...prev, { ...coords, type: intent }])
    },
    [mode, intent, toImageCoords],
  )

  const clearSelection = useCallback(() => {
    setPoints([])
    setBox(null)
    setLiveBox(null)
  }, [])

  const hasValidSelection =
    mode === 'box' ? box !== null : points.some((p) => p.type === 'foreground')

  const handleGenerate = useCallback(async () => {
    if (!modification.trim()) {
      Alert.alert('Describe the change', 'Enter a description before generating.')
      return
    }
    if (!hasValidSelection) {
      Alert.alert(
        'Select an area',
        mode === 'box'
          ? 'Drag a box over the part of the room you want to change.'
          : 'Tap at least one green include point on the area to change.',
      )
      return
    }
    setGenerating(true)
    setError(null)
    try {
      const result = await editImage({
        imageUri,
        mode,
        modification: modification.trim(),
        points: mode === 'point' ? points : undefined,
        box: mode === 'box' ? (box ?? undefined) : undefined,
      })
      navigation.navigate('Result', { original: imageUri, edited: result })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }, [modification, hasValidSelection, mode, points, box, imageUri, navigation])

  // Convert committed box to screen coordinates for rendering
  const screenBox = useMemo(() => {
    if (!box || !bounds) return null
    const x1 = bounds.x + (Math.min(box.start.x, box.end.x) / imageWidth) * bounds.w
    const y1 = bounds.y + (Math.min(box.start.y, box.end.y) / imageHeight) * bounds.h
    const x2 = bounds.x + (Math.max(box.start.x, box.end.x) / imageWidth) * bounds.w
    const y2 = bounds.y + (Math.max(box.start.y, box.end.y) / imageHeight) * bounds.h
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
  }, [box, bounds, imageWidth, imageHeight])

  // Convert points to screen coordinates
  const screenPoints = useMemo(() => {
    if (!bounds) return []
    return points.map((p) => ({
      ...p,
      sx: bounds.x + (p.x / imageWidth) * bounds.w,
      sy: bounds.y + (p.y / imageHeight) * bounds.h,
    }))
  }, [points, bounds, imageWidth, imageHeight])

  const gestureHandlers = mode === 'box' ? panResponder.panHandlers : {}

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* ── Image with selection overlay ── */}
      <View
        style={styles.imageContainer}
        onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
        {...gestureHandlers}
      >
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

        {/* Tap overlay for point mode */}
        {mode === 'point' ? (
          <Pressable style={StyleSheet.absoluteFill} onPress={handleTap} />
        ) : null}

        {/* Committed selection points */}
        {screenPoints.map((p, i) => (
          <View
            key={i}
            style={[
              styles.point,
              p.type === 'foreground' ? styles.pointInclude : styles.pointExclude,
              { left: p.sx - 14, top: p.sy - 14 },
            ]}
          >
            <Text style={styles.pointLabel}>{i + 1}</Text>
          </View>
        ))}

        {/* Committed box */}
        {screenBox ? (
          <View
            style={[
              styles.selectionBox,
              { left: screenBox.x, top: screenBox.y, width: screenBox.w, height: screenBox.h },
            ]}
          />
        ) : null}

        {/* Live drag box */}
        {liveBox ? (
          <View
            style={[
              styles.selectionBoxLive,
              { left: liveBox.x, top: liveBox.y, width: liveBox.w, height: liveBox.h },
            ]}
          />
        ) : null}
      </View>

      {/* ── Selection controls ── */}
      <SectionCard eyebrow="Step 2 — Selection" title="Mark what to change" dark>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeBtn, mode === 'box' && styles.modeBtnActive]}
            onPress={() => { setMode('box'); clearSelection() }}
          >
            <Text style={[styles.modeBtnText, mode === 'box' && styles.modeBtnTextActive]}>■ Box</Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, mode === 'point' && styles.modeBtnActive]}
            onPress={() => { setMode('point'); clearSelection() }}
          >
            <Text style={[styles.modeBtnText, mode === 'point' && styles.modeBtnTextActive]}>● Points</Text>
          </Pressable>
        </View>

        {mode === 'point' ? (
          <View style={styles.intentRow}>
            <Pressable
              style={[styles.intentBtn, intent === 'foreground' && styles.intentInclude]}
              onPress={() => setIntent('foreground')}
            >
              <Text style={[styles.intentText, intent === 'foreground' && { color: '#fff' }]}>
                + Include
              </Text>
            </Pressable>
            <Pressable
              style={[styles.intentBtn, intent === 'background' && styles.intentExclude]}
              onPress={() => setIntent('background')}
            >
              <Text style={[styles.intentText, intent === 'background' && { color: '#fff' }]}>
                − Exclude
              </Text>
            </Pressable>
          </View>
        ) : null}

        {points.length > 0 || box ? (
          <Pressable style={styles.clearBtn} onPress={clearSelection}>
            <Text style={styles.clearBtnText}>Clear selection</Text>
          </Pressable>
        ) : null}

        <Text style={styles.hint}>
          {mode === 'box'
            ? 'Drag on the image above to draw a box around the area to edit.'
            : 'Tap on the image above to place include (green) and exclude (red) points.'}
        </Text>
      </SectionCard>

      {/* ── Prompt ── */}
      <SectionCard eyebrow="Step 3 — Describe" title="What should change?" dark>
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
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    backgroundColor: '#0F172A',
  },
  imageContainer: {
    height: IMAGE_CONTAINER_HEIGHT,
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
  point: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  pointInclude: { backgroundColor: 'rgba(34, 197, 94, 0.9)' },
  pointExclude: { backgroundColor: 'rgba(239, 68, 68, 0.9)' },
  pointLabel: { color: '#fff', fontSize: 11, fontWeight: '800' },
  selectionBox: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(167, 139, 250, 0.9)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
  },
  selectionBoxLive: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(167, 139, 250, 0.55)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(139, 92, 246, 0.10)',
  },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modeBtnActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderColor: 'rgba(167, 139, 250, 0.5)',
  },
  modeBtnText: { color: '#94A3B8', fontWeight: '700', fontSize: 15 },
  modeBtnTextActive: { color: '#E2E8F0' },
  intentRow: { flexDirection: 'row', gap: 10 },
  intentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  intentInclude: { backgroundColor: 'rgba(34, 197, 94, 0.8)', borderColor: 'rgba(34, 197, 94, 0.4)' },
  intentExclude: { backgroundColor: 'rgba(239, 68, 68, 0.8)', borderColor: 'rgba(239, 68, 68, 0.4)' },
  intentText: { color: '#94A3B8', fontWeight: '700', fontSize: 15 },
  clearBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(252,165,165,0.3)',
  },
  clearBtnText: { color: '#FCA5A5', fontWeight: '700', fontSize: 14 },
  hint: { color: '#64748B', fontSize: 13, lineHeight: 19 },
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

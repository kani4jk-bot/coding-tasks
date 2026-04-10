import { useCallback, useRef, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import {
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { SectionCard } from '../components/SectionCard'
import type { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>

const SLIDER_CONTAINER_HEIGHT = 320

export function ResultScreen({ route, navigation }: Props) {
  const { original, edited } = route.params
  const [containerW, setContainerW] = useState(0)
  const [sliderX, setSliderX] = useState<number | null>(null) // screen-coord position of the divider
  const panRef = useRef<{ startX: number; startSlider: number } | null>(null)

  // sliderFraction: 0 = full after, 1 = full before. Default 50%.
  const fraction = sliderX != null && containerW ? sliderX / containerW : 0.5

  const panResponder = useCallback(
    (currentSlider: number) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          panRef.current = { startX: evt.nativeEvent.pageX, startSlider: currentSlider }
        },
        onPanResponderMove: (evt) => {
          if (!panRef.current || !containerW) return
          const delta = evt.nativeEvent.pageX - panRef.current.startX
          const next = Math.max(0, Math.min(containerW, panRef.current.startSlider + delta))
          setSliderX(next)
        },
      }),
    [containerW],
  )

  const currentSlider = sliderX ?? containerW * 0.5
  const pr = panResponder(currentSlider)

  const handleStartOver = useCallback(() => {
    navigation.popToTop()
  }, [navigation])

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* ── Before/After comparison ── */}
      <View
        style={styles.compareContainer}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width
          setContainerW(w)
          if (sliderX === null) setSliderX(w * 0.5)
        }}
      >
        {containerW > 0 ? (
          <>
            {/* After image (always full width, behind) */}
            <Image
              source={{ uri: edited.edited_image }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
            />
            {/* Before image (original), clipped to left of slider */}
            <View style={[styles.beforeClip, { width: currentSlider }]}>
              <Image
                source={{ uri: original }}
                style={{ width: containerW, height: SLIDER_CONTAINER_HEIGHT }}
                resizeMode="contain"
              />
            </View>
            {/* Divider line */}
            <View style={[styles.dividerLine, { left: currentSlider - 1 }]} />
            {/* Drag handle */}
            <View
              style={[styles.handle, { left: currentSlider - 22 }]}
              {...pr.panHandlers}
            >
              <Text style={styles.handleArrows}>‹ ›</Text>
            </View>
            {/* Labels */}
            <View style={[styles.label, styles.labelLeft]}>
              <Text style={styles.labelText}>Before</Text>
            </View>
            <View style={[styles.label, styles.labelRight]}>
              <Text style={styles.labelText}>After</Text>
            </View>
          </>
        ) : null}
      </View>

      <SectionCard eyebrow="Result" title="Edit complete" dark>
        <Text style={styles.description}>
          Drag the divider on the image to compare the original and edited versions.
          {fraction < 0.3
            ? ' Showing mostly the AI edit.'
            : fraction > 0.7
            ? ' Showing mostly the original.'
            : ' Split view.'}
        </Text>
      </SectionCard>

      <Pressable style={styles.startOverBtn} onPress={handleStartOver}>
        <Text style={styles.startOverText}>Start over with a new photo</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    backgroundColor: '#0F172A',
  },
  compareContainer: {
    height: SLIDER_CONTAINER_HEIGHT,
    backgroundColor: '#020617',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  beforeClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: SLIDER_CONTAINER_HEIGHT,
    overflow: 'hidden',
  },
  dividerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  handle: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleArrows: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -2,
  },
  label: {
    position: 'absolute',
    top: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  labelLeft: { left: 14 },
  labelRight: { right: 14 },
  labelText: {
    color: '#F1F5F9',
    fontWeight: '700',
    fontSize: 13,
  },
  description: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
  },
  startOverBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  startOverText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 16,
  },
})

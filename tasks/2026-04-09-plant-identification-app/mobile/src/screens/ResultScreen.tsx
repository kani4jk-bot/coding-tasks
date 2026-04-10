import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { SectionCard } from '../components/SectionCard'
import type { GrowingTip, RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>

const CATEGORY_ICONS: Record<string, string> = {
  Light: '☀️',
  Watering: '💧',
  Soil: '🪱',
  Humidity: '💨',
  Fertilizing: '🌿',
  Temperature: '🌡️',
  Pruning: '✂️',
  Repotting: '🪴',
}

const CONFIDENCE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  high:   { label: 'High confidence',   bg: '#D1FAE5', text: '#065F46' },
  medium: { label: 'Medium confidence', bg: '#FEF9C3', text: '#854D0E' },
  low:    { label: 'Low confidence',    bg: '#FEE2E2', text: '#991B1B' },
}

export function ResultScreen({ route }: Props) {
  const plant = route.params.result.result
  const conf = CONFIDENCE_CONFIG[plant.confidence]

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Top match" title={plant.common_name}>
        <Text style={styles.scientificName}>{plant.scientific_name}</Text>
        <View style={[styles.badge, { backgroundColor: conf.bg }]}>
          <Text style={[styles.badgeText, { color: conf.text }]}>{conf.label}</Text>
        </View>
        <Text style={styles.description}>{plant.description}</Text>
      </SectionCard>

      {plant.fun_facts.length > 0 ? (
        <SectionCard eyebrow="Fun facts" title="Interesting things about this plant">
          {plant.fun_facts.map((fact, i) => (
            <View key={i} style={styles.factRow}>
              <Text style={styles.factBullet}>🌱</Text>
              <Text style={styles.factText}>{fact}</Text>
            </View>
          ))}
        </SectionCard>
      ) : null}

      {plant.is_houseplant && plant.growing_tips.length > 0 ? (
        <SectionCard eyebrow="Care guide" title="How to grow at home">
          <View style={styles.tipsGrid}>
            {plant.growing_tips.map((tip: GrowingTip, i: number) => (
              <View key={i} style={styles.tipItem}>
                <View style={styles.tipHeader}>
                  <Text style={styles.tipIcon}>{CATEGORY_ICONS[tip.category] ?? '🌱'}</Text>
                  <Text style={styles.tipCategory}>{tip.category}</Text>
                </View>
                <Text style={styles.tipText}>{tip.tip}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    backgroundColor: '#F0F8F2',
  },
  scientificName: {
    fontStyle: 'italic',
    color: '#6B7280',
    fontSize: 15,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  description: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 23,
  },
  factRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  factBullet: {
    fontSize: 14,
    marginTop: 2,
  },
  factText: {
    flex: 1,
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tipItem: {
    backgroundColor: '#F0F8F2',
    borderRadius: 12,
    padding: 12,
    width: '47%',
    gap: 4,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipIcon: {
    fontSize: 16,
  },
  tipCategory: {
    color: '#2d6a4f',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tipText: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 19,
  },
})

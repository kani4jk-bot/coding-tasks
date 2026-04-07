import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { SectionCard } from '../components/SectionCard'
import type { RootStackParamList } from '../types'

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>

function ConfidenceBar({ value }: { value: number }) {
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.round(value * 100)}%` }]} />
    </View>
  )
}

export function ResultScreen({ route }: Props) {
  const { result } = route.params
  const hasAlternatives = result.alternatives.length > 0
  const hasAdvice = result.advice.length > 0

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Top match" title={result.top_match.common_name}>
        <Text style={styles.scientific}>{result.top_match.scientific_name}</Text>
        <ConfidenceBar value={result.top_match.confidence} />
        <Text style={styles.confidence}>{Math.round(result.top_match.confidence * 100)}% confidence</Text>
        <Text style={styles.reason}>{result.top_match.reason}</Text>
      </SectionCard>

      <SectionCard eyebrow="Alternatives" title="Also worth checking">
        {hasAlternatives ? (
          result.alternatives.map((item) => (
            <View key={item.species_code} style={styles.altRow}>
              <View style={styles.altCopy}>
                <Text style={styles.altTitle}>{item.common_name}</Text>
                <Text style={styles.altSubtitle}>{item.scientific_name}</Text>
              </View>
              <Text style={styles.altConfidence}>{Math.round(item.confidence * 100)}%</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No alternative matches came back for this clip.</Text>
        )}
      </SectionCard>

      <SectionCard eyebrow="Clip" title={result.clip.filename}>
        <Text style={styles.meta}>Provider: {result.provider}</Text>
        <Text style={styles.meta}>Size: {(result.clip.file_size_bytes / 1024 / 1024).toFixed(1)} MB</Text>
        <Text style={styles.meta}>Request: {result.request_id}</Text>
        {result.clip.latitude != null && result.clip.longitude != null ? (
          <Text style={styles.meta}>Location: {result.clip.latitude.toFixed(4)}, {result.clip.longitude.toFixed(4)}</Text>
        ) : null}
        {result.clip.recorded_on ? <Text style={styles.meta}>Recorded on: {result.clip.recorded_on}</Text> : null}
      </SectionCard>

      <SectionCard eyebrow="Advice" title="How to improve the next try">
        {hasAdvice ? result.advice.map((line) => <Text key={line} style={styles.tip}>• {line}</Text>) : <Text style={styles.empty}>No extra advice from the backend for this clip.</Text>}
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
  scientific: {
    color: '#4C6555',
    fontStyle: 'italic',
    fontSize: 16,
  },
  confidence: {
    color: '#255F38',
    fontWeight: '800',
    fontSize: 16,
  },
  reason: {
    color: '#33453A',
    fontSize: 15,
    lineHeight: 22,
  },
  empty: {
    color: '#5B7162',
    fontSize: 15,
    lineHeight: 22,
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E3EDE1',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#255F38',
    borderRadius: 999,
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomColor: '#ECF1EA',
    borderBottomWidth: 1,
  },
  altCopy: {
    flex: 1,
    paddingRight: 12,
  },
  altTitle: {
    color: '#16241C',
    fontWeight: '700',
    fontSize: 16,
  },
  altSubtitle: {
    color: '#5B7162',
    fontSize: 14,
  },
  altConfidence: {
    color: '#255F38',
    fontWeight: '800',
  },
  meta: {
    color: '#33453A',
    fontSize: 15,
  },
  tip: {
    color: '#304237',
    fontSize: 15,
    lineHeight: 22,
  },
})

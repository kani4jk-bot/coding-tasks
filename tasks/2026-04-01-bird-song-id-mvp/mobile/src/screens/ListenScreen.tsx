import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { PrimaryButton } from '../components/PrimaryButton'
import { SectionCard } from '../components/SectionCard'
import { mockResult } from '../data/mockResult'
import type { RootStackParamList } from '../types'

export function ListenScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing'>('idle')

  const simulateRecording = () => setStatus((current) => (current === 'listening' ? 'idle' : 'listening'))

  const simulateIdentify = () => {
    setStatus('processing')
    setTimeout(() => {
      setStatus('idle')
      navigation.navigate('Result', { result: mockResult })
    }, 600)
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Field capture" title="Listen for the loudest bird">
        <Text style={styles.lede}>
          This native shell is phone-first: big controls, short-session flow, and a clean handoff to the result screen.
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.pill, status === 'listening' && styles.pillActive]}><Text style={styles.pillText}>Mic</Text></View>
          <View style={[styles.pill, status === 'processing' && styles.pillProcessing]}><Text style={styles.pillText}>Identify</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>Phone UX</Text></View>
        </View>
      </SectionCard>

      <SectionCard eyebrow="Primary action" title={status === 'listening' ? 'Recording in progress' : 'Ready to capture'}>
        <Text style={styles.helper}>
          Phase 2 shell only for now. Real microphone capture gets wired next, but the screen layout and flow are in place.
        </Text>
        <View style={styles.buttonStack}>
          <PrimaryButton title={status === 'listening' ? 'Stop listening' : 'Start listening'} onPress={simulateRecording} />
          <PrimaryButton title="Use demo identification" onPress={simulateIdentify} variant="secondary" />
        </View>
      </SectionCard>

      <SectionCard eyebrow="Field tips" title="Make the first clip count">
        <Text style={styles.tip}>• Keep clips around 5–15 seconds.</Text>
        <Text style={styles.tip}>• Point the phone toward the loudest singer.</Text>
        <Text style={styles.tip}>• Avoid talking while the app is listening.</Text>
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

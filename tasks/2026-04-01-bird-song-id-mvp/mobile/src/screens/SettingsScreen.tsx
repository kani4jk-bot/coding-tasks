import { ScrollView, StyleSheet, Text } from 'react-native'

import { SectionCard } from '../components/SectionCard'

export function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Backend" title="Service connection">
        <Text style={styles.copy}>Uses `EXPO_PUBLIC_API_BASE` when set, otherwise defaults to `http://localhost:8000`.</Text>
      </SectionCard>
      <SectionCard eyebrow="Permissions" title="Native app roadmap">
        <Text style={styles.copy}>Microphone permissions, recording quality presets, and upload retry settings belong here next.</Text>
      </SectionCard>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    backgroundColor: '#F4F7F1',
    flexGrow: 1,
  },
  copy: {
    color: '#4E6557',
    fontSize: 15,
    lineHeight: 21,
  },
})

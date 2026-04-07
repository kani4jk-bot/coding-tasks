import { ScrollView, StyleSheet, Text } from 'react-native'

import { SectionCard } from '../components/SectionCard'
import { getApiBase } from '../lib/api'

export function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Backend" title="Service connection">
        <Text style={styles.copy}>Uses `EXPO_PUBLIC_API_BASE` when set.</Text>
        <Text style={styles.mono}>{getApiBase()}</Text>
      </SectionCard>
      <SectionCard eyebrow="History" title="Saved sightings">
        <Text style={styles.copy}>History now lives on-device. It is fast and useful, but not synced to a backend account yet.</Text>
      </SectionCard>
      <SectionCard eyebrow="Permissions" title="Native app roadmap">
        <Text style={styles.copy}>Good next steps: add location/date capture, field notes, and a retry queue for weak connectivity.</Text>
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
  mono: {
    marginTop: 10,
    color: '#255F38',
    fontFamily: 'monospace',
    fontSize: 13,
  },
})

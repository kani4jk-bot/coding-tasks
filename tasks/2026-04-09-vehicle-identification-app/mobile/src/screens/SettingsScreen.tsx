import { ScrollView, StyleSheet, Text } from 'react-native'

import { SectionCard } from '../components/SectionCard'

export function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="About" title="VehicleID">
        <Text style={styles.helper}>Version 0.1.0</Text>
        <Text style={styles.helper}>
          Take a photo of any vehicle — car, plane, train, motorcycle, boat, or more — and the AI identifies it with fun facts, specs, and history.
        </Text>
        <Text style={styles.helper}>
          Powered by Claude Vision (Anthropic). No image is stored on the server after identification.
        </Text>
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
  helper: {
    color: '#4A5E72',
    fontSize: 15,
    lineHeight: 22,
  },
})

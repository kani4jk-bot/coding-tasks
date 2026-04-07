import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { SectionCard } from '../components/SectionCard'

export function HistoryScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Coming next" title="Recent identifications">
        <Text style={styles.copy}>
          This placeholder is where saved clips, retries, and field-session history will live once persistence lands on the backend.
        </Text>
      </SectionCard>
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No saved sessions yet</Text>
        <Text style={styles.copy}>Once the app records real IDs, this tab becomes the birding notebook.</Text>
      </View>
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
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  emptyTitle: {
    color: '#16241C',
    fontWeight: '800',
    fontSize: 20,
    marginBottom: 8,
  },
  copy: {
    color: '#4E6557',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
})

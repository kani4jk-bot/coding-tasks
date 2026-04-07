import { PropsWithChildren } from 'react'
import { StyleSheet, Text, View } from 'react-native'

type SectionCardProps = PropsWithChildren<{
  eyebrow?: string
  title?: string
}>

export function SectionCard({ eyebrow, title, children }: SectionCardProps) {
  return (
    <View style={styles.card}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    gap: 10,
    shadowColor: '#102016',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  eyebrow: {
    color: '#5D7A68',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#102016',
    fontSize: 22,
    fontWeight: '800',
  },
})

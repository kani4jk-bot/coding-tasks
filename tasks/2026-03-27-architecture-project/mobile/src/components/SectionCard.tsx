import { StyleSheet, Text, View } from 'react-native'

type Props = {
  eyebrow?: string
  title: string
  children?: React.ReactNode
  dark?: boolean
}

export function SectionCard({ eyebrow, title, children, dark }: Props) {
  return (
    <View style={[styles.card, dark && styles.cardDark]}>
      {eyebrow ? <Text style={[styles.eyebrow, dark && styles.eyebrowDark]}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={[styles.title, dark && styles.titleDark]}>{title}</Text>
      {children ? <View style={styles.body}>{children}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderColor: 'rgba(255,255,255,0.10)',
  },
  eyebrow: {
    color: '#8b5cf6',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  eyebrowDark: {
    color: '#c4b5fd',
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  titleDark: {
    color: '#F1F5F9',
  },
  body: {
    gap: 10,
    marginTop: 2,
  },
})

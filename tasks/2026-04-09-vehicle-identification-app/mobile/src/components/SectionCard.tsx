import { StyleSheet, Text, View } from 'react-native'

type Props = {
  eyebrow?: string
  title: string
  children?: React.ReactNode
}

export function SectionCard({ eyebrow, title, children }: Props) {
  return (
    <View style={styles.card}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={styles.title}>{title}</Text>
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  eyebrow: {
    color: '#1A3C6B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: '#0D1B2A',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  body: {
    gap: 10,
    marginTop: 2,
  },
})

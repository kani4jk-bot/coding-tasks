import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'

type Props = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  loading?: boolean
}

export function PrimaryButton({ title, onPress, variant = 'primary', disabled, loading }: Props) {
  const isPrimary = variant === 'primary'
  const isDanger = variant === 'danger'
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : isDanger ? styles.danger : styles.secondary,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : '#2d6a4f'} size="small" />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : isDanger ? styles.labelDanger : styles.labelSecondary]}>
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primary: { backgroundColor: '#2d6a4f' },
  secondary: { backgroundColor: '#E8F5ED' },
  danger: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  label: { fontSize: 16, fontWeight: '700' },
  labelPrimary: { color: '#FFFFFF' },
  labelSecondary: { color: '#2d6a4f' },
  labelDanger: { color: '#DC2626' },
})

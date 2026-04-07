import { Pressable, StyleSheet, Text } from 'react-native'

type PrimaryButtonProps = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function PrimaryButton({ title, onPress, variant = 'primary', disabled = false }: PrimaryButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variant === 'secondary' ? styles.secondary : styles.primary,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.text, variant === 'secondary' ? styles.secondaryText : styles.primaryText]}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: '#255F38',
  },
  secondary: {
    backgroundColor: '#E8F0E7',
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#255F38',
  },
})

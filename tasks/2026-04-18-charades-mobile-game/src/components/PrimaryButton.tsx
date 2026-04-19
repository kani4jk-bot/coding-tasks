import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BUTTON_SHADOW } from '../styles/theme';

type Props = {
  label: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
};

export default function PrimaryButton({
  label,
  onPress,
  color = COLORS.primary,
  textColor = '#FFF',
  style,
  disabled,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: color }, disabled && styles.disabled, style]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    ...BUTTON_SHADOW,
  },
  label: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.45,
  },
});

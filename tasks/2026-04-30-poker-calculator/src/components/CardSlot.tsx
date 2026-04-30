import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Card } from '../types';
import { cardRank, cardSuit, suitColor } from '../utils/pokerEngine';
import { theme } from '../theme';

const SUIT_SYMBOLS: Record<string, string> = {
  h: '♥', d: '♦', c: '♣', s: '♠',
};

interface Props {
  card: Card | null;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function CardSlot({ card, onPress, size = 'md', disabled = false }: Props) {
  const dim = { sm: 44, md: 56, lg: 72 }[size];
  const fontSize = { sm: 11, md: 14, lg: 18 }[size];
  const suitSize = { sm: 8, md: 10, lg: 13 }[size];

  if (!card) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[styles.empty, { width: dim, height: dim * 1.4, borderRadius: theme.radius.sm }]}
        activeOpacity={0.7}
      >
        <Text style={styles.plus}>+</Text>
      </TouchableOpacity>
    );
  }

  const rankVal = card[0] === 'T' ? '10' : card[0];
  const suit = card[1];
  const color = suitColor(card);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.card, { width: dim, height: dim * 1.4, borderRadius: theme.radius.sm }]}
      activeOpacity={0.8}
    >
      <View style={styles.cardInner}>
        <Text style={[styles.rank, { fontSize, color: color === 'red' ? theme.colors.red : theme.colors.black }]}>
          {rankVal}
        </Text>
        <Text style={[styles.suit, { fontSize: suitSize, color: color === 'red' ? theme.colors.red : theme.colors.black }]}>
          {SUIT_SYMBOLS[suit]}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontSize: 22,
    color: theme.colors.textDim,
    fontWeight: '300',
  },
  card: {
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  cardInner: {
    alignItems: 'center',
    gap: 2,
  },
  rank: {
    fontWeight: '800',
    lineHeight: undefined,
  },
  suit: {
    fontWeight: '600',
  },
});
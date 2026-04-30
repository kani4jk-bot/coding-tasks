import React, { useState, useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { Card } from '../types';
import { getAllCards, suitColor } from '../utils/pokerEngine';
import { theme } from '../theme';

const SUIT_SYMBOLS: Record<string, string> = { h: '♥', d: '♦', c: '♣', s: '♠' };
const SUITS = ['h', 'd', 'c', 's'];
const RANKS_DISPLAY = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

interface Props {
  visible: boolean;
  onSelect: (card: Card) => void;
  onClear: () => void;
  onClose: () => void;
  usedCards: Set<Card>;
  currentCard: Card | null;
  title?: string;
}

export function CardPickerModal({ visible, onSelect, onClear, onClose, usedCards, currentCard, title }: Props) {
  const [suitFilter, setSuitFilter] = useState<string | null>(null);
  const allCards = useMemo(() => getAllCards(), []);
  const displayCards = useMemo(() => {
    return RANKS_DISPLAY.flatMap(r =>
      (suitFilter ? [suitFilter] : SUITS).map(s => `${r}${s}` as Card)
    ).filter(c => allCards.includes(c));
  }, [suitFilter, allCards]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title ?? 'Select Card'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.suitRow}>
          <TouchableOpacity style={[styles.suitBtn, !suitFilter && styles.suitBtnActive]} onPress={() => setSuitFilter(null)}>
            <Text style={[styles.suitBtnTxt, !suitFilter && styles.suitBtnTxtActive]}>All</Text>
          </TouchableOpacity>
          {SUITS.map(s => (
            <TouchableOpacity key={s} style={[styles.suitBtn, suitFilter === s && styles.suitBtnActive]} onPress={() => setSuitFilter(suitFilter === s ? null : s)}>
              <Text style={[styles.suitBtnTxt, { color: ['h', 'd'].includes(s) ? theme.colors.red : theme.colors.text }, suitFilter === s && styles.suitBtnTxtActive]}>
                {SUIT_SYMBOLS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {displayCards.map(card => {
            const isUsed = usedCards.has(card) && card !== currentCard;
            const isCurrent = card === currentCard;
            const rankDisplay = card[0] === 'T' ? '10' : card[0];
            const color = suitColor(card);
            return (
              <TouchableOpacity key={card} onPress={() => !isUsed && onSelect(card)} disabled={isUsed}
                style={[styles.cardBtn, isCurrent && styles.cardBtnSelected, isUsed && styles.cardBtnUsed]} activeOpacity={0.7}>
                <Text style={[styles.cardRank, { color: color === 'red' ? (isUsed ? '#884444' : theme.colors.red) : (isUsed ? '#555' : theme.colors.black) }, isCurrent && { color: color === 'red' ? '#ff8888' : '#ffffff' }]}>
                  {rankDisplay}
                </Text>
                <Text style={[styles.cardSuit, { color: color === 'red' ? (isUsed ? '#884444' : theme.colors.red) : (isUsed ? '#555' : theme.colors.black) }, isCurrent && { color: color === 'red' ? '#ff8888' : '#ffffff' }]}>
                  {SUIT_SYMBOLS[card[1]]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {currentCard && (
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
              <Text style={styles.clearTxt}>Remove Card</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  title: { color: theme.colors.gold, fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  closeBtn: { padding: theme.spacing.sm },
  closeTxt: { color: theme.colors.textMuted, fontSize: 18 },
  suitRow: { flexDirection: 'row', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, gap: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  suitBtn: { flex: 1, paddingVertical: 8, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', backgroundColor: theme.colors.surface },
  suitBtnActive: { borderColor: theme.colors.gold, backgroundColor: theme.colors.surfaceAlt },
  suitBtnTxt: { color: theme.colors.textMuted, fontSize: 18, fontWeight: '600' },
  suitBtnTxtActive: { color: theme.colors.gold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: theme.spacing.md, gap: 8, justifyContent: 'center' },
  cardBtn: { width: 58, height: 80, backgroundColor: theme.colors.cardBg, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.cardBorder, alignItems: 'center', justifyContent: 'center', gap: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
  cardBtnSelected: { borderColor: theme.colors.gold, borderWidth: 2, backgroundColor: theme.colors.goldDark },
  cardBtnUsed: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, opacity: 0.4 },
  cardRank: { fontSize: 16, fontWeight: '800' },
  cardSuit: { fontSize: 12, fontWeight: '600' },
  footer: { padding: theme.spacing.lg, borderTopWidth: 1, borderTopColor: theme.colors.border },
  clearBtn: { backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.danger, borderRadius: theme.radius.md, padding: theme.spacing.md, alignItems: 'center' },
  clearTxt: { color: theme.colors.danger, fontSize: 15, fontWeight: '600' },
});
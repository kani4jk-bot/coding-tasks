import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '../components/PrimaryButton';
import type { RootStackParamList } from '../types';
import { CATEGORIES } from '../data/words';
import { COLORS, shared } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CategorySelect'>;

export default function CategorySelectScreen({ navigation, route }: Props) {
  const { settings } = route.params;
  const [selected, setSelected] = useState<Set<string>>(new Set(CATEGORIES.map(c => c.id)));

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      if (next.size === 1) {
        Alert.alert('Select at least one category');
        return;
      }
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === CATEGORIES.length) {
      setSelected(new Set([CATEGORIES[0].id]));
    } else {
      setSelected(new Set(CATEGORIES.map(c => c.id)));
    }
  }

  function handleStart() {
    const initialScores: Record<string, number> = {};
    for (const t of settings.teams) initialScores[t.id] = 0;

    navigation.navigate('Ready', {
      settings: { ...settings, selectedCategoryIds: Array.from(selected) },
      currentRound: 1,
      currentTeamIndex: 0,
      scores: initialScores,
    });
  }

  const allSelected = selected.size === CATEGORIES.length;

  return (
    <SafeAreaView style={shared.screenBg}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={shared.screenTitle}>Categories</Text>
          <Text style={styles.selectedCount}>{selected.size} of {CATEGORIES.length} selected</Text>
        </View>
        <TouchableOpacity onPress={toggleAll} style={styles.allBtn}>
          <Text style={styles.allBtnText}>{allSelected ? 'Clear' : 'All'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.grid}>
          {CATEGORIES.map(cat => {
            const active = selected.has(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.card, active ? { backgroundColor: cat.color, borderColor: cat.color } : styles.cardInactive]}
                onPress={() => toggle(cat.id)}
                activeOpacity={0.8}
              >
                {active && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
                <Text style={styles.cardEmoji}>{cat.emoji}</Text>
                <Text style={[styles.cardName, !active && styles.cardNameInactive]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <PrimaryButton
          label={`Start Game  🎭`}
          onPress={handleStart}
          color={COLORS.success}
          style={styles.startBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 34, color: COLORS.textSub, lineHeight: 36 },
  headerText: { flex: 1 },
  selectedCount: { fontSize: 13, color: COLORS.textMuted, marginTop: 1 },
  allBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  allBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textSub },
  scroll: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  card: {
    width: '47%',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  cardInactive: {
    backgroundColor: COLORS.surface,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 12, color: '#FFF', fontWeight: '900' },
  cardEmoji: { fontSize: 34, marginBottom: 8 },
  cardName: { fontSize: 13, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  cardNameInactive: { color: COLORS.textSub },
  startBtn: { marginTop: 4 },
});

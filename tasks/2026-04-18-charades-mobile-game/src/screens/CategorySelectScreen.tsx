import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { CATEGORIES } from '../data/words';

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Categories</Text>
        <Text style={styles.sub}>Tap to toggle — mix it up!</Text>

        <View style={styles.grid}>
          {CATEGORIES.map(cat => {
            const active = selected.has(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.card, { borderColor: cat.color }, active && { backgroundColor: cat.color }]}
                onPress={() => toggle(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.cardEmoji}>{cat.emoji}</Text>
                <Text style={[styles.cardName, active && styles.cardNameActive]}>{cat.name}</Text>
                {active && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>Start Game! 🎭</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  scroll: { padding: 24, paddingBottom: 40 },
  header: { fontSize: 32, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  sub: { fontSize: 15, color: '#888', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%', padding: 16, borderRadius: 16,
    backgroundColor: '#2C2C54', borderWidth: 2,
    alignItems: 'center', position: 'relative',
  },
  cardEmoji: { fontSize: 32, marginBottom: 8 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#AAA' },
  cardNameActive: { color: '#FFF' },
  checkmark: {
    position: 'absolute', top: 8, right: 10,
    fontSize: 14, color: '#FFF', fontWeight: '900',
  },
  startBtn: {
    marginTop: 28, backgroundColor: '#27AE60', borderRadius: 50,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  startBtnText: { fontSize: 20, fontWeight: '800', color: '#FFF' },
});

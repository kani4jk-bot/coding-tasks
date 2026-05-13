import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '../components/PrimaryButton';
import type { RootStackParamList, Team } from '../types';
import { COLORS, shared } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;

const TEAM_COLORS = ['#E74C3C', '#3498DB', '#27AE60', '#F39C12', '#9B59B6', '#1ABC9C'];
const TEAM_NAMES = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Teal'];
const DURATION_OPTIONS = [30, 60, 90, 120];
const ROUND_OPTIONS = [1, 2, 3, 5];

export default function SetupScreen({ navigation }: Props) {
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Team Red', color: TEAM_COLORS[0] },
    { id: '2', name: 'Team Blue', color: TEAM_COLORS[1] },
  ]);
  const [totalRounds, setTotalRounds] = useState(2);
  const [turnDuration, setTurnDuration] = useState(60);

  function addTeam() {
    if (teams.length >= 6) return;
    const idx = teams.length;
    setTeams([...teams, { id: String(Date.now()), name: `Team ${TEAM_NAMES[idx]}`, color: TEAM_COLORS[idx] }]);
  }

  function removeTeam(id: string) {
    if (teams.length <= 2) {
      Alert.alert('Minimum 2 teams required');
      return;
    }
    setTeams(teams.filter(t => t.id !== id));
  }

  function updateTeamName(id: string, name: string) {
    setTeams(teams.map(t => t.id === id ? { ...t, name } : t));
  }

  function handleNext() {
    const trimmed = teams.map(t => ({ ...t, name: t.name.trim() }));
    if (trimmed.some(t => !t.name)) {
      Alert.alert('Please name all teams');
      return;
    }
    navigation.navigate('CategorySelect', {
      settings: { teams: trimmed, totalRounds, turnDurationSeconds: turnDuration },
    });
  }

  return (
    <SafeAreaView style={shared.screenBg}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={shared.screenTitle}>Game Setup</Text>
      </View>
      <ScrollView contentContainerStyle={shared.scrollPad} keyboardShouldPersistTaps="handled">
        <Text style={shared.sectionLabel}>Teams</Text>
        {teams.map((team) => (
          <View key={team.id} style={[styles.teamRow, { borderLeftColor: team.color }]}>
            <View style={[styles.colorDot, { backgroundColor: team.color }]} />
            <TextInput
              style={styles.teamInput}
              value={team.name}
              onChangeText={v => updateTeamName(team.id, v)}
              maxLength={20}
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity onPress={() => removeTeam(team.id)} style={styles.removeBtn} hitSlop={8}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {teams.length < 6 && (
          <TouchableOpacity style={styles.addTeamBtn} onPress={addTeam}>
            <Text style={styles.addTeamText}>+ Add Team</Text>
          </TouchableOpacity>
        )}

        <Text style={[shared.sectionLabel, styles.sectionGap]}>Rounds per Game</Text>
        <View style={styles.optionRow}>
          {ROUND_OPTIONS.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.optionBtn, totalRounds === r && styles.optionBtnActive]}
              onPress={() => setTotalRounds(r)}
            >
              <Text style={[styles.optionText, totalRounds === r && styles.optionTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[shared.sectionLabel, styles.sectionGap]}>Time per Turn</Text>
        <View style={styles.optionRow}>
          {DURATION_OPTIONS.map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.optionBtn, turnDuration === d && styles.optionBtnActive]}
              onPress={() => setTurnDuration(d)}
            >
              <Text style={[styles.optionText, turnDuration === d && styles.optionTextActive]}>{d}s</Text>
            </TouchableOpacity>
          ))}
        </View>

        <PrimaryButton label="Choose Categories →" onPress={handleNext} style={styles.nextBtn} />
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
    paddingBottom: 8,
    gap: 8,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 34, color: COLORS.textSub, lineHeight: 36 },
  sectionGap: { marginTop: 28 },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderLeftWidth: 4,
  },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  teamInput: { flex: 1, fontSize: 16, color: COLORS.text, paddingVertical: 14 },
  removeBtn: { padding: 8 },
  removeBtnText: { color: COLORS.textMuted, fontSize: 15 },
  addTeamBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 2,
  },
  addTeamText: { color: COLORS.textSub, fontSize: 15, fontWeight: '600' },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  optionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  optionTextActive: { color: '#FFF' },
  nextBtn: { marginTop: 36 },
});

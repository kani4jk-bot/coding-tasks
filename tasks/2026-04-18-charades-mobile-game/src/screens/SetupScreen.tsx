import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, TextInput, Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Team } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;

const TEAM_COLORS = ['#E74C3C', '#3498DB', '#27AE60', '#F39C12', '#9B59B6', '#1ABC9C'];
const DURATION_OPTIONS = [30, 60, 90, 120];
const ROUND_OPTIONS = [1, 2, 3, 5];

export default function SetupScreen({ navigation }: Props) {
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Team Red', color: TEAM_COLORS[0], score: 0 },
    { id: '2', name: 'Team Blue', color: TEAM_COLORS[1], score: 0 },
  ]);
  const [totalRounds, setTotalRounds] = useState(2);
  const [turnDuration, setTurnDuration] = useState(60);

  function addTeam() {
    if (teams.length >= 6) return;
    const idx = teams.length;
    const newTeam: Team = {
      id: String(Date.now()),
      name: `Team ${['Red','Blue','Green','Yellow','Purple','Teal'][idx]}`,
      color: TEAM_COLORS[idx],
      score: 0,
    };
    setTeams([...teams, newTeam]);
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Game Setup</Text>

        {/* Teams */}
        <Text style={styles.sectionLabel}>Teams</Text>
        {teams.map((team, i) => (
          <View key={team.id} style={[styles.teamRow, { borderLeftColor: team.color }]}>
            <View style={[styles.colorDot, { backgroundColor: team.color }]} />
            <TextInput
              style={styles.teamInput}
              value={team.name}
              onChangeText={v => updateTeamName(team.id, v)}
              maxLength={20}
              placeholderTextColor="#999"
            />
            <TouchableOpacity onPress={() => removeTeam(team.id)} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {teams.length < 6 && (
          <TouchableOpacity style={styles.addTeamBtn} onPress={addTeam}>
            <Text style={styles.addTeamText}>+ Add Team</Text>
          </TouchableOpacity>
        )}

        {/* Rounds */}
        <Text style={styles.sectionLabel}>Rounds</Text>
        <View style={styles.optionRow}>
          {ROUND_OPTIONS.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.optionBtn, totalRounds === r && styles.optionBtnActive]}
              onPress={() => setTotalRounds(r)}
            >
              <Text style={[styles.optionText, totalRounds === r && styles.optionTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Timer */}
        <Text style={styles.sectionLabel}>Time per Turn</Text>
        <View style={styles.optionRow}>
          {DURATION_OPTIONS.map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.optionBtn, turnDuration === d && styles.optionBtnActive]}
              onPress={() => setTurnDuration(d)}
            >
              <Text style={[styles.optionText, turnDuration === d && styles.optionTextActive]}>
                {d}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>Choose Categories →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  scroll: { padding: 24, paddingBottom: 40 },
  header: { fontSize: 32, fontWeight: '800', color: '#FFF', marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#AAA', letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 12 },
  teamRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2C2C54', borderRadius: 12, marginBottom: 10,
    paddingHorizontal: 12, paddingVertical: 4,
    borderLeftWidth: 4,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  teamInput: { flex: 1, fontSize: 16, color: '#FFF', paddingVertical: 12 },
  removeBtn: { padding: 8 },
  removeBtnText: { color: '#888', fontSize: 16 },
  addTeamBtn: {
    borderWidth: 2, borderColor: '#444', borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  addTeamText: { color: '#888', fontSize: 15, fontWeight: '600' },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#2C2C54', alignItems: 'center',
  },
  optionBtnActive: { backgroundColor: '#F1C40F' },
  optionText: { fontSize: 16, fontWeight: '700', color: '#888' },
  optionTextActive: { color: '#1A1A1A' },
  nextBtn: {
    marginTop: 36, backgroundColor: '#9B59B6', borderRadius: 50,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  nextBtnText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
});

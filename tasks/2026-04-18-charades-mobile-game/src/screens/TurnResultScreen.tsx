import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TurnResult'>;

export default function TurnResultScreen({ navigation, route }: Props) {
  const { result, settings, currentRound, currentTeamIndex, scores } = route.params;
  const team = settings.teams.find(t => t.id === result.teamId)!;

  const nextTeamIndex = currentTeamIndex + 1;
  const isLastTeamInRound = nextTeamIndex >= settings.teams.length;
  const nextRound = isLastTeamInRound ? currentRound + 1 : currentRound;
  const isGameOver = isLastTeamInRound && currentRound >= settings.totalRounds;

  function handleNext() {
    if (isGameOver) {
      navigation.navigate('FinalScore', { settings, scores });
    } else if (isLastTeamInRound) {
      navigation.navigate('Ready', { settings, currentRound: nextRound, currentTeamIndex: 0, scores });
    } else {
      navigation.navigate('Ready', { settings, currentRound, currentTeamIndex: nextTeamIndex, scores });
    }
  }

  const wordsByResult = {
    correct: result.words.filter(w => w.result === 'correct'),
    skipped: result.words.filter(w => w.result === 'skipped'),
    unanswered: result.words.filter(w => w.result === 'unanswered'),
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: team.color }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroSection}>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.scoreValue}>+{result.correct}</Text>
          <Text style={styles.scoreLabel}>points this round</Text>

          <View style={styles.totalsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{result.correct}</Text>
              <Text style={styles.statLbl}>✓ Correct</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{result.skipped}</Text>
              <Text style={styles.statLbl}>⤭ Skipped</Text>
            </View>
          </View>
        </View>

        {/* Score board */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scoreboard</Text>
          {[...settings.teams]
            .sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
            .map((t, i) => (
              <View key={t.id} style={styles.scoreRow}>
                <Text style={styles.scorePos}>#{i + 1}</Text>
                <View style={[styles.scoreColorDot, { backgroundColor: t.color }]} />
                <Text style={styles.scoreTeamName}>{t.name}</Text>
                <Text style={styles.scorePoints}>{scores[t.id] ?? 0} pts</Text>
              </View>
            ))}
        </View>

        {/* Word breakdown */}
        {wordsByResult.correct.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✓ Got it!</Text>
            <View style={styles.wordPills}>
              {wordsByResult.correct.map((w, i) => (
                <View key={i} style={[styles.pill, styles.pillCorrect]}>
                  <Text style={styles.pillText}>{w.word}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {wordsByResult.skipped.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⤭ Skipped</Text>
            <View style={styles.wordPills}>
              {wordsByResult.skipped.map((w, i) => (
                <View key={i} style={[styles.pill, styles.pillSkipped]}>
                  <Text style={styles.pillText}>{w.word}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>
            {isGameOver ? 'See Final Results 🏆' : `Next: ${isLastTeamInRound ? settings.teams[0].name : settings.teams[nextTeamIndex].name}'s Turn →`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },
  heroSection: { alignItems: 'center', marginBottom: 24 },
  teamName: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 8 },
  scoreValue: { fontSize: 80, fontWeight: '900', color: '#FFF', lineHeight: 88 },
  scoreLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 20 },
  totalsRow: { flexDirection: 'row', gap: 16 },
  statBox: {
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 28, alignItems: 'center',
  },
  statNum: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  statLbl: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  section: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  scorePos: { fontSize: 14, color: 'rgba(255,255,255,0.6)', width: 24 },
  scoreColorDot: { width: 10, height: 10, borderRadius: 5 },
  scoreTeamName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#FFF' },
  scorePoints: { fontSize: 18, fontWeight: '900', color: '#F1C40F' },
  wordPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillCorrect: { backgroundColor: 'rgba(39,174,96,0.5)' },
  pillSkipped: { backgroundColor: 'rgba(231,76,60,0.4)' },
  pillText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  nextBtn: {
    marginTop: 20, backgroundColor: '#FFF', borderRadius: 50,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
});

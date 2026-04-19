import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '../components/PrimaryButton';
import type { RootStackParamList } from '../types';
import { rankTeams } from '../utils/game';
import { COLORS, shared } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TurnResult'>;

export default function TurnResultScreen({ navigation, route }: Props) {
  const { result, settings, currentRound, currentTeamIndex, scores } = route.params;
  const team = settings.teams.find(t => t.id === result.teamId)!;

  const nextTeamIndex = currentTeamIndex + 1;
  const isLastTeamInRound = nextTeamIndex >= settings.teams.length;
  const isGameOver = isLastTeamInRound && currentRound >= settings.totalRounds;

  function handleNext() {
    if (isGameOver) {
      navigation.navigate('FinalScore', { settings, scores });
    } else if (isLastTeamInRound) {
      navigation.navigate('Ready', { settings, currentRound: currentRound + 1, currentTeamIndex: 0, scores });
    } else {
      navigation.navigate('Ready', { settings, currentRound, currentTeamIndex: nextTeamIndex, scores });
    }
  }

  const correctWords = result.words.filter(w => w.result === 'correct');
  const skippedWords = result.words.filter(w => w.result === 'skipped');
  const ranked = rankTeams(settings.teams, scores);
  const nextTeam = isLastTeamInRound ? settings.teams[0] : settings.teams[nextTeamIndex];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: team.color }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroSection}>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.scoreValue}>+{result.correct}</Text>
          <Text style={styles.scoreLabel}>points this turn</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{result.correct}</Text>
              <Text style={styles.statLbl}>Correct</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{result.skipped}</Text>
              <Text style={styles.statLbl}>Skipped</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={shared.sectionLabel}>Scoreboard</Text>
          {ranked.map((t, i) => (
            <View key={t.id} style={[styles.scoreRow, t.id === team.id && styles.scoreRowHighlight]}>
              <Text style={styles.scorePos}>#{i + 1}</Text>
              <View style={[styles.scoreColorDot, { backgroundColor: t.color }]} />
              <Text style={styles.scoreTeamName}>{t.name}</Text>
              <Text style={styles.scorePoints}>{scores[t.id] ?? 0} pts</Text>
            </View>
          ))}
        </View>

        {correctWords.length > 0 && (
          <View style={styles.section}>
            <Text style={shared.sectionLabel}>✓ Got it!</Text>
            <View style={styles.wordPills}>
              {correctWords.map((w, i) => (
                <View key={i} style={[styles.pill, styles.pillCorrect]}>
                  <Text style={styles.pillText}>{w.word}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {skippedWords.length > 0 && (
          <View style={styles.section}>
            <Text style={shared.sectionLabel}>↷ Skipped</Text>
            <View style={styles.wordPills}>
              {skippedWords.map((w, i) => (
                <View key={i} style={[styles.pill, styles.pillSkipped]}>
                  <Text style={styles.pillText}>{w.word}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <PrimaryButton
          label={isGameOver ? 'See Final Results 🏆' : `Next: ${nextTeam.name}'s Turn →`}
          onPress={handleNext}
          color="#FFF"
          textColor="#1A1A1A"
          style={styles.nextBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },
  heroSection: { alignItems: 'center', marginBottom: 20 },
  teamName: { fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 4, opacity: 0.9 },
  scoreValue: { fontSize: 88, fontWeight: '900', color: '#FFF', lineHeight: 96 },
  scoreLabel: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 20 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statBox: { flex: 1, paddingVertical: 18, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  statNum: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  statLbl: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2, fontWeight: '600', letterSpacing: 0.3 },
  section: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  scoreRowHighlight: { backgroundColor: 'rgba(255,255,255,0.12)' },
  scorePos: { fontSize: 13, color: 'rgba(255,255,255,0.5)', width: 24, fontWeight: '700' },
  scoreColorDot: { width: 10, height: 10, borderRadius: 5 },
  scoreTeamName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#FFF' },
  scorePoints: { fontSize: 17, fontWeight: '900', color: COLORS.accent },
  wordPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  pillCorrect: { backgroundColor: 'rgba(39,174,96,0.45)' },
  pillSkipped: { backgroundColor: 'rgba(231,76,60,0.35)' },
  pillText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  nextBtn: { marginTop: 8 },
});

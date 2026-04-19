import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '../components/PrimaryButton';
import type { RootStackParamList } from '../types';
import { rankTeams } from '../utils/game';
import { COLORS, shared } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FinalScore'>;

const MEDALS = ['🥇', '🥈', '🥉'];

export default function FinalScoreScreen({ navigation, route }: Props) {
  const { settings, scores } = route.params;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, []);

  const ranked = rankTeams(settings.teams, scores);
  const winner = ranked[0];
  const isTie = ranked.length > 1 && scores[ranked[0].id] === scores[ranked[1].id];

  return (
    <SafeAreaView style={shared.screenBg}>
      <ScrollView contentContainerStyle={[shared.scrollPad, styles.scroll]}>
        <Animated.View style={[styles.animated, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.confetti}>🎊 🎉 🎊</Text>
          <Text style={styles.title}>{isTie ? "It's a Tie!" : 'Winner!'}</Text>

          {!isTie && (
            <View style={[styles.winnerCard, { borderColor: winner.color }]}>
              <View style={[styles.winnerColorBar, { backgroundColor: winner.color }]} />
              <Text style={styles.winnerEmoji}>🏆</Text>
              <Text style={styles.winnerName}>{winner.name}</Text>
              <Text style={styles.winnerScore}>{scores[winner.id] ?? 0} points</Text>
            </View>
          )}

          <Text style={[shared.sectionLabel, styles.standingsLabel]}>Final Standings</Text>

          {ranked.map((team, i) => (
            <View key={team.id} style={[styles.rankRow, i === 0 && !isTie && styles.rankRowFirst]}>
              <Text style={styles.medal}>{MEDALS[i] ?? '🏅'}</Text>
              <View style={[styles.teamDot, { backgroundColor: team.color }]} />
              <Text style={styles.rankName}>{team.name}</Text>
              <Text style={styles.rankScore}>{scores[team.id] ?? 0} pts</Text>
            </View>
          ))}
        </Animated.View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Play Again 🎭"
            onPress={() => navigation.navigate('Setup')}
          />
          <PrimaryButton
            label="Home"
            onPress={() => navigation.navigate('Home')}
            color={COLORS.surface}
            textColor={COLORS.textSub}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { alignItems: 'center' },
  animated: { width: '100%', alignItems: 'center' },
  confetti: { fontSize: 36, textAlign: 'center', marginBottom: 6 },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -1,
  },
  winnerCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    padding: 32,
    marginBottom: 28,
    overflow: 'hidden',
  },
  winnerColorBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 5 },
  winnerEmoji: { fontSize: 52, marginBottom: 10 },
  winnerName: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 4 },
  winnerScore: { fontSize: 19, color: COLORS.accent, fontWeight: '700' },
  standingsLabel: { alignSelf: 'flex-start', marginBottom: 10 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    width: '100%',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rankRowFirst: {
    backgroundColor: COLORS.surfaceHigh,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  medal: { fontSize: 22 },
  teamDot: { width: 10, height: 10, borderRadius: 5 },
  rankName: { flex: 1, fontSize: 17, fontWeight: '700', color: '#FFF' },
  rankScore: { fontSize: 19, fontWeight: '900', color: COLORS.accent },
  actions: { width: '100%', gap: 12, marginTop: 16 },
});

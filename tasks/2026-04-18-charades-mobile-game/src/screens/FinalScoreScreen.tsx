import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'FinalScore'>;

export default function FinalScoreScreen({ navigation, route }: Props) {
  const { settings, scores } = route.params;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const ranked = [...settings.teams].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  const winner = ranked[0];
  const isTie = ranked.length > 1 && scores[ranked[0].id] === scores[ranked[1].id];

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
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

          <Text style={styles.finalStandings}>Final Standings</Text>
          {ranked.map((team, i) => (
            <View key={team.id} style={[styles.rankRow, i === 0 && !isTie && styles.rankRowFirst]}>
              <Text style={styles.medal}>{medals[i] ?? '🏅'}</Text>
              <View style={[styles.teamDot, { backgroundColor: team.color }]} />
              <Text style={styles.rankName}>{team.name}</Text>
              <Text style={styles.rankScore}>{scores[team.id] ?? 0} pts</Text>
            </View>
          ))}
        </Animated.View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.playAgainBtn}
            onPress={() => navigation.navigate('Setup')}
            activeOpacity={0.85}
          >
            <Text style={styles.playAgainText}>Play Again 🎭</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.85}
          >
            <Text style={styles.homeBtnText}>Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  scroll: { padding: 24, paddingBottom: 40, alignItems: 'center' },
  confetti: { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 44, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 24 },
  winnerCard: {
    width: '100%', borderRadius: 24, borderWidth: 3,
    backgroundColor: '#2C2C54', alignItems: 'center', padding: 32,
    marginBottom: 32, overflow: 'hidden',
  },
  winnerColorBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 6 },
  winnerEmoji: { fontSize: 56, marginBottom: 8 },
  winnerName: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 4 },
  winnerScore: { fontSize: 20, color: '#F1C40F', fontWeight: '700' },
  finalStandings: {
    fontSize: 13, fontWeight: '700', color: '#888', letterSpacing: 1,
    textTransform: 'uppercase', alignSelf: 'flex-start', marginBottom: 12,
  },
  rankRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2C2C54', borderRadius: 16,
    padding: 16, marginBottom: 10, width: '100%', gap: 12,
  },
  rankRowFirst: { backgroundColor: '#3D2B5E' },
  medal: { fontSize: 24 },
  teamDot: { width: 12, height: 12, borderRadius: 6 },
  rankName: { flex: 1, fontSize: 18, fontWeight: '700', color: '#FFF' },
  rankScore: { fontSize: 20, fontWeight: '900', color: '#F1C40F' },
  actionButtons: { width: '100%', gap: 12, marginTop: 12 },
  playAgainBtn: {
    backgroundColor: '#9B59B6', borderRadius: 50, paddingVertical: 18,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  playAgainText: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  homeBtn: {
    backgroundColor: '#2C2C54', borderRadius: 50, paddingVertical: 16, alignItems: 'center',
  },
  homeBtnText: { fontSize: 16, fontWeight: '700', color: '#AAA' },
});

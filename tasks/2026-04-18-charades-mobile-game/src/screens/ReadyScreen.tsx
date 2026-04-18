import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Ready'>;

export default function ReadyScreen({ navigation, route }: Props) {
  const { settings, currentRound, currentTeamIndex, scores } = route.params;
  const team = settings.teams[currentTeamIndex];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: team.color }]}>
      <View style={styles.content}>
        <Text style={styles.roundLabel}>Round {currentRound} of {settings.totalRounds}</Text>
        <View style={styles.card}>
          <Text style={styles.emoji}>🎭</Text>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.instruction}>
            Pass the phone to the actor.{'\n'}Everyone else, get ready to guess!
          </Text>
          <View style={styles.rules}>
            <Text style={styles.ruleItem}>⏱ {settings.turnDurationSeconds} seconds</Text>
            <Text style={styles.ruleItem}>🚫 No talking as the word</Text>
            <Text style={styles.ruleItem}>🚫 No pointing at objects</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.goBtn}
          onPress={() => navigation.navigate('Game', route.params)}
          activeOpacity={0.85}
        >
          <Text style={styles.goBtnText}>I'm Ready — GO!</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  roundLabel: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: 24, letterSpacing: 1 },
  card: {
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 24, padding: 32,
    alignItems: 'center', width: '100%', gap: 12,
  },
  emoji: { fontSize: 56 },
  teamName: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  instruction: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 24 },
  rules: { marginTop: 8, gap: 6, alignSelf: 'stretch' },
  ruleItem: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  goBtn: {
    marginTop: 36, backgroundColor: '#FFF', borderRadius: 50,
    paddingVertical: 20, paddingHorizontal: 48,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  goBtnText: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
});

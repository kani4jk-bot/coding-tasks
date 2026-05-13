import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '../components/PrimaryButton';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Ready'>;

const RULES = [
  `No talking as the word`,
  `No pointing at nearby objects`,
  `No mouthing or spelling it out`,
];

export default function ReadyScreen({ navigation, route }: Props) {
  const { settings, currentRound, currentTeamIndex } = route.params;
  const team = settings.teams[currentTeamIndex];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: team.color }]}>
      <View style={styles.content}>
        <Text style={styles.roundPill}>
          Round {currentRound} / {settings.totalRounds}
        </Text>

        <View style={styles.card}>
          <Text style={styles.emoji}>🎭</Text>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.instruction}>
            Pass the phone to the actor.{'\n'}Everyone else, get ready to guess!
          </Text>

          <View style={styles.divider} />

          <View style={styles.rules}>
            <Text style={styles.rulesLabel}>RULES</Text>
            {RULES.map((rule, i) => (
              <View key={i} style={styles.ruleRow}>
                <Text style={styles.ruleDot}>🚫</Text>
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
            <View style={styles.ruleRow}>
              <Text style={styles.ruleDot}>⏱</Text>
              <Text style={styles.ruleText}>{settings.turnDurationSeconds} seconds per turn</Text>
            </View>
          </View>
        </View>

        <PrimaryButton
          label="I'm Ready — GO!"
          onPress={() => navigation.navigate('Game', route.params)}
          color="#FFF"
          textColor="#1A1A1A"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 20,
  },
  roundPill: {
    alignSelf: 'center',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.75)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 10,
  },
  emoji: { fontSize: 52 },
  teamName: { fontSize: 34, fontWeight: '900', color: '#FFF' },
  instruction: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  rules: { alignSelf: 'stretch', gap: 8 },
  rulesLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  ruleRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  ruleDot: { fontSize: 14 },
  ruleText: { fontSize: 14, color: 'rgba(255,255,255,0.82)', flex: 1 },
});

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '../components/PrimaryButton';
import type { RootStackParamList } from '../types';
import { COLORS } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HOW_TO = [
  'Split into two or more teams',
  'One player sees the word — act it out, no talking!',
  'No mouthing words, no pointing at objects',
  'Most points after all rounds wins 🏆',
];

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🎭</Text>
          <Text style={styles.title}>Charades!</Text>
          <Text style={styles.subtitle}>The classic party game</Text>
        </View>

        <PrimaryButton
          label="Play Now"
          onPress={() => navigation.navigate('Setup')}
          color={COLORS.accent}
          textColor="#1A1A1A"
          style={styles.playBtn}
        />

        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How to Play</Text>
          {HOW_TO.map((rule, i) => (
            <View key={i} style={styles.ruleRow}>
              <Text style={styles.ruleNum}>{i + 1}</Text>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 28,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 4,
  },
  title: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },
  playBtn: {
    marginHorizontal: 16,
  },
  howCard: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 20,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  howTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLORS.accent,
    marginBottom: 2,
  },
  ruleRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  ruleNum: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    width: 18,
    paddingTop: 1,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 20,
  },
});

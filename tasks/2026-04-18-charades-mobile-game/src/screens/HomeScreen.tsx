import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6C3483" />
      <View style={styles.content}>
        <Text style={styles.emoji}>🎭</Text>
        <Text style={styles.title}>Charades!</Text>
        <Text style={styles.subtitle}>The classic party game</Text>

        <TouchableOpacity
          style={styles.playButton}
          onPress={() => navigation.navigate('Setup')}
          activeOpacity={0.85}
        >
          <Text style={styles.playButtonText}>Play Now</Text>
        </TouchableOpacity>

        <View style={styles.howToPlay}>
          <Text style={styles.howTitle}>How to Play</Text>
          <Text style={styles.howText}>1. Split into teams</Text>
          <Text style={styles.howText}>2. One player sees the word — act it out!</Text>
          <Text style={styles.howText}>3. No talking, no pointing at objects</Text>
          <Text style={styles.howText}>4. Team with the most points wins 🏆</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6C3483',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 12,
  },
  title: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#D7BDE2',
    marginBottom: 48,
  },
  playButton: {
    backgroundColor: '#F1C40F',
    paddingVertical: 18,
    paddingHorizontal: 64,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: 48,
  },
  playButtonText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  howToPlay: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 6,
  },
  howTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1C40F',
    marginBottom: 6,
  },
  howText: {
    fontSize: 14,
    color: '#E8DAEF',
    lineHeight: 22,
  },
});

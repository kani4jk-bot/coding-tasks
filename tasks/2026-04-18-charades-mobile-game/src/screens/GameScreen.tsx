import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Animated, Vibration, Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TurnResult } from '../types';
import { getShuffledWords } from '../data/words';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;
type WordResult = { word: string; result: 'correct' | 'skipped' | 'unanswered' };

export default function GameScreen({ navigation, route }: Props) {
  const { settings, currentRound, currentTeamIndex, scores } = route.params;
  const team = settings.teams[currentTeamIndex];

  const [words] = useState(() => getShuffledWords(settings.selectedCategoryIds, 50));
  const [wordIndex, setWordIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.turnDurationSeconds);
  const [results, setResults] = useState<WordResult[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const flashAnim = useRef(new Animated.Value(0)).current;
  const wordScaleAnim = useRef(new Animated.Value(1)).current;
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const endTurn = useCallback((finalResults: WordResult[], finalCorrect: number, finalSkipped: number, remainingWord: string) => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    setGameOver(true);

    const turnResult: TurnResult = {
      teamId: team.id,
      correct: finalCorrect,
      skipped: finalSkipped,
      words: [...finalResults, { word: remainingWord, result: 'unanswered' }],
    };

    const newScores = { ...scores, [team.id]: (scores[team.id] ?? 0) + finalCorrect };

    setTimeout(() => {
      navigation.replace('TurnResult', {
        result: turnResult,
        settings,
        currentRound,
        currentTeamIndex,
        scores: newScores,
      });
    }, 400);
  }, [navigation, settings, currentRound, currentTeamIndex, scores, team.id]);

  useEffect(() => {
    timerInterval.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // endTurn will be called via the gameOver state change below
          return 0;
        }
        if (t <= 6) Vibration.vibrate(60);
        return t - 1;
      });
    }, 1000);
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, []);

  // Separate effect to handle timer reaching 0
  useEffect(() => {
    if (timeLeft === 0 && !gameOver) {
      Vibration.vibrate([0, 100, 100, 100]);
      endTurn(results, correctCount, skippedCount, words[wordIndex] ?? '');
    }
  }, [timeLeft, gameOver, results, correctCount, skippedCount, words, wordIndex, endTurn]);

  function animateWordChange(color: string) {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    Animated.sequence([
      Animated.timing(wordScaleAnim, { toValue: 1.1, duration: 80, useNativeDriver: true }),
      Animated.timing(wordScaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }

  function handleCorrect() {
    if (gameOver) return;
    const word = words[wordIndex];
    if (!word) return;
    Vibration.vibrate(Platform.OS === 'android' ? 50 : 30);
    animateWordChange('#27AE60');
    const newResults = [...results, { word, result: 'correct' as const }];
    const newCorrect = correctCount + 1;
    setResults(newResults);
    setCorrectCount(newCorrect);
    if (wordIndex + 1 >= words.length) {
      endTurn(newResults, newCorrect, skippedCount, '');
    } else {
      setWordIndex(i => i + 1);
    }
  }

  function handleSkip() {
    if (gameOver) return;
    const word = words[wordIndex];
    if (!word) return;
    animateWordChange('#E74C3C');
    const newResults = [...results, { word, result: 'skipped' as const }];
    const newSkipped = skippedCount + 1;
    setResults(newResults);
    setSkippedCount(newSkipped);
    if (wordIndex + 1 >= words.length) {
      endTurn(newResults, correctCount, newSkipped, '');
    } else {
      setWordIndex(i => i + 1);
    }
  }

  const timerPercent = timeLeft / settings.turnDurationSeconds;
  const timerColor = timeLeft > 15 ? '#27AE60' : timeLeft > 6 ? '#F39C12' : '#E74C3C';
  const currentWord = words[wordIndex] ?? '—';

  const flashBgColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', 'rgba(255,255,255,0.15)'],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: team.color }]}>
      <View style={styles.header}>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreLabel}>✓ {correctCount}</Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreLabel}>⤭ {skippedCount}</Text>
        </View>
      </View>

      {/* Timer bar */}
      <View style={styles.timerBarBg}>
        <View style={[styles.timerBarFill, { width: `${timerPercent * 100}%`, backgroundColor: timerColor }]} />
      </View>

      <Animated.View style={[styles.wordContainer, { backgroundColor: flashBgColor }]}>
        <Animated.Text style={[styles.wordText, { transform: [{ scale: wordScaleAnim }] }]}>
          {currentWord}
        </Animated.Text>
        <Text style={styles.actItOut}>Act it out!</Text>
      </Animated.View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.8} disabled={gameOver}>
          <Text style={styles.skipBtnIcon}>⤭</Text>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.correctBtn} onPress={handleCorrect} activeOpacity={0.8} disabled={gameOver}>
          <Text style={styles.correctBtnIcon}>✓</Text>
          <Text style={styles.correctBtnText}>Got it!</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8,
  },
  scoreBadge: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  scoreLabel: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  timerContainer: { alignItems: 'center' },
  timerText: { fontSize: 48, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerBarBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.2)', marginHorizontal: 24, borderRadius: 3 },
  timerBarFill: { height: 6, borderRadius: 3 },
  wordContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, borderRadius: 24, margin: 16,
  },
  wordText: {
    fontSize: 44, fontWeight: '900', color: '#FFF',
    textAlign: 'center', lineHeight: 52,
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  actItOut: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 12, fontStyle: 'italic' },
  buttons: { flexDirection: 'row', gap: 16, padding: 24, paddingBottom: 32 },
  skipBtn: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20,
    paddingVertical: 22, alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  skipBtnIcon: { fontSize: 28, color: '#FFF' },
  skipBtnText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  correctBtn: {
    flex: 2, backgroundColor: '#FFF', borderRadius: 20,
    paddingVertical: 22, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
  },
  correctBtnIcon: { fontSize: 36, color: '#27AE60', fontWeight: '900' },
  correctBtnText: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', marginTop: 2 },
});

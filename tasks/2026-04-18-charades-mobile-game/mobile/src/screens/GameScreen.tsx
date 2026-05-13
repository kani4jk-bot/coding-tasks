import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Animated, Vibration, Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TurnResult } from '../types';
import { getShuffledWords } from '../data/words';
import { COLORS } from '../styles/theme';

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

  const wordScaleAnim = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const [flashColor, setFlashColor] = useState('rgba(255,255,255,0.2)');
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
          // Clear immediately to stop firing after zero
          if (timerInterval.current) clearInterval(timerInterval.current);
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
    setFlashColor(color);
    flashOpacity.setValue(0.9);
    Animated.timing(flashOpacity, { toValue: 0, duration: 350, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.timing(wordScaleAnim, { toValue: 1.08, duration: 70, useNativeDriver: true }),
      Animated.timing(wordScaleAnim, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
  }

  function handleCorrect() {
    if (gameOver) return;
    const word = words[wordIndex];
    if (!word) return;
    Vibration.vibrate(Platform.OS === 'android' ? 50 : 30);
    animateWordChange('rgba(39,174,96,0.45)');
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
    animateWordChange('rgba(231,76,60,0.35)');
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
  const timerColor = timeLeft > 15 ? COLORS.success : timeLeft > 6 ? COLORS.warning : COLORS.danger;
  const currentWord = words[wordIndex] ?? '—';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: team.color }]}>
      <View style={styles.header}>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreIcon}>✓</Text>
          <Text style={styles.scoreNum}>{correctCount}</Text>
        </View>
        <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreIcon}>↷</Text>
          <Text style={styles.scoreNum}>{skippedCount}</Text>
        </View>
      </View>

      <View style={styles.timerBarBg}>
        <View style={[styles.timerBarFill, { width: `${timerPercent * 100}%`, backgroundColor: timerColor }]} />
      </View>

      <View style={styles.wordContainer}>
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.flashOverlay, { backgroundColor: flashColor, opacity: flashOpacity }]}
          pointerEvents="none"
        />
        <Animated.Text style={[styles.wordText, { transform: [{ scale: wordScaleAnim }] }]}>
          {currentWord}
        </Animated.Text>
        <Text style={styles.actItOut}>Act it out!</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.8} disabled={gameOver}>
          <Text style={styles.skipBtnIcon}>↷</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 10,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  scoreIcon: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  scoreNum: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  timerText: { fontSize: 52, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerBarBg: {
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.18)',
    marginHorizontal: 24,
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerBarFill: { height: 5, borderRadius: 3 },
  wordContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    margin: 16,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.18)',
    overflow: 'hidden',
  },
  flashOverlay: { borderRadius: 28 },
  wordText: {
    fontSize: 46,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 54,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  actItOut: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 14,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  buttons: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 28 },
  skipBtn: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 22,
    paddingVertical: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 2,
  },
  skipBtnIcon: { fontSize: 22, color: 'rgba(255,255,255,0.85)' },
  skipBtnText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3 },
  correctBtn: {
    flex: 2,
    backgroundColor: '#FFF',
    borderRadius: 22,
    paddingVertical: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    gap: 2,
  },
  correctBtnIcon: { fontSize: 30, color: COLORS.success, fontWeight: '900' },
  correctBtnText: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
});

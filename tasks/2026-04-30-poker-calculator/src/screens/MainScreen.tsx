import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, TextInput, Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Card, Player } from '../types';
import { CardSlot } from '../components/CardSlot';
import { CardPickerModal } from '../components/CardPickerModal';
import {
  evaluateBestHand, calculateBoardProbability, calculateWinOdds,
  calculateOuts, calculatePotOdds, suitColor,
} from '../utils/pokerEngine';
import { recognizeCardsFromImage } from '../utils/claudeVision';
import { getApiKey } from '../utils/storage';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

let playerCounter = 3;
function makePlayer(n: number): Player {
  return { id: `p${n}`, name: `Player ${n}`, cards: [null, null] };
}

type PickerTarget =
  | { type: 'board'; index: number }
  | { type: 'player'; playerId: string; cardIndex: 0 | 1 };

export function MainScreen({ navigation }: Props) {
  const [board, setBoard] = useState<(Card | null)[]>([null, null, null, null, null]);
  const [players, setPlayers] = useState<Player[]>([makePlayer(1), makePlayer(2)]);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof computeResults> | null>(null);
  const [potSize, setPotSize] = useState('');
  const [callAmount, setCallAmount] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const usedCards = useMemo<Set<Card>>(() => {
    const s = new Set<Card>();
    board.forEach(c => c && s.add(c));
    players.forEach(p => p.cards.forEach(c => c && s.add(c)));
    return s;
  }, [board, players]);

  const currentPickerCard = useMemo<Card | null>(() => {
    if (!pickerTarget) return null;
    if (pickerTarget.type === 'board') return board[pickerTarget.index];
    const p = players.find(p => p.id === pickerTarget.playerId);
    return p ? p.cards[pickerTarget.cardIndex] : null;
  }, [pickerTarget, board, players]);

  function openPicker(target: PickerTarget) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickerTarget(target);
  }

  function handleCardSelect(card: Card) {
    if (!pickerTarget) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (pickerTarget.type === 'board') {
      setBoard(prev => { const next = [...prev]; next[pickerTarget.index] = card; return next; });
    } else {
      setPlayers(prev => prev.map(p => {
        if (p.id !== pickerTarget.playerId) return p;
        const cards: [Card | null, Card | null] = [...p.cards];
        cards[pickerTarget.cardIndex] = card;
        return { ...p, cards };
      }));
    }
    setPickerTarget(null);
    setResults(null);
  }

  function handleCardClear() {
    if (!pickerTarget) return;
    if (pickerTarget.type === 'board') {
      setBoard(prev => { const next = [...prev]; next[pickerTarget.index] = null; return next; });
    } else {
      setPlayers(prev => prev.map(p => {
        if (p.id !== pickerTarget.playerId) return p;
        const cards: [Card | null, Card | null] = [...p.cards];
        cards[pickerTarget.cardIndex] = null;
        return { ...p, cards };
      }));
    }
    setPickerTarget(null);
    setResults(null);
  }

  function addPlayer() {
    if (players.length >= 9) { Alert.alert('Max 9 players'); return; }
    setPlayers(prev => [...prev, makePlayer(playerCounter++)]);
    setResults(null);
  }

  function removePlayer(id: string) {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setResults(null);
  }

  function clearAll() {
    Alert.alert('Clear Everything?', 'Remove all cards and results?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => {
        setBoard([null, null, null, null, null]);
        setPlayers([makePlayer(1), makePlayer(2)]);
        setResults(null);
        playerCounter = 3;
      }},
    ]);
  }

  async function handleScan() {
    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert('API Key Required', 'Add your Anthropic API key in Settings to use card scanning.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Settings', onPress: () => navigation.navigate('Settings') },
      ]);
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      const { status: libStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (libStatus !== 'granted') { Alert.alert('Permission needed', 'Camera or photo library access is required.'); return; }
    }
    Alert.alert('Scan Board', 'Choose source:', [
      { text: 'Take Photo', onPress: async () => {
        const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 });
        if (!result.canceled && result.assets[0].base64) await processImage(result.assets[0].base64, apiKey);
      }},
      { text: 'Photo Library', onPress: async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8 });
        if (!result.canceled && result.assets[0].base64) await processImage(result.assets[0].base64, apiKey);
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function processImage(base64: string, apiKey: string) {
    setScanning(true);
    try {
      const { cards, error } = await recognizeCardsFromImage(base64, apiKey);
      if (error) { Alert.alert('Scan Error', error); return; }
      if (cards.length === 0) { Alert.alert('No cards found', 'Try a clearer photo with better lighting.'); return; }
      const newBoard = [...board];
      for (const card of cards.slice(0, 5)) {
        const emptyIdx = newBoard.findIndex(c => !c);
        if (emptyIdx !== -1) newBoard[emptyIdx] = card;
      }
      setBoard(newBoard);
      setResults(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Cards Detected!', `Found ${cards.length} card${cards.length > 1 ? 's' : ''}: ${cards.join(', ')}`);
    } finally {
      setScanning(false);
    }
  }

  function computeResults() {
    const boardCards = board.filter(Boolean) as Card[];
    const playerHands = players.map(p => p.cards);
    const knownHoles = players.map(p => p.cards.filter(Boolean) as Card[]).filter(h => h.length > 0);
    const boardProb = calculateBoardProbability(boardCards, knownHoles);
    const winOdds = calculateWinOdds(boardCards, playerHands);
    const playerResults = players.map((p, i) => ({
      player: p,
      hand: evaluateBestHand(p.cards, boardCards),
      odds: winOdds[i],
    })).sort((a, b) => b.hand.score - a.hand.score);
    const outs = calculateOuts(players[0].cards, boardCards);
    return { boardProb, playerResults, outs, boardCards };
  }

  function handleCalculate() {
    const boardCards = board.filter(Boolean);
    if (boardCards.length < 3) { Alert.alert('Need More Cards', 'Add at least the flop (3 board cards) to calculate odds.'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const r = computeResults();
    setResults(r);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }

  const potOdds = useMemo(() => {
    const pot = parseFloat(potSize);
    const call = parseFloat(callAmount);
    if (isNaN(pot) || isNaN(call)) return null;
    return calculatePotOdds(pot, call);
  }, [potSize, callAmount]);

  const boardLabel = useMemo(() => {
    const n = board.filter(Boolean).length;
    if (n === 0) return 'Pre-flop';
    if (n <= 3) return 'Flop';
    if (n === 4) return 'Turn';
    return 'River';
  }, [board]);

  const handColors: Record<string, string> = {
    'Royal Flush': '#f0c85a', 'Straight Flush': '#f0c85a',
    'Four of a Kind': '#e8a030', 'Full House': '#e8a030',
    'Flush': '#7ec8e3', 'Straight': '#7ec8e3',
    'Three of a Kind': '#98d890', 'Two Pair': '#98d890',
    'Pair': '#c0c0b8', 'High Card': '#7a8a80', '—': '#4a5550',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>♠ POKER ODDS</Text>
          <Text style={styles.headerSub}>{boardLabel}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={clearAll} style={styles.headerBtn}><Text style={styles.headerBtnTxt}>↺</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerBtn}><Text style={styles.headerBtnTxt}>⚙</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>COMMUNITY CARDS</Text>
            <TouchableOpacity onPress={handleScan} style={styles.scanBtn} disabled={scanning}>
              {scanning ? <ActivityIndicator size="small" color={theme.colors.gold} /> : <Text style={styles.scanTxt}>📷 Scan</Text>}
            </TouchableOpacity>
          </View>
          <View style={styles.boardRow}>
            <View style={styles.flopGroup}>
              {[0, 1, 2].map(i => <CardSlot key={i} card={board[i]} size="lg" onPress={() => openPicker({ type: 'board', index: i })} />)}
            </View>
            <View style={styles.divider} />
            <CardSlot card={board[3]} size="lg" onPress={() => openPicker({ type: 'board', index: 3 })} />
            <View style={styles.divider} />
            <CardSlot card={board[4]} size="lg" onPress={() => openPicker({ type: 'board', index: 4 })} />
          </View>
          <View style={styles.streetLabels}>
            <Text style={styles.streetLabel}>FLOP</Text>
            <Text style={styles.streetLabel}>TURN</Text>
            <Text style={styles.streetLabel}>RIVER</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>PLAYERS ({players.length})</Text>
            <TouchableOpacity onPress={addPlayer} style={styles.addBtn}><Text style={styles.addBtnTxt}>+ Add Player</Text></TouchableOpacity>
          </View>
          {players.map((player, idx) => (
            <View key={player.id} style={styles.playerRow}>
              <Text style={styles.playerLabel}>P{idx + 1}</Text>
              <View style={styles.playerCards}>
                <CardSlot card={player.cards[0]} size="md" onPress={() => openPicker({ type: 'player', playerId: player.id, cardIndex: 0 })} />
                <CardSlot card={player.cards[1]} size="md" onPress={() => openPicker({ type: 'player', playerId: player.id, cardIndex: 1 })} />
              </View>
              {results && (() => {
                const pr = results.playerResults.find(r => r.player.id === player.id);
                return pr ? (
                  <View style={styles.inlineResult}>
                    <Text style={[styles.inlineHand, { color: handColors[pr.hand.name] ?? '#ccc' }]}>{pr.hand.name}</Text>
                    {(pr.odds.winPct > 0 || pr.odds.tiePct > 0) ? <Text style={styles.inlineWin}>{pr.odds.winPct.toFixed(0)}%</Text> : null}
                  </View>
                ) : null;
              })()}
              {players.length > 2 && <TouchableOpacity onPress={() => removePlayer(player.id)} style={styles.removeBtn}><Text style={styles.removeTxt}>✕</Text></TouchableOpacity>}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate} activeOpacity={0.85}>
          <Text style={styles.calcBtnTxt}>CALCULATE ODDS</Text>
        </TouchableOpacity>

        {results && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={styles.sectionLabel}>RESULTS</Text>
            <View style={styles.probCard}>
              <Text style={styles.probLabel}>BOARD PROBABILITY</Text>
              <Text style={styles.probMain}>{results.boardProb.oddsString}</Text>
              <Text style={styles.probSub}>Chance of getting exactly this {results.boardProb.label.toLowerCase()}</Text>
              <TouchableOpacity onPress={() => setShowBreakdown(!showBreakdown)} style={styles.breakdownBtn}>
                <Text style={styles.breakdownBtnTxt}>{showBreakdown ? '▲ Hide' : '▼ Street Breakdown'}</Text>
              </TouchableOpacity>
              {showBreakdown && results.boardProb.streetBreakdown.map((s, i) => (
                <View key={i} style={styles.breakdownRow}>
                  <Text style={styles.breakdownStreet}>{s.street}</Text>
                  <Text style={styles.breakdownOdds}>{s.oddsString}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.sectionLabel, { marginTop: theme.spacing.md }]}>HAND RANKINGS</Text>
            {results.playerResults.map((pr, rank) => (
              <View key={pr.player.id} style={[styles.handRow, rank === 0 && styles.handRowWinner]}>
                <Text style={[styles.handRank, rank === 0 && { color: theme.colors.gold }]}>#{rank + 1}</Text>
                <View style={styles.handInfo}>
                  <Text style={styles.handPlayerName}>{pr.player.name}</Text>
                  <Text style={[styles.handName, { color: handColors[pr.hand.name] ?? '#ccc' }]}>{pr.hand.name}</Text>
                  <Text style={styles.handDesc}>{pr.hand.description}</Text>
                </View>
                <View style={styles.winBlock}>
                  {(pr.odds.winPct > 0 || pr.odds.tiePct > 0) ? (
                    <>
                      <Text style={[styles.winPct, rank === 0 && { color: theme.colors.success }]}>{pr.odds.winPct.toFixed(1)}%</Text>
                      <Text style={styles.winLabel}>win</Text>
                      {pr.odds.tiePct > 0.5 && <Text style={styles.tiePct}>{pr.odds.tiePct.toFixed(1)}% tie</Text>}
                    </>
                  ) : <Text style={styles.incompleteHand}>incomplete</Text>}
                </View>
              </View>
            ))}
            {results.playerResults.some(pr => pr.odds.winPct > 0) && (
              <View style={styles.barContainer}>
                {results.playerResults.map((pr, i) => (
                  <View key={pr.player.id} style={[styles.barSegment, { flex: Math.max(pr.odds.winPct + pr.odds.tiePct, 0.5), backgroundColor: i === 0 ? theme.colors.success : i === 1 ? '#3a80aa' : i === 2 ? '#aa6030' : `hsl(${(i * 60) % 360}, 50%, 40%)` }]}>
                    <Text style={styles.barLabel} numberOfLines={1}>P{i + 1}</Text>
                  </View>
                ))}
              </View>
            )}
            {results.outs && (
              <View style={styles.outsCard}>
                <Text style={styles.outsTitle}>OUTS — Player 1</Text>
                <View style={styles.outsRow}>
                  <View style={styles.outsStat}><Text style={styles.outsNum}>{results.outs.count}</Text><Text style={styles.outsLabel}>outs</Text></View>
                  <View style={styles.outsStat}><Text style={styles.outsNum}>{results.outs.turnOdds}</Text><Text style={styles.outsLabel}>next card</Text></View>
                  <View style={styles.outsStat}><Text style={styles.outsNum}>{results.outs.riverOdds}</Text><Text style={styles.outsLabel}>by river</Text></View>
                </View>
                {results.outs.improvedHands.length > 0 && <Text style={styles.outsImproves}>Improves to: {results.outs.improvedHands.join(' · ')}</Text>}
              </View>
            )}
          </Animated.View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>POT ODDS CALCULATOR</Text>
          <View style={styles.potRow}>
            <View style={styles.potInput}>
              <Text style={styles.potInputLabel}>Pot Size</Text>
              <TextInput style={styles.potField} value={potSize} onChangeText={setPotSize} placeholder="0" placeholderTextColor={theme.colors.textDim} keyboardType="numeric" />
            </View>
            <View style={styles.potInput}>
              <Text style={styles.potInputLabel}>Call Amount</Text>
              <TextInput style={styles.potField} value={callAmount} onChangeText={setCallAmount} placeholder="0" placeholderTextColor={theme.colors.textDim} keyboardType="numeric" />
            </View>
          </View>
          {potOdds && (
            <View style={styles.potResult}>
              <View style={styles.potStat}><Text style={styles.potStatNum}>{potOdds.ratioString}</Text><Text style={styles.potStatLabel}>pot odds</Text></View>
              <View style={styles.potDivider} />
              <View style={styles.potStat}><Text style={styles.potStatNum}>{potOdds.percentage.toFixed(1)}%</Text><Text style={styles.potStatLabel}>equity needed</Text></View>
            </View>
          )}
          {potOdds && results && (() => {
            const p1result = results.playerResults.find(r => r.player.id === players[0].id);
            if (!p1result || p1result.odds.winPct === 0) return null;
            const equity = p1result.odds.winPct;
            const isGoodCall = equity >= potOdds.percentage;
            return (
              <View style={[styles.callAdvice, isGoodCall ? styles.callGood : styles.callBad]}>
                <Text style={styles.callAdviceTxt}>
                  {isGoodCall ? `✓ Good call — P1 has ${equity.toFixed(1)}% equity vs ${potOdds.percentage.toFixed(1)}% needed` : `✗ Fold — P1 needs ${potOdds.percentage.toFixed(1)}% equity but only has ${equity.toFixed(1)}%`}
                </Text>
              </View>
            );
          })()}
        </View>
        <View style={styles.bottomPad} />
      </ScrollView>

      <CardPickerModal
        visible={pickerTarget !== null}
        onSelect={handleCardSelect}
        onClear={handleCardClear}
        onClose={() => setPickerTarget(null)}
        usedCards={usedCards}
        currentCard={currentPickerCard}
        title={
          pickerTarget?.type === 'board' ? `Board Card ${pickerTarget.index + 1}` :
          pickerTarget ? `${players.find(p => p.id === pickerTarget.playerId)?.name ?? 'Player'} — Card ${pickerTarget.cardIndex + 1}` : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerTitle: { color: theme.colors.gold, fontSize: 20, fontWeight: '800', letterSpacing: 3 },
  headerSub: { color: theme.colors.textDim, fontSize: 11, letterSpacing: 2, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: theme.spacing.sm },
  headerBtn: { width: 36, height: 36, backgroundColor: theme.colors.surface, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  headerBtnTxt: { color: theme.colors.textMuted, fontSize: 18 },
  scroll: { padding: theme.spacing.md, gap: theme.spacing.md },
  section: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { color: theme.colors.gold, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: 12, paddingVertical: 6, minWidth: 80, justifyContent: 'center' },
  scanTxt: { color: theme.colors.gold, fontSize: 13, fontWeight: '600' },
  boardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: theme.spacing.sm },
  flopGroup: { flexDirection: 'row', gap: 4 },
  divider: { width: 1, height: 50, backgroundColor: theme.colors.border, marginHorizontal: 4 },
  streetLabels: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: theme.spacing.sm },
  streetLabel: { color: theme.colors.textDim, fontSize: 9, letterSpacing: 2, fontWeight: '700' },
  addBtn: { backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.borderLight, borderRadius: theme.radius.sm, paddingHorizontal: 12, paddingVertical: 5 },
  addBtnTxt: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: 4 },
  playerLabel: { color: theme.colors.textDim, fontSize: 12, fontWeight: '700', width: 20, letterSpacing: 0.5 },
  playerCards: { flexDirection: 'row', gap: 4 },
  inlineResult: { flex: 1, paddingLeft: 4 },
  inlineHand: { fontSize: 12, fontWeight: '700' },
  inlineWin: { color: theme.colors.success, fontSize: 14, fontWeight: '800' },
  removeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  removeTxt: { color: theme.colors.textDim, fontSize: 14 },
  calcBtn: { backgroundColor: theme.colors.gold, borderRadius: theme.radius.lg, paddingVertical: 18, alignItems: 'center', shadowColor: theme.colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  calcBtnTxt: { color: theme.colors.black, fontSize: 16, fontWeight: '800', letterSpacing: 3 },
  probCard: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, gap: 4 },
  probLabel: { color: theme.colors.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  probMain: { color: theme.colors.gold, fontSize: 26, fontWeight: '800', letterSpacing: 1 },
  probSub: { color: theme.colors.textMuted, fontSize: 12 },
  breakdownBtn: { paddingTop: 4 },
  breakdownBtnTxt: { color: theme.colors.textDim, fontSize: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4, borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 4 },
  breakdownStreet: { color: theme.colors.textMuted, fontSize: 12 },
  breakdownOdds: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
  handRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, padding: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
  handRowWinner: { borderColor: theme.colors.goldDark, backgroundColor: '#141f16' },
  handRank: { color: theme.colors.textDim, fontSize: 14, fontWeight: '700', width: 24, textAlign: 'center' },
  handInfo: { flex: 1 },
  handPlayerName: { color: theme.colors.textMuted, fontSize: 11, letterSpacing: 1 },
  handName: { fontSize: 15, fontWeight: '700', marginTop: 1 },
  handDesc: { color: theme.colors.textDim, fontSize: 11, marginTop: 1 },
  winBlock: { alignItems: 'flex-end' },
  winPct: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  winLabel: { color: theme.colors.textDim, fontSize: 10, letterSpacing: 1 },
  tiePct: { color: theme.colors.warning, fontSize: 11, marginTop: 2 },
  incompleteHand: { color: theme.colors.textDim, fontSize: 11 },
  barContainer: { flexDirection: 'row', height: 32, borderRadius: theme.radius.sm, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border, marginTop: theme.spacing.sm },
  barSegment: { justifyContent: 'center', alignItems: 'center' },
  barLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700' },
  outsCard: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing.sm },
  outsTitle: { color: theme.colors.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  outsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  outsStat: { alignItems: 'center' },
  outsNum: { color: theme.colors.text, fontSize: 22, fontWeight: '800' },
  outsLabel: { color: theme.colors.textDim, fontSize: 10, letterSpacing: 1 },
  outsImproves: { color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
  potRow: { flexDirection: 'row', gap: theme.spacing.sm },
  potInput: { flex: 1, gap: 4 },
  potInputLabel: { color: theme.colors.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  potField: { backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing.md, color: theme.colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  potResult: { flexDirection: 'row', backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  potStat: { flex: 1, padding: theme.spacing.md, alignItems: 'center' },
  potStatNum: { color: theme.colors.gold, fontSize: 22, fontWeight: '800' },
  potStatLabel: { color: theme.colors.textDim, fontSize: 10, letterSpacing: 1, marginTop: 2 },
  potDivider: { width: 1, backgroundColor: theme.colors.border },
  callAdvice: { borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: 1 },
  callGood: { backgroundColor: 'rgba(58,170,96,0.15)', borderColor: theme.colors.success },
  callBad: { backgroundColor: 'rgba(204,68,68,0.15)', borderColor: theme.colors.danger },
  callAdviceTxt: { color: theme.colors.text, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  bottomPad: { height: 40 },
});
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { getApiKey, saveApiKey, clearApiKey } from '../utils/storage';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    getApiKey().then(k => {
      if (k) { setHasKey(true); setApiKey(k); }
    });
  }, []);

  async function handleSave() {
    if (!apiKey.trim()) { Alert.alert('Error', 'Please enter your API key.'); return; }
    await saveApiKey(apiKey.trim());
    setHasKey(true);
    setSaved(true);
    setTimeout(() => { setSaved(false); navigation.goBack(); }, 800);
  }

  async function handleClear() {
    Alert.alert('Remove API Key', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await clearApiKey(); setApiKey(''); setHasKey(false); } },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ANTHROPIC API KEY</Text>
          <Text style={styles.description}>
            Required for AI card scanning. Your key is stored securely on device and only sent to Anthropic's API.
          </Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="sk-ant-api03-..."
            placeholderTextColor={theme.colors.textDim}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={[styles.btn, saved && styles.btnSuccess]} onPress={handleSave}>
            <Text style={styles.btnTxt}>{saved ? '✓ Saved!' : 'Save Key'}</Text>
          </TouchableOpacity>
          {hasKey && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearTxt}>Remove Saved Key</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HOW TO GET AN API KEY</Text>
          <Text style={styles.description}>
            1. Go to console.anthropic.com{'\n'}
            2. Sign in or create an account{'\n'}
            3. Navigate to API Keys{'\n'}
            4. Create a new key and paste it above{'\n\n'}
            The card scanning feature uses Claude's vision model to identify playing cards from your photos. Without a key, you can still use manual card entry.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CARD SCANNING TIPS</Text>
          <Text style={styles.description}>
            • Lay cards flat on a solid contrasting surface{'\n'}
            • Ensure good lighting — avoid glare{'\n'}
            • Keep all cards fully visible in frame{'\n'}
            • Spread cards so ranks and suits are visible{'\n'}
            • Works best with standard poker-size cards
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.xl },
  section: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing.md },
  sectionTitle: { color: theme.colors.gold, fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  description: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 22 },
  input: { backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing.md, color: theme.colors.text, fontSize: 14, fontFamily: 'monospace' },
  btn: { backgroundColor: theme.colors.gold, borderRadius: theme.radius.md, padding: theme.spacing.md, alignItems: 'center' },
  btnSuccess: { backgroundColor: theme.colors.success },
  btnTxt: { color: theme.colors.black, fontSize: 15, fontWeight: '700' },
  clearBtn: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing.md, alignItems: 'center' },
  clearTxt: { color: theme.colors.textMuted, fontSize: 14 },
});
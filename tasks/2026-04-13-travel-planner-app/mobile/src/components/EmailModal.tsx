import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { parseEmail } from '../api';
import { Trip } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (trip: Trip) => void;
}

export default function EmailModal({ visible, onClose, onSuccess }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePaste() {
    const content = await Clipboard.getStringAsync();
    if (content) setText(content);
  }

  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await parseEmail(text.trim());
      if (!result.trip) {
        setError('No travel segments found in this email. Try a different confirmation email.');
        return;
      }
      setText('');
      onSuccess(result.trip);
      onClose();
    } catch (e) {
      setError('Failed to parse email. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setText('');
    setError('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.container}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Add from Email</Text>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            Paste a booking confirmation email (flight, hotel, Airbnb, car rental, etc.) and Claude will extract the details.
          </Text>

          <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste} disabled={loading}>
            <Text style={styles.pasteBtnText}>📋  Paste from Clipboard</Text>
          </TouchableOpacity>

          <ScrollView style={styles.inputWrapper} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.input}
              multiline
              placeholder="Or type / paste email text here…"
              placeholderTextColor="#9ca3af"
              value={text}
              onChangeText={setText}
              editable={!loading}
              textAlignVertical="top"
            />
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, (!text.trim() || loading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!text.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Parse Email</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    fontSize: 18,
    color: '#6b7280',
    padding: 4,
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 18,
  },
  pasteBtn: {
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  pasteBtnText: {
    color: '#7c3aed',
    fontWeight: '600',
    fontSize: 14,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  input: {
    padding: 12,
    fontSize: 13,
    color: '#374151',
    minHeight: 180,
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

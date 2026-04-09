import { useCallback, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native'

import { PrimaryButton } from '../components/PrimaryButton'
import { SectionCard } from '../components/SectionCard'
import { getApiBase, setApiBase } from '../lib/api'

export function SettingsScreen() {
  const [apiBase, setApiBaseState] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getApiBase().then(setApiBaseState).catch(() => undefined)
  }, [])

  const handleSave = useCallback(async () => {
    setError(null)
    setSaved(false)
    const trimmed = apiBase.trim()
    if (!trimmed.startsWith('http')) {
      setError('URL must start with http:// or https://')
      return
    }
    try {
      await setApiBase(trimmed)
      setSaved(true)
    } catch {
      setError('Could not save the URL.')
    }
  }, [apiBase])

  const handleReset = useCallback(async () => {
    await setApiBase('http://localhost:8000')
    setApiBaseState('http://localhost:8000')
    setSaved(true)
    setError(null)
  }, [])

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionCard eyebrow="Backend" title="API server URL">
        <Text style={styles.helper}>
          Point this at your running backend. Use your LAN IP (e.g. http://192.168.1.42:8000) when testing on a physical device.
        </Text>
        <TextInput
          value={apiBase}
          onChangeText={(v) => {
            setApiBaseState(v)
            setSaved(false)
            setError(null)
          }}
          placeholder="http://localhost:8000"
          placeholderTextColor="#8A9AB0"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {saved ? <Text style={styles.success}>Saved.</Text> : null}
        <PrimaryButton title="Save URL" onPress={() => { handleSave().catch(() => undefined) }} />
        <PrimaryButton title="Reset to localhost" onPress={() => { handleReset().catch(() => undefined) }} variant="secondary" />
      </SectionCard>

      <SectionCard eyebrow="About" title="VehicleID">
        <Text style={styles.helper}>Version 0.1.0</Text>
        <Text style={styles.helper}>
          Take a photo of any vehicle — car, plane, train, motorcycle, boat, or more — and the AI identifies it with fun facts, specs, and history.
        </Text>
        <Text style={styles.helper}>
          Powered by Claude Vision (Anthropic). No image is stored on the server after identification.
        </Text>
      </SectionCard>

      <SectionCard eyebrow="Running the backend" title="Local setup">
        <Text style={styles.tip}>1. cd tasks/2026-04-09-vehicle-identification-app/backend</Text>
        <Text style={styles.tip}>2. python -m venv .venv && source .venv/bin/activate</Text>
        <Text style={styles.tip}>3. pip install -r requirements.txt</Text>
        <Text style={styles.tip}>4. Copy .env.example to .env and add your ANTHROPIC_API_KEY</Text>
        <Text style={styles.tip}>5. Set CLASSIFIER_PROVIDER=claude in .env</Text>
        <Text style={styles.tip}>6. uvicorn app.main:app --reload --port 8000</Text>
      </SectionCard>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
    backgroundColor: '#F0F2F8',
  },
  helper: {
    color: '#4A5E72',
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E0F0',
    backgroundColor: '#FAFBFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0D1B2A',
    fontSize: 15,
  },
  error: {
    color: '#8A2323',
    fontSize: 14,
  },
  success: {
    color: '#1A6B3C',
    fontWeight: '700',
    fontSize: 14,
  },
  tip: {
    color: '#2E3F50',
    fontSize: 13,
    lineHeight: 21,
    fontFamily: 'monospace',
  },
})

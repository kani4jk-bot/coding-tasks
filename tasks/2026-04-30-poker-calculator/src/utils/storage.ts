import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  API_KEY: '@poker_claude_api_key',
  POT_SIZE: '@poker_pot_size',
};

export async function getApiKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.API_KEY);
  } catch {
    return null;
  }
}

export async function saveApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.API_KEY, key.trim());
}

export async function clearApiKey(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.API_KEY);
}
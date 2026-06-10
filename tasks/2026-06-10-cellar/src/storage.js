import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "cellar:wines";

export async function loadIndex() {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v ? JSON.parse(v) : [];
  } catch (e) {
    console.warn("load failed", e);
    return [];
  }
}

export async function saveIndex(arr) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn("save failed", e);
  }
}

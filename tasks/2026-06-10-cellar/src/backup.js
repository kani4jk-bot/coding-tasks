import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export async function exportCellar(wines) {
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device");
  const date = new Date().toISOString().slice(0, 10);
  const uri = `${FileSystem.cacheDirectory}cellar-backup-${date}.json`;
  const payload = {
    format: "cellar-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    wines,
  };
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2));
  await Sharing.shareAsync(uri, {
    mimeType: "application/json",
    dialogTitle: "Back up your Cellar",
    UTI: "public.json",
  });
}

export async function pickCellarBackup() {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
  const payload = JSON.parse(text);
  if (payload?.format !== "cellar-backup" || !Array.isArray(payload.wines)) {
    throw new Error("This is not a valid Cellar backup");
  }
  const valid = payload.wines.every((wine) =>
    wine && typeof wine.id === "string" &&
    ["loved", "good", "pass"].includes(wine.sentiment) &&
    Number.isFinite(wine.bandRank) &&
    Number.isFinite(wine.createdAt)
  );
  if (!valid) throw new Error("This backup contains invalid wine records");
  return payload.wines;
}

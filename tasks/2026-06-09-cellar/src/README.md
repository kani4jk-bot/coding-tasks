# Cellar — wine tasting journal

Photograph a wine label, let Claude identify it (producer, vintage, grapes, region, how it’s made, tasting profile), then rank it head-to-head against the wines you’ve already tasted. Each bottle earns a score out of ten that re-balances as your cellar grows. Discover tab suggests new bottles and reads your palate.

Native Expo app, built for the GitHub Codespaces + EAS pipeline.

## 1. Add it to your coding-tasks repo

This folder is self-contained. From your Codespace, in the `coding-tasks` repo root:

```bash
# the folder 2026-06-09-cellar/ goes under tasks/
git add tasks/2026-06-09-cellar
git commit -m "Add Cellar wine tasting app"
git push
```

## 2. Install dependencies

```bash
cd tasks/2026-06-09-cellar
npm install
npx expo install --fix   # aligns every package to your installed SDK
```

The versions in `package.json` target Expo SDK 54; `expo install --fix` reconciles them to whatever SDK you’re on.

## 3. Set the Anthropic API key

Label recognition and the Discover features call the Anthropic API. The key is read from `EXPO_PUBLIC_ANTHROPIC_API_KEY`.

**Local dev** — copy `.env.example` to `.env` and paste your key, then `npx expo start`.

**EAS builds** — set it as an EAS environment variable so it isn’t committed:

```bash
eas env:create --name EXPO_PUBLIC_ANTHROPIC_API_KEY --value sk-ant-... --environment preview --visibility sensitive
```

> Note: `EXPO_PUBLIC_` vars are inlined into the app bundle. That’s fine for a personal build; for a published app you’d route the calls through a small proxy so the key isn’t shipped to devices.

## 4. Build

The EAS project ID (`64a919d8-...`) is already set in `app.json`, so no `eas init` needed.

```bash
eas build --profile preview --platform android   # installable APK
# or
eas build --profile preview --platform ios
```

If your flow assigns a fresh EAS project per app, run `eas init` first to relink.

## Notes

- Data is stored on-device with AsyncStorage (`cellar:wines`). Only compact label thumbnails are kept, not full-resolution photos.
- Scoring splits 0–10 into thirds by first impression (Loved it / It was good / Not for me), and a short binary search places each wine precisely within its band.
- Model is set in `src/api.js` (`claude-sonnet-4-20250514`) — swap it there if you want a different one.

## Layout

```
App.js            all screens (Cellar, Add flow, Discover, Detail, Nav)
src/theme.js      palette, type, scoring
src/storage.js    AsyncStorage load/save
src/api.js        Anthropic calls (identify, suggest, palate)
app.json          Expo config + EAS project ID + camera permissions
eas.json          build profiles
.devcontainer/    Codespaces setup
```
# Cellar - wine tasting journal

Photograph a wine label, identify the bottle, then rank it head-to-head against wines you have already tasted. Cellar stores the journal on-device and can export a portable backup.

## App setup

```bash
cd tasks/2026-06-10-cellar
npm install
cp .env.example .env
npx expo start
```

Set `EXPO_PUBLIC_API_BASE` in `.env` to the deployed Worker URL. This URL is public by design; the Gemini API key remains only in the Worker secret.

For EAS builds, add the same URL to each build environment:

```bash
eas env:create --name EXPO_PUBLIC_API_BASE --value https://cellar-api.<your-subdomain>.workers.dev --environment preview --visibility plaintext
eas env:create --name EXPO_PUBLIC_API_BASE --value https://cellar-api.<your-subdomain>.workers.dev --environment production --visibility plaintext
```

## AI Worker

The Worker can run within Cloudflare's free request allowance. It uses `gemini-3.1-flash-lite`, which currently has free text, image, and output tokens, subject to Google's quotas and data-use terms.

1. Create a Gemini API key in Google AI Studio.
2. Install and deploy the Worker:

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npm run deploy
```

The deployed Worker exposes:

- `GET /api/health`
- `POST /api/identify`
- `POST /api/suggest`
- `POST /api/palate`

The endpoint is intentionally narrow and request-size limited. It is still a public endpoint, so monitor its free-tier usage before distributing the app broadly.

## Builds

Cellar is linked to its own EAS project:

`3583d273-7049-47a3-bbd5-1acd8fc5d22b`

```bash
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

iOS uses the bundle identifier `com.kani4jk.cellar` and includes camera and photo-library permission descriptions. Backup export uses the native share sheet, including iCloud Drive and Files.

## Data

- Wine records and compact thumbnails are stored in AsyncStorage under `cellar:wines`.
- Backup files are versioned JSON and include thumbnails, metadata, notes, rankings, and dates.
- Restoring a backup replaces the current on-device cellar after confirmation.
- Scores are recomputed whenever records are edited, restored, added, or removed.

## Layout

```text
App.js              screens and flows
src/api.js          calls the Cellar Worker
src/backup.js       native backup export and restore
src/storage.js      AsyncStorage persistence
src/theme.js        palette, wine types, scoring
worker/             Cloudflare Worker and Gemini integration
app.json            Expo, EAS, iOS, and Android configuration
```

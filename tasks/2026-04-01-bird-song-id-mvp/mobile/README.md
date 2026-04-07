# Birdsong ID Native Shell

This folder adds the Phase 2 native direction without touching the existing web app.

## Included now

- Expo / React Native scaffold
- bottom-tab navigation
- phone-first listen screen shell
- result screen shell
- placeholder history/settings tabs
- backend API client contract mirroring the FastAPI response

## Not wired yet

- real microphone recording
- actual file picker flow
- live upload to backend from UI buttons
- persistence/history sync

## Run

```bash
cd mobile
npm install
npx expo start
```

If you want the native app to talk to the local API, set:

```bash
export EXPO_PUBLIC_API_BASE=http://YOUR-LAN-IP:8000
```

Use your machine's LAN IP for physical phone testing. `localhost` only works in simulators running on the same host.

# Birdsong ID Native Shell

This folder adds the Phase 2 native direction without touching the existing web app.

## Included now

- Expo / React Native scaffold
- bottom-tab navigation
- phone-first listen screen shell
- result screen shell
- history/settings tabs promoted into a local field journal experience
- backend API client contract mirroring the FastAPI response
- native microphone permission request
- optional native location capture before upload
- device-date capture before upload
- one-tap record → stop → upload → identify flow
- live result handoff from backend response to the Result screen
- editable field notes for saved sightings
- local delete/clear controls and simple on-device history stats

## Current behavior

- First tap requests mic permission if needed and starts a real recording.
- Location is an explicit opt-in. When enabled, the app asks for foreground permission and grabs a fresh fix right before upload.
- Device date is attached by default and can be toggled off.
- Second tap stops recording, uploads the clip plus any opted-in context to `/api/identify`, and opens the Result screen with the real API response.
- Errors stay on the Listen screen so the flow fails honestly.

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

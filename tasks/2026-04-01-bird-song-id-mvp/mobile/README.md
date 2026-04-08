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
- optional native approximate-location capture before upload
- device-date capture before upload
- one-tap record → stop → upload → identify flow
- live result handoff from backend response to the Result screen
- editable field notes for saved sightings
- local delete/clear controls and simple on-device history stats
- offline retry queue that persists failed uploads and saved clip files on-device
- manual retry + queue-clear controls in the native UI

## Current behavior

- First tap requests mic permission if needed and starts a real recording.
- Approximate location is an explicit opt-in. When enabled, the app asks for foreground permission, requests coarse location, and snaps the fresh fix into an approximately 3 km² region before upload.
- Device date is attached by default and can be toggled off.
- Second tap stops recording, uploads the clip plus any opted-in context to `/api/identify`, and opens the Result screen with the real API response.
- If upload fails after the recording is captured, the app copies that clip into app storage and adds it to a retry queue instead of just dropping it.
- Opening the Listen screen automatically attempts queued retries; Settings also exposes manual retry and clear controls.
- Errors still surface honestly on-screen, but the clip is preserved when queueing succeeds.

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

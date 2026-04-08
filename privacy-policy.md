# Birdsong ID Privacy Policy

_Last updated: 2026-04-08_

This is a first-pass privacy policy for the current Birdsong ID MVP behavior.

## Summary

Birdsong ID lets you record or upload a bird sound clip and send it to the app's backend so it can suggest likely bird species.

Right now, the app's privacy posture is simple:

- audio clips are uploaded to the backend for identification
- location is optional
- when location is enabled in the native app, the app sends an **approximate coarse region**, not a precise pin
- date is optional in the web app and on by default in the native app, where it uses the device date
- saved history, stars, and notes are stored **locally on the device**
- there is **no account system and no cloud sync for saved history/notes yet**

## Information the app currently handles

### 1. Audio you choose to submit

When you record a clip or upload an audio file for identification, the app sends that audio to the backend API so the bird-identification service can analyze it.

This may include:

- the audio content itself
- the file name
- file type
- file size and related request metadata

### 2. Optional location context

You can choose whether to attach location context.

- In the web app, location can be entered manually or requested from the browser.
- In the native app, location is opt-in.
- In the native app's current implementation, the app converts location to an **approximate region of about 3 km²** before upload.

The goal is to improve likely-species matching without sending the most precise version of your location.

### 3. Optional date context

The app may send a recording date to help narrow likely species.

- Web app: optional
- Native app: device date is on by default, but can be turned off

### 4. Local history and notes

The native app currently stores some information locally on your device, including:

- successful identification results
- saved/starred sightings
- notes you add to a result
- retry queue items when an upload fails and the app saves the clip for another attempt later

This local history is currently device-only.

## What the app does not currently do

Based on the current MVP code, the app does **not** currently provide:

- user accounts
- profile pages
- cloud sync of your saved sightings or notes
- cross-device history sync
- in-app social sharing features
- precise live location tracking in the native app
- background audio surveillance or always-on listening

## How information is used

The current MVP uses submitted information to:

- process bird-identification requests
- improve species ranking using optional context like approximate location and date
- show results back to you in the app
- preserve local history, notes, and retry items on your own device
- debug request failures at a basic operational level

## Storage and retention

### On your device

The native app stores local history, notes, stars, and queued retry clips on-device until you delete them or clear the app's data/history.

### On the backend

Audio and request data are sent to the backend for processing. This first-pass policy is intentionally conservative: if you publish the app, you should confirm and document the backend hosting/log retention details before making stronger retention claims.

For the current MVP, you should assume uploaded clips and request metadata may be processed and may exist temporarily in server-side systems needed to complete identification.

## Permissions

Depending on platform and features you use, the app may request:

- microphone access, to record a bird clip
- location access, only if you choose to attach location context

If you do not grant location access, the app can still work without location context.

## Children

This MVP is not specifically directed to children. If you plan to publish broadly, add your intended age guidance and any store-specific disclosures before release.

## Security

This MVP aims to limit data collection to what is needed for the current feature set, but it is still early-stage software. Do not promise bank-grade or enterprise-grade security unless you have actually implemented and verified it.

## Your choices

You can currently:

- decide whether to upload a clip for identification
- decide whether to attach location context
- turn date context off in the native app
- delete saved sightings and notes from the device
- clear local history and retry-queue items from the device

## Changes to this policy

If the app later adds accounts, sync, analytics, crash reporting, sharing, or new hosting/providers, this policy should be updated to match the real behavior before or at launch.

## Contact

Before publishing to the App Store or Play Store, replace this section with a real support/privacy contact email.

Example:

- Email: support@example.com

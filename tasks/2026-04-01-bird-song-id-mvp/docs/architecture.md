# Architecture

## Product goal

Identify likely bird species from a short recording of song/call, fast enough for an on-phone web experience.

## Core constraints

- recordings are noisy
- bird vocalizations overlap
- browser audio formats vary by device
- confidence must be communicated honestly
- local species prevalence matters a lot

## Proposed MVP architecture

```text
Mobile Web App
  └─ upload/record audio + optional context
      └─ FastAPI backend
          ├─ validate file
          ├─ normalize audio with ffmpeg
          ├─ inference provider
          │   ├─ mock provider (default dev mode)
          │   └─ BirdNET provider (real path)
          └─ aggregate + return ranked species
```

## Provider abstraction

The backend isolates inference in provider classes so the product interface stays stable even as the ML implementation changes.

### Today
- `MockClassifierProvider`
- `BirdNetProvider` using `birdnetlib` when available

### Later
- optional `RemoteInferenceProvider` for a hosted service
- optional regional reranking layer using checklist/prevalence data

## Real inference path implemented now

### BirdNET provider flow

1. Accept uploaded audio bytes and metadata
2. Write upload to a temp file
3. Normalize audio to mono 48 kHz WAV via `ffmpeg`
4. Run BirdNET through `birdnetlib`
5. Aggregate detections by species
6. Return ranked predictions with simple reasoning text

### Why this is the right next step

- purpose-built model family for bird vocalizations
- more realistic than generic audio embeddings or LLM guessing
- allows location/date context to matter immediately
- still preserves a clean fallback path for development

## Why mobile web first

- fast MVP delivery
- easiest to share and test
- no app store friction
- browser media capture is sufficient for a first version

## Native-app expansion path

The repo now also includes a separate `mobile/` Expo shell.

That keeps the current web MVP intact while opening a cleaner path for:

- better recording UX on phones
- future offline / retry behavior
- easier permissions management
- app-store distribution later without rewriting backend contracts

## Future additions

- spectrogram visualization
- result history
- stronger location-aware reranking
- better handling of multi-bird clips
- clip trimming before upload
- batch evaluation / saved samples for model QA
- offline-capable lightweight model for premium/native version

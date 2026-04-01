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
  └─ upload/record audio
      └─ FastAPI backend
          ├─ validate file
          ├─ normalize audio
          ├─ inference provider
          │   ├─ mock provider (today)
          │   └─ BirdNET provider (next)
          └─ aggregate + return ranked species
```

## Provider abstraction

The backend isolates inference in provider classes so that the product interface remains stable even as the ML implementation changes.

### Today
- `MockClassifierProvider`

### Next
- `BirdNetClassifierProvider`
- optionally `RemoteInferenceProvider` if using a hosted model/API

## Why mobile web first

- fast MVP delivery
- easiest to share and test
- no app store friction
- browser media capture is sufficient for a first version

## Future additions

- spectrogram visualization
- result history
- location-aware reranking
- better handling of multi-bird clips
- clip trimming before upload
- offline-capable lightweight model for premium/native version

# Production Foundation

## Product direction

This repo is now split into three deliberate product surfaces:

- `frontend/` — existing phone-friendly web MVP, kept intact
- `backend/` — API and inference orchestration surface
- `mobile/` — new Expo / React Native native-app shell for Phase 2

That gives the project a sane path:

1. keep shipping in web quickly
2. stabilize backend contracts
3. grow into native capture and better on-phone UX without rewriting the service layer

## Backend service direction

### Current target shape

```text
mobile/web client
  -> POST /api/identify
      -> upload validation
      -> audio normalization
      -> classifier provider
      -> ranked response + clip metadata + request id
```

### Important service boundaries

- `routers/identify.py` handles HTTP and form decoding only
- `services/pipeline.py` owns orchestration and response construction
- `services/providers.py` owns inference-provider implementations
- `schemas.py` defines the stable app-facing contract

This is intentionally the line between “product API” and “model internals.”

## Inference pipeline structure

### Implemented now

- request-scoped id generation
- clip metadata captured in response
- provider abstraction kept stable
- room for future tracing / persistence without breaking clients

### Next pipeline upgrades

- waveform duration extraction before provider dispatch
- optional async job mode for longer uploads
- persisted request log for QA and analytics
- provider timing metrics
- clip dedupe via content hashing
- background moderation / audio quality scoring

## Metadata and data-model groundwork

### Core request metadata

- `filename`
- `content_type`
- `file_size_bytes`
- `latitude`
- `longitude`
- `recorded_on`
- generated `request_id`
- `received_at`

### Near-future domain models

- `BirdingSession`
- `IdentificationAttempt`
- `SavedClip`
- `SpeciesFeedback` (correct / incorrect / unsure)
- `UserLocationHint`

## Recommended storage roadmap

### MVP+
- SQLite/Postgres for request history and saved IDs
- object storage for original and normalized clips

### Later
- embeddings/features cache
- regional species priors cache
- evaluation dataset tables

## API contract posture

The API should stay stable even if the model stack changes. That means:

- the response shape is product-owned, not BirdNET-owned
- provider-specific details should be additive only
- request identifiers and clip metadata belong at the API layer

## Phase checklist

### Phase 1 now done
- [x] backend orchestration extracted into pipeline service
- [x] response contract expanded with request metadata
- [x] production direction documented
- [x] repo now has explicit mobile/native track

### Phase 1 next
- [ ] persistence layer for request history
- [ ] provider timing + error metrics
- [ ] duration / sample-rate metadata extraction
- [ ] quality scoring and clip warnings
- [ ] regional reranking adapter

### Phase 2 now done
- [x] Expo app scaffold added in `mobile/`
- [x] native navigation structure added
- [x] listening flow shell added
- [x] result screen shell added
- [x] backend API client contract mirrored in native app

### Phase 2 next
- [ ] real microphone recording with Expo AV / Audio
- [ ] upload from Files / media library
- [ ] live request submission to backend
- [ ] saved recent identifications
- [ ] offline field notes and retry queue

# Diabetes Guardian Backend Fallback Stack

## Document Control

**Product:** Diabetes Guardian
**Document Type:** Backend Technical Stack Backup / Fallback Architecture
**Version:** 2.0
**Status:** Draft
**Primary Purpose:** Define a fallback backend that preserves the new product direction from `PageViews-Features-Codex.md` when the managed stack is unavailable or too heavy.

---

## 1. Executive Summary

The fallback backend exists so the product can still demo and operate even if the managed stack fails.

That fallback must now support the updated product direction:

# **Capturar -> Entender -> Acompanar -> Mejorar**

The fallback backend is not designed around a glucose tracker.
It is designed around:

* multimodal capture
* patient history memory
* symptom and medication control
* grounded assistant answers
* care-plan synthesis

The fallback stack should preserve the same five product surfaces:

* `Inicio`
* `Mi Salud`
* `Asistente`
* `Mi Plan`
* `Capturar`

The core fallback choice remains:

# **FastAPI + PostgreSQL + local file storage**

with optional semantic retrieval and AI provider adapters around it.

---

## 2. Why We Need a Fallback Stack

Even if the primary architecture uses Supabase and hosted AI services, the product needs a credible fallback for:

* hackathon resilience
* lower infrastructure dependency
* simplified debugging
* local-first development
* cost control
* data model continuity
* provider portability

If the primary stack disappears during the demo, the fallback must still be able to:

* receive patient input
* store history
* extract key facts from documents and audio
* answer grounded questions
* generate a useful plan

---

## 3. Fallback Architecture Philosophy

The fallback backend should be:

* simple
* inspectable
* portable
* modular
* easy to reseed
* easy to reset
* easy to explain

It should not try to recreate every managed feature.

It should preserve the visible product loop:

**Capturar -> Entender -> Acompanar -> Mejorar**

And the internal operational loop:

**Capture -> Normalize -> Store -> Retrieve -> Synthesize**

---

## 4. Recommended Fallback Backend Stack

## 4.1 Database

### PostgreSQL

Use local or self-hosted PostgreSQL as the source of truth.

### Why PostgreSQL

* mature and reliable
* strong relational integrity
* works well for healthcare-style structured records
* supports JSON fields for extracted model output
* easy to run locally with Docker
* can add `pgvector` later if needed

### Role in the Product

PostgreSQL stores:

* users
* patient profiles
* symptoms
* medication plans
* medication confirmations
* documents
* document extractions
* audio notes
* transcripts
* labs
* care timeline events
* specialist suggestions
* care plans
* AI outputs

---

## 4.2 Vector / Retrieval Option

### Option A - PostgreSQL + pgvector

Use when fallback mode still needs semantic retrieval.

Good for:

* patient-history lookup
* document chunk search
* assistant evidence retrieval
* `what changed?` style questions

### Option B - Structured Retrieval Only

Use when simplicity matters more than semantic search.

Fallback queries can still work with:

* recent events
* deterministic links
* timeline slices
* markdown snapshots

### Recommendation

Start with plain PostgreSQL.
Add `pgvector` only when retrieval quality becomes a blocker.

---

## 4.3 Backend API Layer

### Recommended Final Fallback Choice

# **FastAPI + PostgreSQL**

This is still the strongest fallback choice because the product depends on:

* OCR and parsing utilities
* audio transcription handling
* AI provider adapters
* job orchestration
* structured response contracts

### Why FastAPI

* Python-native
* fast to prototype
* strong request validation with Pydantic
* easy to expose explicit, boring APIs
* works well with model and OCR wrappers

### Role in the Product

The API layer will:

* receive capture input
* normalize and store events
* call OCR, transcription, and model providers
* orchestrate patient-memory retrieval
* generate assistant and care-plan outputs
* serve data to mobile and web clients

---

## 4.4 File Storage

Use local file storage or a mounted folder during fallback mode.

Store:

* document PDFs
* prescription images
* lab screenshots
* symptom photos
* voice notes

### Recommended Directory Pattern

```text
/storage
  /patients
    /{patient_id}
      /documents
      /images
      /audio
      /exports
```

### Metadata Rule

Never treat the file system as the source of truth.
Store metadata in PostgreSQL:

* file path
* patient ID
* upload timestamp
* file type
* parse status
* extraction status
* linked event IDs

---

## 5. Selected AI Models and External APIs

The fallback backend should expose adapters for the selected models documented under `AI-developer`.

## 5.1 OpenAI Reasoning and Structured Output

* **API:** OpenAI Responses API
* **Model:** `gpt-5`

Use for:

* assistant answers
* `what changed?` summaries
* doctor-prep output
* care-plan JSON generation

## 5.2 Gemini Fast Multimodal Intake

* **API:** Gemini API
* **Model:** `gemini-3-flash-preview`

Use for:

* quick routing and extraction in `Capturar`
* cheap multimodal understanding of photo/document/audio inputs

## 5.3 Gemini Deep Multimodal Reasoning

* **API:** Gemini API
* **Model:** `gemini-3.1-pro-preview`

Use for:

* difficult clinical files
* long-context synthesis
* fallback on noisy or mixed-format capture

## 5.4 Embeddings

* **API:** Gemini API
* **Model:** `gemini-embedding-2-preview`

Use for:

* shared multimodal patient memory
* text, image, document, and transcript embedding

## 5.5 Vision

* **API:** OpenAI Responses API
* **Model:** `gpt-4.1-mini`

Use for:

* symptom photo triage
* lightweight image interpretation
* image-first extraction fallback

## 5.6 Audio

* **API:** OpenAI Audio API
* **Primary Model:** `gpt-4o-transcribe`
* **Speaker-aware Model:** `gpt-4o-transcribe-diarize`
* **Lower-cost fallback:** `gpt-4o-mini-transcribe`
* **Translation fallback:** `whisper-1`

Use for:

* consultation recordings
* caregiver audio
* voice uploads from `Capturar`

## 5.7 Text-to-Speech

* **API:** Gemini API
* **Model:** `gemini-2.5-flash-preview-tts`

Use for:

* optional spoken summaries
* accessibility playback

## 5.8 Nutrition APIs

Expose a provider abstraction:

* **Primary (Hackathon):** `FatSecret API` — free tier, 5,000 calls/day, Premier Free for startups
* **Production Upgrade:** `Nutritionix API` — native NLP, paid plans

Use for:

* meal enrichment
* macros and serving lookup
* food normalization for patient timeline context

### FatSecret Auth Flow

1. `POST https://oauth.fatsecret.com/connect/token`
   * HTTP Basic Auth: base64(`clientId:clientSecret`)
   * Body: `grant_type=client_credentials&scope=basic`
   * Returns Bearer token
2. All API calls: `POST https://platform.fatsecret.com/rest/server.api`
   * Headers: `Authorization: Bearer <token>`, `Content-Type: application/x-www-form-urlencoded`
   * Always include `format=json`
3. IP whitelist required — calls must go through FastAPI backend, not mobile client directly

### Nutritionix Auth

Headers on every request: `x-app-id` and `x-app-key`. No OAuth needed.

Natural language endpoint: `POST https://trackapi.nutritionix.com/v2/natural/nutrients`

### Provider Rule

Do not hardwire nutrition logic to a single vendor.
Implement a `nutrition_provider` interface so the app can switch between Nutritionix and FatSecret via a single config flag.

Switch with: `NUTRITION_PROVIDER=fatsecret` or `NUTRITION_PROVIDER=nutritionix`

---

## 6. Fallback Brain Architecture

The fallback backend should preserve the 3-brain model as service modules.

## 6.1 Metabolic Brain

Handles:

* glucose context
* day-state interpretation
* symptoms in context
* medication adherence context
* nutrition-enriched meal context

## 6.2 Clinical Brain

Handles:

* OCR output
* transcript extraction
* medication change detection
* lab extraction
* specialist recommendation inputs

## 6.3 Memory Brain

Handles:

* patient timeline assembly
* retrieval context
* comparison summaries
* evidence packaging for assistant and care plan

### Execution Rule

These do not need to be separate deployed services in fallback mode.
They can exist as internal FastAPI modules and async job handlers.

---

## 7. Background Jobs / Task Layer

Use a simple internal task queue backed by PostgreSQL.

### Example Jobs

* OCR processing
* transcription
* document extraction
* embedding generation
* care-plan regeneration
* timeline refresh

### Minimal Jobs Table

Use a `jobs` table with:

* `pending`
* `processing`
* `completed`
* `failed`

This is enough for fallback mode and easy to inspect during the demo.

---

## 8. Core Backend Responsibilities

The fallback backend must support:

## 8.1 Patient and Session Management

* local auth or demo auth
* patient profiles
* seeded demo patients

## 8.2 Capture and Event Logging

* text events
* symptom events
* medication events
* document uploads
* audio uploads
* nutrition-enriched meal events

## 8.3 Document and Audio Lifecycle

* file ingestion
* OCR/transcription
* structured extraction
* summary generation
* event linking

## 8.4 Memory and Retrieval

* longitudinal timeline
* markdown snapshots
* optional semantic retrieval
* assistant evidence context

## 8.5 Guidance Generation

* daily state summaries
* top-priority outputs
* grounded assistant answers
* specialist routing summaries
* care-plan generation

---

## 9. Initial Database Schema Direction

## Core Tables

### users

* id
* email
* password_hash
* role
* created_at

### patients

* id
* user_id
* display_name
* diabetes_type
* age_band
* created_at

### symptoms

* id
* patient_id
* symptom_name
* severity
* notes
* logged_at

### medications

* id
* patient_id
* name
* dosage
* schedule_text
* active

### medication_events

* id
* patient_id
* medication_id
* status
* logged_at
* notes

### documents

* id
* patient_id
* file_path
* file_type
* original_name
* uploaded_at
* parse_status
* extraction_status

### document_extractions

* id
* document_id
* extraction_type
* structured_json
* summary_text
* created_at

### audio_notes

* id
* patient_id
* file_path
* duration_seconds
* uploaded_at
* transcribe_status

### transcripts

* id
* audio_note_id
* transcript_text
* diarized_json
* summary_text
* created_at

### labs

* id
* patient_id
* source_document_id
* lab_name
* value_text
* unit
* reference_range
* observed_at

### nutrition_events

* id
* patient_id
* source_type
* source_record_id
* provider
* normalized_json
* created_at

### specialist_suggestions

* id
* patient_id
* specialist_type
* rationale
* priority
* created_at

### care_plans

* id
* patient_id
* status_json
* priorities_json
* weekly_actions_json
* goals_json
* created_at
* updated_at

### timeline_events

* id
* patient_id
* event_type
* linked_table
* linked_record_id
* summary_text
* event_at
* created_at

### ai_outputs

* id
* patient_id
* output_type
* input_reference
* structured_json
* summary_text
* created_at

### jobs

* id
* job_type
* status
* payload_json
* result_json
* created_at
* updated_at

---

## 10. Memory Strategy in Fallback Mode

Even in fallback mode, memory should exist in three forms.

## 10.1 Structured Memory

Stored in PostgreSQL tables.

## 10.2 Human-Readable Memory

Stored in markdown files such as:

* `PATIENT_HISTORY.md`
* `CARE_PLAN.md`
* `RISK_PROFILE.md`
* `AGENT_HANDOFFS.md`

## 10.3 Optional Semantic Memory

Stored in `pgvector` or another local vector layer when needed.

### Recommendation

Fallback mode should still feel intelligent even without vector search.
It must work with:

* recent events
* explicit table queries
* timeline slices
* markdown snapshots

---

## 11. API Design Direction

### Guiding Principle

Keep the API explicit.
Keep the domain visible.
Do not hide core product logic behind vague endpoints.

## 11.1 Home

* `GET /patients/{id}/home`

## 11.2 My Health

* `GET /patients/{id}/health`
* `POST /symptoms`
* `POST /medications/events`
* `GET /patients/{id}/specialists`
* `GET /patients/{id}/care-timeline`

## 11.3 Assistant

* `POST /assistant/query`
* `POST /assistant/what-changed`
* `POST /assistant/doctor-prep`
* `GET /patients/{id}/timeline`

## 11.4 Care Plan

* `GET /patients/{id}/plan`
* `POST /patients/{id}/plan/regenerate`

## 11.5 Capture

* `POST /capture/text`
* `POST /capture/photo`
* `POST /capture/document`
* `POST /capture/audio`

## 11.6 Files and Extraction

* `POST /documents/upload`
* `POST /documents/{id}/extract`
* `POST /audio/{id}/transcribe`
* `POST /audio/{id}/summarize`

## 11.7 Nutrition

* `POST /nutrition/lookup`
* `POST /meals/enrich`

---

## 12. Local Development Setup

Recommended local services:

* PostgreSQL via Docker
* FastAPI app
* local storage folder
* optional pgAdmin or Adminer

Suggested containers:

* `postgres`
* `backend`
* optional `pgadmin`

Why Docker:

* reproducible setup
* fast reseeding
* easier onboarding
* demo resilience

---

## 13. Recommended Implementation Phases

## Phase 1 - Minimum Fallback Backend

Build:

* PostgreSQL
* FastAPI
* local file storage
* `capture/text`
* `capture/document`
* `capture/audio`
* `patients/{id}/home`
* `assistant/query`

## Phase 2 - Core Memory and Control

Add:

* timeline events
* medication events
* symptom events
* plan regeneration
* markdown memory snapshots

## Phase 3 - Better Intelligence

Add:

* embedding generation
* semantic retrieval
* nutrition provider abstraction
* specialist suggestions

---

## 14. Final Recommendation

If we need a reliable fallback backend that still matches the updated product vision, the best choice is:

# **FastAPI + local PostgreSQL + local file storage + optional pgvector + AI provider adapters**

with these explicit runtime choices:

* `gpt-5` via Responses API for reasoning and structured outputs
* `gemini-3-flash-preview` for fast multimodal intake
* `gemini-3.1-pro-preview` for harder multimodal reasoning
* `gemini-embedding-2-preview` for memory
* `gpt-4.1-mini` for lightweight vision
* `gpt-4o-transcribe` and `gpt-4o-transcribe-diarize` for audio
* `gemini-2.5-flash-preview-tts` for optional voice playback
* Nutritionix or FatSecret through a nutrition provider abstraction

### Final Rule

If the managed backend disappears tomorrow, the fallback stack should still be able to:

* accept patient input
* update the timeline
* answer grounded questions
* show what matters now
* generate a useful care plan

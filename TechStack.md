# Diabetes Guardian Repo-Ready Architecture Spec

## Document Control

**Product:** Diabetes Guardian
**Document Type:** Repo-Ready Architecture Specification
**Version:** 2.0
**Status:** Primary Build Spec
**Purpose:** Define the production-shaped, hackathon-ready architecture for Diabetes Guardian after the PRD shift in `PageViews-Features-Codex.md`.

---

## 1. Executive Summary

Diabetes Guardian is no longer a glucose tracker, food app, or generic health chat.

It is:

**a multimodal diabetes companion that turns what the patient lives, feels, records, and receives from clinicians into usable memory, daily control, and a personalized improvement plan.**

The product is now organized around this visible loop:

# **Capturar -> Entender -> Acompanar -> Mejorar**

And around two MVP features that carry the demo:

1. **AI Medical History Assistant**
2. **Control Integral del Paciente**

The five primary product surfaces are:

* `Inicio`
* `Mi Salud`
* `Asistente`
* `Mi Plan`
* `Capturar`

The architecture must support:

* multimodal capture: text, photo, document, audio
* patient timeline memory
* structured symptom and medication control
* grounded assistant responses over patient history
* personalized care-plan synthesis
* calm, plain-language outputs for demo and real use

---

## 2. Product Direction

## 2.1 What the Product Is

A diabetes support system that helps the patient:

* capture real-world inputs with low friction
* understand what changed
* organize symptoms, meds, specialists, and care tasks
* receive a concrete next-step plan

## 2.2 What the Product Is Not

It is not:

* a generic chatbot
* a pure OCR utility
* a pure glucose dashboard
* a pure meal logging app
* an autonomous diagnosis engine

## 2.3 Product Layers

### Layer 1 - Capture and Interpretation

* text notes
* symptom logging
* medication confirmations
* photos
* documents
* consultation audio

### Layer 2 - Patient Memory and Control

* timeline events
* history-grounded Q&A
* symptom recurrence
* medication context
* specialist routing
* care timeline

### Layer 3 - Improvement and Guidance

* state-of-day summary
* top priority
* weekly actions
* 30/90 day goals
* plain-language explanations

---

## 3. Final Recommended Stack

# Stack A - Recommended

## Mobile App

* **Expo**
* **React Native**
* **JavaScript**
* **NativeWind**

## Web App

* **Next.js App Router**
* **Tailwind CSS**

## Structured Backend

* **Supabase**
  * Postgres
  * Auth
  * Storage
  * Edge Functions
  * optional Realtime

## Service Layer

* app-level orchestration services for:
  * `capture`
  * `clinical`
  * `memory`
  * `care-plan`
  * `nutrition`
  * `voice`

## Vector Memory

* **Pinecone**

## Multimodal Embeddings

* **Gemini `gemini-embedding-2-preview`**

## Nutrition Enrichment

* **Nutritionix API** as the primary nutrition provider
* **FatSecret API** as alternate/fallback nutrition provider

## Clinical Reference Support

* **OpenFDA API** for medication label and safety reference

---

## 4. Selected AI Models and API Runtime

The selected models from `AI-developer` should be treated as first-class runtime decisions, not as loose references.

## 4.1 Primary Reasoning and Structured Output

* **OpenAI Responses API**
* **Model:** `gpt-5`

Use for:

* `Asistente` answers grounded in retrieved patient history
* `Mi Plan` structured JSON generation
* `what changed?` summaries
* visit prep and specialist prep outputs
* final response formatting in plain language

## 4.2 Fast Multimodal Extraction

* **Gemini API**
* **Model:** `gemini-3-flash-preview`

Use for:

* fast multimodal routing in `Capturar`
* cheap classification of text/photo/document/audio inputs
* quick extraction passes before deeper reasoning

## 4.3 Deep Multimodal Reasoning

* **Gemini API**
* **Model:** `gemini-3.1-pro-preview`

Use for:

* harder clinical-document interpretation
* long-context synthesis over complex uploads
* fallback when capture inputs are noisy or mixed-format

## 4.4 Embeddings and Memory

* **Gemini API**
* **Model:** `gemini-embedding-2-preview`

Use for:

* text embeddings
* image embeddings
* document embeddings
* audio/transcript embeddings
* one shared semantic space for the patient timeline

## 4.5 Vision and Image Understanding

* **OpenAI Responses API**
* **Model:** `gpt-4.1-mini`

Use for:

* symptom photo interpretation
* lab or prescription image understanding
* lightweight image triage before deeper extraction

## 4.6 Audio Transcription

* **OpenAI Audio API**
* **Primary Model:** `gpt-4o-transcribe`
* **Speaker-aware Model:** `gpt-4o-transcribe-diarize`
* **Lower-cost fallback:** `gpt-4o-mini-transcribe`
* **Translation fallback:** `whisper-1`

Use for:

* consultation recordings
* caregiver voice notes
* audio uploads from `Capturar`

## 4.7 Text-to-Speech

* **Gemini API**
* **Model:** `gemini-2.5-flash-preview-tts`

Use for:

* optional calm spoken summaries
* accessibility playback
* future voice-first flows

## 4.8 Runtime Rule

Use the model that fits the job:

* `gpt-5` for synthesis and structured guidance
* `gemini-3-flash-preview` for fast multimodal intake
* `gemini-3.1-pro-preview` for hard cases
* `gpt-4.1-mini` for light vision
* `gpt-4o-transcribe*` for audio
* `gemini-embedding-2-preview` for memory

---

## 5. Architecture Principles

### 5.1 Visible Product First

Every architectural choice should strengthen one of the five visible surfaces:

* `Inicio`
* `Mi Salud`
* `Asistente`
* `Mi Plan`
* `Capturar`

### 5.2 Universal Input First

All meaningful patient data should enter through `Capturar` or a direct derivative of it.

### 5.3 SQL for Truth, Pinecone for Meaning

Use Supabase Postgres as the source of truth.
Use Pinecone for semantic recall over multimodal patient memory.

### 5.4 Structured Before Generative

Before asking the model for guidance:

1. extract
2. classify
3. normalize
4. store
5. retrieve
6. synthesize

### 5.5 Calm UX, Strong Backend

The backend can be sophisticated.
The patient-facing output should stay short, clear, and actionable.

### 5.6 Predictions Are Secondary

Prediction can exist, but it is not the center of the MVP.
The MVP wins by showing memory, control, and next steps.

---

## 6. Product Surface Responsibilities

## 6.1 `Inicio`

Must show:

* state of the day
* one priority
* quick symptoms
* short AI insight
* last meaningful event

Backend dependencies:

* latest timeline state
* current medication adherence
* symptom recurrence summary
* most relevant care action

## 6.2 `Mi Salud`

Must organize:

* symptoms
* medications
* specialists
* care timeline

Backend dependencies:

* structured symptom events
* med plans and confirmations
* specialist suggestion engine
* labs/appointments/care-task dates

## 6.3 `Asistente`

This is the **AI Medical History Assistant**.

Must do:

* patient-history Q&A
* evidence-backed answers
* answer + evidence + next action

Backend dependencies:

* Pinecone retrieval
* transcript/document chunks
* timeline events
* structured response generation via `gpt-5`

## 6.4 `Mi Plan`

Must show:

* current state
* top 3 priorities
* this week's actions
* 30/90 day goals

Backend dependencies:

* patient-wide synthesis
* structured plan JSON
* adherence, symptoms, clinical context, and recent changes

## 6.5 `Capturar`

Must accept:

* text
* photo
* document
* audio

Backend dependencies:

* file ingestion
* OCR/transcription
* classification
* extraction
* embedding
* storage

---

## 7. System Flow

# Capturar -> Entender -> Acompanar -> Mejorar

## Step 1 - Capture

The user submits:

* a symptom
* a medication confirmation
* a doctor audio note
* a PDF or photo of a lab/prescription
* a free-text question

## Step 2 - Understand

The system performs:

* transcription or OCR
* multimodal classification
* extraction of actions, meds, labs, symptoms, dates
* embedding generation

## Step 3 - Accompany

The system updates:

* `Inicio`
* `Mi Salud`
* `Asistente`

and explains:

* what changed
* what matters now
* what to ask or do next

## Step 4 - Improve

The system generates:

* care-plan priorities
* weekly actions
* measurable goals
* specialist or follow-up suggestions

---

## 8. Internal Brain Architecture

The 3-brain model stays, but its role is now tied directly to the five surfaces.

## 8.1 Metabolic Brain

Responsibilities:

* glucose context
* symptom + day-state interpretation
* medication adherence context
* meal and nutrition context
* daily status support

Consumes:

* glucose logs
* meal/nutrition data
* symptom events
* medication events

## 8.2 Clinical Brain

Responsibilities:

* doctor note extraction
* lab extraction
* medication-change detection
* specialist recommendation support
* care timeline enrichment

Consumes:

* documents
* transcripts
* prescriptions
* labs
* referral signals

## 8.3 Memory Brain

Responsibilities:

* timeline assembly
* retrieval orchestration
* comparison logic
* history-grounded context packaging
* care-plan evidence packaging

Consumes:

* all normalized patient events
* embeddings
* summaries
* prior outputs

---

## 9. Data and Storage Responsibilities

## 9.1 Supabase Postgres

Stores:

* users
* patients
* symptoms
* medications
* medication events
* documents
* document extractions
* audio notes
* transcripts
* timeline events
* care tasks
* labs
* specialist suggestions
* care plans
* AI outputs

## 9.2 Supabase Storage

Stores:

* uploaded PDFs
* prescription images
* lab screenshots
* symptom photos
* voice notes

## 9.3 Pinecone

Stores vectors for:

* transcript chunks
* document chunks
* summary chunks
* timeline snapshots
* care-plan evidence blocks

## 9.4 Nutrition Provider Layer

Use a provider abstraction:

* `NutritionixProvider`
* `FatSecretProvider`

The product should not depend on one nutrition vendor at the domain layer.

---

## 10. API Routes / Service Endpoints

These can live as Edge Functions, Next.js route handlers, or backend endpoints depending on the final implementation.

## 10.1 Home

* `GET /api/home/{patientId}`

## 10.2 My Health

* `GET /api/patients/{patientId}/health`
* `POST /api/symptoms`
* `POST /api/medications/events`
* `GET /api/patients/{patientId}/specialists`
* `GET /api/patients/{patientId}/care-timeline`

## 10.3 Assistant

* `POST /api/assistant/query`
* `POST /api/assistant/what-changed`
* `POST /api/assistant/doctor-prep`
* `GET /api/patients/{patientId}/timeline`

## 10.4 Care Plan

* `GET /api/patients/{patientId}/plan`
* `POST /api/patients/{patientId}/plan/regenerate`

## 10.5 Capture

* `POST /api/capture/text`
* `POST /api/capture/photo`
* `POST /api/capture/document`
* `POST /api/capture/audio`

## 10.6 Documents and Voice

* `POST /api/documents/upload`
* `POST /api/documents/{documentId}/extract`
* `POST /api/audio/{audioId}/transcribe`
* `POST /api/audio/{audioId}/summarize`

## 10.7 Nutrition

* `POST /api/nutrition/lookup`
* `POST /api/meals/enrich`

---

## 11. Demo Cutline

## Must Build

* `Inicio`
* `Mi Salud`
* `Asistente`
* `Mi Plan`
* `Capturar`
* one strong audio or document flow
* one strong history-grounded question flow

## Should Build

* polished confirmation states
* one compact patient timeline
* one specialist recommendation path
* one nutrition enrichment path through Nutritionix or FatSecret

## Defer

* live Dexcom sync
* heavy predictive dashboards
* full provider portal
* full caregiver dashboard
* advanced charting

---

## 12. Build Order Recommendation

## Phase 1 - Demo Core

* `Capturar`
* `Asistente`
* `Inicio`
* `Mi Salud`
* `Mi Plan`

## Phase 2 - Core Intelligence

* transcription and diarization
* document extraction
* vector memory
* plan generation
* nutrition provider integration

## Phase 3 - Product Depth

* specialist logic
* care timeline enrichment
* audio playback summaries
* better reports

## Phase 4 - Predictive Extensions

* metabolic forecasting
* richer nutrition scoring
* longitudinal risk models

---

## 13. Final Recommendation

The correct repo-ready architecture for Diabetes Guardian is:

* **Expo + NativeWind + JavaScript** for the mobile app
* **Next.js App Router** for web and reporting surfaces
* **Supabase** for structured backend and storage
* **OpenAI Responses API + `gpt-5`** for structured reasoning and care-plan synthesis
* **Gemini `gemini-3-flash-preview`** for fast multimodal capture interpretation
* **Gemini `gemini-3.1-pro-preview`** for deeper multimodal reasoning when needed
* **Gemini `gemini-embedding-2-preview`** for unified patient memory embeddings
* **Pinecone** for semantic retrieval
* **OpenAI `gpt-4.1-mini`** for lightweight vision tasks
* **OpenAI `gpt-4o-transcribe` / `gpt-4o-transcribe-diarize`** for audio transcription
* **Gemini `gemini-2.5-flash-preview-tts`** for optional spoken summaries
* **Nutritionix API** with **FatSecret API** fallback for nutrition enrichment

### Final Rule

If a new feature does not strengthen **Capturar -> Entender -> Acompanar -> Mejorar**, it should not enter the core architecture.

---

## 14. Nutrition API Implementation Details

### 14.1 Provider Decision

| Factor | Nutritionix | FatSecret |
|---|---|---|
| Free tier | None (paid plans from ~$1,850/mo) | 5,000 calls/day free. Premier Free for startups/hackathon |
| Auth | Header-based (`x-app-id` + `x-app-key`) | OAuth 2.0 Bearer token; IP whitelist required |
| Natural language | Native (`POST /v2/natural/nutrients`) | Premier tier only |
| Best for | Production with budget | Hackathon and early builds |

**Hackathon decision:** Start with FatSecret free tier. Swap to Nutritionix via `NUTRITION_PROVIDER` env var when ready.

### 14.2 Nutritionix API

* **Base URL:** `https://trackapi.nutritionix.com/v2`
* **Auth:** Request headers `x-app-id` and `x-app-key`
* **Key endpoint:** `POST /v2/natural/nutrients` — parses natural language like `"2 eggs and toast"` into a structured `foods[]` array
* **Returns per food item:** `food_name`, `serving_qty`, `serving_unit`, `serving_weight_grams`, `nf_calories`, `nf_total_carbohydrate`, `nf_dietary_fiber`, `nf_sugars`, `nf_protein`, `nf_total_fat`, `nf_sodium`, `nf_potassium`
* **Register at:** developer.nutritionix.com

### 14.3 FatSecret Platform API

* **Auth token URL:** `POST https://oauth.fatsecret.com/connect/token`
  * HTTP Basic Auth with `clientId:clientSecret` base64-encoded
  * Body: `grant_type=client_credentials&scope=basic`
  * Returns `access_token` (Bearer)
* **API URL:** `POST https://platform.fatsecret.com/rest/server.api`
  * Always pass `format=json`
* **Key methods:** `foods.search` (keyword search), `food.get` (full nutrition by `food_id`)
* **IP whitelist:** Required for OAuth 2.0 — calls must go through backend (Supabase Edge Function or FastAPI), not mobile client directly
* **Response quirk:** All numeric values are strings — always `parseFloat()` before storing
* **Register at:** platform.fatsecret.com

### 14.4 Provider Abstraction Pattern

Implement a `NutritionProvider` interface with these three methods:

* `parseNaturalLanguage(query)` → `NutritionItem[]`
* `searchFoods(query)` → `{ id, name, description }[]`
* `getFoodById(foodId)` → `NutritionItem`

Normalize all provider responses into the same `NutritionItem` shape:

```javascript
{
  foodName, servingQty, servingUnit, servingWeightGrams,
  calories, totalFat, saturatedFat, cholesterol, sodium,
  totalCarbohydrate, dietaryFiber, sugars, protein, potassium,
  brandName, photoThumb
}
```

Switch providers with a single env var: `NUTRITION_PROVIDER=fatsecret` or `NUTRITION_PROVIDER=nutritionix`.

FatSecret does not have native NLP — bridge this by passing Claude's meal-analysis text output as structured food names to `searchFoods()` + `getFoodById()`.

---

## 15. Key API Implementation Notes

### 15.1 Gemini Files API

Use `client.files.upload()` when the total request size exceeds 20 MB (50 MB for PDFs).

* Files are stored for **48 hours** then auto-deleted
* **20 GB per project**, **2 GB per file** max
* Free to use in all regions where Gemini API is available
* Uploaded file returns a URI used in subsequent `generateContent` calls
* Supported audio: WAV, MP3, AIFF, AAC, OGG Vorbis, FLAC
* Audio is represented as **32 tokens per second** (1 min = 1,920 tokens; max 9.5 hours per prompt)

### 15.2 OpenAI Vision (`gpt-4.1-mini`)

Pass images via Responses API as:

* URL string
* Base64-encoded data URL (`data:image/jpeg;base64,...`)
* File ID (upload via `openai.files.create({ purpose: "vision" })` first)

Supported: PNG, JPEG, WEBP, non-animated GIF. Max 50 MB per request.

Use `detail: "low"` for fast triage, `detail: "high"` for extracting text from lab results or prescriptions.

### 15.3 OpenAI Structured Output (Care Plan JSON)

Use `text.format` with `json_schema` + `strict: true` via the Responses API.

In JavaScript, define the schema with Zod and pass via `zodTextFormat`. This guarantees the care plan JSON matches the expected schema without retries.

Example for care plan generation:

```javascript
const response = await openai.responses.parse({
  model: "gpt-5",
  input: [...],
  text: {
    format: zodTextFormat(CarePlanSchema, "care_plan"),
  },
})
```

### 15.4 Gemini TTS (`gemini-2.5-flash-preview-tts`)

Set `responseModalities: ['AUDIO']` and pass a `speechConfig` with `voiceConfig.prebuiltVoiceConfig.voiceName`.

Available voice options include: `Kore` (firm), `Puck` (upbeat), `Aoede` (breezy), `Sulafat` (warm).

Multi-speaker TTS is supported with up to 2 speakers using `multiSpeakerVoiceConfig`.

Output is raw PCM audio at 24,000 Hz — save as `.wav` or stream to the mobile client.

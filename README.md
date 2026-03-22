<div align="center">

# 🩺 Diabetes Guardian

### Your AI-powered diabetes companion — capture anything, remember everything.

*Turn everyday inputs (meals, doctor notes, voice notes, glucose readings) into personalized guidance, permanent memory, and early warnings.*

[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-0A0A0A?logo=apple)](https://expo.dev)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2053-4630EB?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.79-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini-Embedding%202-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o%20%2B%204.1--mini-412991?logo=openai&logoColor=white)](https://platform.openai.com)
[![Vercel](https://img.shields.io/badge/Web-Live%20on%20Vercel-000000?logo=vercel)](https://mobile-murex-delta.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-22C55E)](LICENSE)

---

**[🌐 Live Web Demo](https://mobile-murex-delta.vercel.app) · [📱 Run in Expo Go](#getting-started) · [🏗 Architecture](#architecture) · [🔑 Environment Variables](#environment-variables) · [🗺 Roadmap](#roadmap)**

</div>

---

## The Problem

Managing diabetes is a full-time job across multiple tools: paper logs, medication reminders, lab PDFs, dietary guesses, and disconnected apps. Most people forget 80% of what happened between doctor visits — and their doctor works with whatever the patient can recall.

**Diabetes Guardian fixes that.** It is a single AI-powered companion that captures everything — a meal photo, a voice note after a doctor visit, a lab result PDF — and builds a permanent, queryable clinical memory that travels with the patient.

---

## What It Does

| Feature | Description |
|---|---|
| 📸 **Meal Photo → AI Analysis** | Gemini Vision identifies the food, estimates macros (carbs, protein, fat, calories), and assesses glycemic spike risk. Falls back to OpenAI GPT-4.1-mini Vision on Gemini quota errors. |
| 🎙 **Voice Notes → Clinical Summary** | Records via expo-audio, transcribes with `gpt-4o-transcribe` (Spanish), then uses the OpenAI Responses API to extract symptoms, glucose values, medications, and follow-up actions — all in Spanish |
| 📄 **Document OCR → Structured Extraction** | Upload a lab PDF or prescription photo — Gemini Vision extracts key findings (HbA1c, glucose, cholesterol) and summarizes them in plain language |
| 💬 **Memory-Backed Q&A** | Ask anything — "¿Qué cambió desde mi última visita?" — and get answers grounded in your real medical history via RAG (Pinecone semantic search) |
| 🧠 **3-Brain AI Architecture** | Three specialized agents (Metabolic, Clinical, Memory) collaborate to provide guidance, not just storage |
| 🌐 **Web + Mobile** | Runs as a React Native app (Expo Go) on iOS/Android and as a full web app deployed to Vercel |
| 🔒 **Private Clinical History** | Everything is embedded into Pinecone (vector memory) and persisted in Supabase — fully per-patient, never mixed |

---

## Screens

The app has four main tabs:

| Tab | Screen | Description |
|---|---|---|
| **Inicio** | `HomeScreen.js` | Greeting, today's state, one priority action, Smart Capture entry, latest AI insight |
| **MiSalud** | `MiSaludScreen.js` | Health history, timeline of captures, glucose trends |
| **Asistente** | `AsistenteScreen.js` | AI chat with Smart Capture (photo, audio, document, text), memory-backed Q&A, rich capture result bubbles |
| **Plan** | `PlanScreen.js` | Care plan, medication schedule, upcoming actions |

Smart Capture (`captura.js`) is a hidden route launched from the Asistente tab.

---

## Architecture

```
User Input (photo / audio / document / text)
         │
         ▼
 ┌─────────────────────────────────────────────────┐
 │           Smart Capture Pipeline                │
 │  fileIngestionService.js                        │
 │  ├── Gemini Vision → food ID / doc OCR          │
 │  │   └── Fallback: OpenAI GPT-4.1-mini Vision   │
 │  ├── gpt-4o-transcribe → Spanish transcript     │
 │  │   └── Responses API → structured summary     │
 │  └── Gemini LLM → nutrition macros              │
 └─────────────────┬───────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │  Embedding Layer   │
         │  Gemini Embedding 2│
         │  768-dim MRL       │
         └─────────┬──────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
    ▼                             ▼
Pinecone                     Supabase
(vector memory)          (structured records)
patient namespace        capture_entries
                         memory_chunks
    │                             │
    └──────────┬──────────────────┘
               │
    ┌──────────▼──────────────────────────┐
    │        3-Brain Agent System         │
    │                                     │
    │  🔴 Metabolic Brain                 │
    │     meal risk · glucose context     │
    │                                     │
    │  🔵 Clinical Brain                  │
    │     lab extraction · doc summary    │
    │     audio transcript analysis       │
    │                                     │
    │  🟢 Memory Brain                    │
    │     RAG Q&A · "what changed?"       │
    └─────────────────────────────────────┘
               │
               ▼
    Guidance returned to user
    (recommendation + action + spike risk)
```

### Key Design Decisions

- **No backend server** — all AI calls happen directly from the mobile client via REST (Gemini, OpenAI, Pinecone). No Supabase Edge Functions in the critical path.
- **Audio bypass** — `processAudio()` calls OpenAI `gpt-4o-transcribe` directly, then the Responses API for structured clinical summary. The Supabase `audio-intake` Edge Function is no longer used (was failing JWT validation).
- **OpenAI vision fallback** — `embeddingService.describeImage()` tries Gemini Vision first; on quota errors (`RESOURCE_EXHAUSTED`) it automatically falls back to OpenAI GPT-4.1-mini Vision.
- **Web-safe animations** — all `Animated` calls use `useNativeDriver: Platform.OS !== 'web'` to avoid the silent no-op on React Native Web that left screens blank.
- **Picker guards** — `isPickingDocumentRef` / `isPickingImageRef` refs prevent concurrent DocumentPicker/ImagePicker calls that would throw a "different picking in progress" error.
- **Pinecone as vector memory** — each capture is embedded and upserted to the patient's namespace, making the entire history queryable via semantic search.
- **`EXPO_PUBLIC_*` vars** — Expo inlines these at build time; no backend proxy needed for the demo.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | Expo SDK 53 (React Native, JavaScript) + NativeWind |
| Web Deployment | Expo for Web (`expo export --platform web`) → Vercel |
| UI Icons | Lucide React Native |
| AI Vision & Embedding | Gemini 2.0 Flash + Gemini Embedding 2 Preview |
| Vision Fallback | OpenAI GPT-4.1-mini (image input via Responses API) |
| Audio Recording | expo-audio (`AudioModule`, `AudioRecorder`, `RecordingPresets.HIGH_QUALITY`) |
| Audio Transcription | OpenAI `gpt-4o-transcribe` (direct REST, Spanish) |
| Clinical Summaries | OpenAI Responses API (`gpt-4.1-mini`, structured JSON output) |
| AI Reasoning (Brains) | OpenAI GPT-4o |
| Vector Memory | Pinecone (REST API, per-patient namespaces) |
| Database & Auth | Supabase (Postgres + Auth + Storage) |
| Document OCR | Gemini Vision (inline base64) + JSZip (DOCX extraction) |
| Nutrition Estimation | Gemini LLM (clinical dietitian prompt) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- **Expo Go** app on your iOS or Android device ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- API keys for: Gemini, OpenAI, Pinecone, Supabase

### Install

```bash
git clone https://github.com/PatricRc/dIAbetes-app.git
cd dIAbetes-app/apps/mobile
npm install
```

### Configure Environment

```bash
cp .env.example .env
# Open .env and fill in your API keys
```

See [Environment Variables](#environment-variables) for the full list.

### Run on Mobile

```bash
npx expo start
# Scan the QR code with Expo Go on your phone
# If on a different network: npx expo start --tunnel
```

### Run on Web (local)

```bash
npx expo start --web
# Opens at http://localhost:8081
```

### Deploy to Vercel

```bash
cd apps/mobile
npx vercel --prod --yes
```

The `vercel.json` in `apps/mobile/` handles the build (`npm run build` → `expo export --platform web`) and SPA rewrites.

---

## Environment Variables

Copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in:

```env
# Gemini (Google AI Studio)
EXPO_PUBLIC_GEMINI_API_KEY=

# Pinecone
EXPO_PUBLIC_PINECONE_API_KEY=
EXPO_PUBLIC_PINECONE_INDEX_HOST=https://your-index.pinecone.io
EXPO_PUBLIC_PINECONE_INDEX_NAME=diabetes-guardian

# OpenAI (used for transcription, vision fallback, clinical summaries, and brain reasoning)
EXPO_PUBLIC_OPENAI_API_KEY=

# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_PROJECT_REF=

# Demo credentials (optional — for hackathon demo with seeded data)
EXPO_PUBLIC_SUPABASE_DEMO_EMAIL=
EXPO_PUBLIC_SUPABASE_DEMO_PASSWORD=
```

> **Security note:** `.env` is in `.gitignore` and is never committed. Only `.env.example` is tracked. Do not commit real API keys — GitHub Push Protection will block the push and require a history rewrite.

---

## Project Structure

```
dIAbetes-app/
├── apps/
│   └── mobile/                          # Expo React Native + Web app
│       ├── app/
│       │   ├── (tabs)/
│       │   │   ├── _layout.js            # Tab bar (Inicio, MiSalud, Asistente, Plan)
│       │   │   ├── index.js              # Inicio tab → HomeScreen
│       │   │   ├── historial.js          # MiSalud tab → MiSaludScreen
│       │   │   ├── asistente.js          # Asistente tab → AsistenteScreen
│       │   │   ├── perfil.js             # Plan tab → PlanScreen
│       │   │   └── captura.js            # Smart Capture (hidden route)
│       │   └── _layout.js
│       ├── src/
│       │   ├── screens/
│       │   │   ├── HomeScreen.js         # Greeting, today's state, capture entry
│       │   │   ├── AsistenteScreen.js    # AI chat + Smart Capture UI
│       │   │   ├── MiSaludScreen.js      # Health history + timeline
│       │   │   └── PlanScreen.js         # Care plan + medications
│       │   └── services/
│       │       ├── captureService.js          # Master orchestrator
│       │       ├── fileIngestionService.js    # Pre-processing per type (photo/audio/doc/text)
│       │       ├── embeddingService.js        # Gemini Embedding 2 + Vision (w/ OpenAI fallback)
│       │       ├── openaiResponsesService.js  # OpenAI Responses API (vision + structured JSON)
│       │       ├── audioRecordingService.js   # expo-audio recording + helpers
│       │       ├── pineconeService.js         # Vector upsert/query
│       │       ├── nutritionService.js        # LLM-based macro estimation
│       │       ├── assistantChatService.js    # Memory Brain Q&A
│       │       ├── config.js                  # EXPO_PUBLIC_* env vars
│       │       ├── supabaseClient.js
│       │       ├── patientSessionService.js
│       │       └── brains/
│       │           ├── metabolicBrain.js      # Meal/glucose analysis
│       │           ├── clinicalBrain.js       # Docs/transcripts
│       │           └── memoryBrain.js         # RAG Q&A
│       ├── vercel.json                  # Vercel web deployment config
│       ├── .env.example
│       └── app.json
├── supabase/
│   ├── migrations/                      # Database schema
│   └── seed.sql                         # Demo patient data
└── README.md
```

---

## Supabase Schema

The app uses two core tables:

**`capture_entries`** — every Smart Capture event (photo, audio, document, text)
**`memory_chunks`** — vector memory tracker linking Supabase records → Pinecone vectors

Run migrations:
```bash
npx supabase db push
# or apply migrations manually from supabase/migrations/
```

---

## Smart Capture Flow

```
1. User taps a capture card (photo / mic / document / note)
   ↓
2. Native picker opens (camera, file picker, microphone)
   ↓
3. fileIngestionService pre-processes:
   - Photo    → Gemini Vision (food ID) → Gemini LLM (macros)
               └── Fallback: OpenAI GPT-4.1-mini Vision
   - Audio    → OpenAI gpt-4o-transcribe (Spanish)
               → OpenAI Responses API → structured clinical summary
   - Document → Gemini Vision OCR / JSZip (DOCX)
   - Text     → keyword classification (glucose / meal / free text)
   ↓
4. Gemini Embedding 2 → 768-dim vector
   ↓
5. Pinecone upsert (namespace: patient-{id})
   Supabase insert (capture_entries + memory_chunks)
   ↓
6. Brain routing:
   - meal_photo  → Metabolic Brain → spike risk + recommendation
   - audio       → Clinical Brain  → symptom/medication summary
   - document    → Clinical Brain  → lab extraction + key findings
   - text        → plain guidance
   ↓
7. Result bubble appears in chat with full summary + key findings
```

---

## Known Behaviors & Fixes Applied

| Issue | Fix |
|---|---|
| Audio recording → "No se pudo validar la sesión de Supabase" | Replaced Supabase `audio-intake` Edge Function with direct OpenAI calls |
| Gemini Vision quota exceeded (`RESOURCE_EXHAUSTED`) | Added OpenAI GPT-4.1-mini as automatic vision fallback |
| All tab screens blank on web | Fixed `useNativeDriver: true` → `Platform.OS !== 'web'` in all screen entry animations |
| DocumentPicker "different picking in progress" crash | Added `isPickingDocumentRef` / `isPickingImageRef` guards in AsistenteScreen |
| `useBottomTabBarHeight()` throws on web | Wrapped in `useSafeTabBarHeight()` try/catch across all screens |

---

## Roadmap

**Hackathon MVP (built ✅)**
- Smart Capture: photo, audio, document, text
- Gemini Vision food identification + LLM macro estimation
- OpenAI `gpt-4o-transcribe` audio transcription → Spanish clinical summary (Responses API)
- OpenAI GPT-4.1-mini vision fallback for Gemini quota errors
- Gemini Embedding 2 + Pinecone vector memory
- 3-brain AI system (Metabolic, Clinical, Memory)
- Memory-backed Q&A in the Asistente chat
- Rich capture summary bubbles in chat after each upload
- Web deployment via Expo for Web + Vercel
- All four screens working on both mobile and web

**Post-Hackathon**
- [ ] Dexcom CGM live sync
- [ ] Glucose prediction (LSTM/Transformer on OhioT1DM dataset)
- [ ] Caregiver dashboard (Next.js web app)
- [ ] EAS Build → App Store / Play Store submission
- [ ] Push notification reminders (medications, glucose checks)
- [ ] OpenFDA medication safety lookup
- [ ] Full Auth hardening + Row Level Security audit
- [ ] Migrate AI calls from client-side to Supabase Edge Functions

---

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

*Capture anything. Remember everything. Live better.*

**Diabetes Guardian** · Built with Expo, Gemini, OpenAI & Pinecone

🌐 [Live Demo](https://mobile-murex-delta.vercel.app)

</div>

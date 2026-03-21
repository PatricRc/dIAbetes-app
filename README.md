<div align="center">

# 🩺 Diabetes Guardian

### Your AI-powered diabetes companion — capture anything, remember everything.

*Turn everyday inputs (meals, doctor notes, voice notes, glucose readings) into personalized guidance, permanent memory, and early warnings.*

[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-0A0A0A?logo=apple)](https://expo.dev)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2053-4630EB?logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.79-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini-Embedding%202-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/license-MIT-22C55E)](LICENSE)

---

**[📱 Run in Expo Go](#getting-started) · [🏗 Architecture](#architecture) · [🔑 Environment Variables](#environment-variables) · [🗺 Roadmap](#roadmap)**

</div>

---

## The Problem

Managing diabetes is a full-time job across multiple tools: paper logs, medication reminders, lab PDFs, dietary guesses, and disconnected apps. Most people forget 80% of what happened between doctor visits — and their doctor works with whatever the patient can recall.

**Diabetes Guardian fixes that.** It is a single AI-powered companion that captures everything — a meal photo, a voice note after a doctor visit, a lab result PDF — and builds a permanent, queryable clinical memory that travels with the patient.

---

## What It Does

| Feature | Description |
|---|---|
| 📸 **Meal Photo → AI Analysis** | Gemini Vision identifies the food, estimates macros (carbs, protein, fat, calories), and assesses glycemic spike risk |
| 🎙 **Voice Notes → Clinical Summary** | OpenAI transcribes your recording, the Clinical Brain extracts symptoms, glucose values, and medication changes |
| 📄 **Document OCR → Structured Extraction** | Upload a lab PDF or prescription photo — the app extracts key findings (HbA1c, glucose, cholesterol) and summarizes them in plain language |
| 💬 **Memory-Backed Q&A** | Ask anything — "What changed since my last visit?" — and get answers grounded in your real medical history via RAG |
| 🧠 **3-Brain AI Architecture** | Three specialized agents (Metabolic, Clinical, Memory) collaborate to provide guidance, not just storage |
| 🔒 **Private Clinical History** | Everything is embedded into Pinecone (vector memory) and persisted in Supabase — fully per-patient, never mixed |

---

## Architecture

```
User Input (photo / audio / document / text)
         │
         ▼
 ┌─────────────────────────────────────────┐
 │         Smart Capture Pipeline          │
 │  fileIngestionService.js                │
 │  ├── Gemini Vision  → food/doc OCR      │
 │  ├── OpenAI Whisper → audio transcript  │
 │  └── Gemini LLM    → nutrition macros   │
 └─────────────────┬───────────────────────┘
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
    │                    memory_chunks
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

- **No backend server** — all AI calls happen directly from the mobile client via REST (Gemini, OpenAI, Pinecone). Edge Functions are the post-hackathon migration path.
- **Pinecone as vector memory** — each capture is embedded and upserted to the patient's namespace, making the entire history queryable via semantic search.
- **Gemini LLM for nutrition** — replaces third-party nutrition APIs with a clinical dietitian prompt that estimates macros from the food description already extracted by Vision.
- **`EXPO_PUBLIC_*` vars** — Expo inlines these at build time; no backend proxy needed for the demo.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | Expo (React Native, JavaScript) + NativeWind |
| UI Icons | Lucide React Native |
| AI Vision & Embedding | Gemini 2.0 Flash + Gemini Embedding 2 Preview |
| Audio Transcription | OpenAI `gpt-4o-transcribe` |
| AI Reasoning (Brains) | OpenAI GPT-4o |
| Vector Memory | Pinecone (REST API) |
| Database & Auth | Supabase (Postgres + Auth) |
| Document OCR | Gemini Vision (inline base64) + JSZip (DOCX) |
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

### Run

```bash
npx expo start
# Scan the QR code with Expo Go on your phone
# If on a different network: npx expo start --tunnel
```

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

# OpenAI
EXPO_PUBLIC_OPENAI_API_KEY=

# Supabase
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_PROJECT_REF=

# Demo credentials (optional — for hackathon demo with seeded data)
EXPO_PUBLIC_SUPABASE_DEMO_EMAIL=
EXPO_PUBLIC_SUPABASE_DEMO_PASSWORD=
```

> **Security note:** `.env` is in `.gitignore` and is never committed. Only `.env.example` is tracked.

---

## Project Structure

```
dIAbetes-app/
├── apps/
│   └── mobile/                    # Expo React Native app
│       ├── app/
│       │   ├── (tabs)/
│       │   │   ├── index.js        # Home screen
│       │   │   ├── captura.js      # Smart Capture tab
│       │   │   └── asistente.js    # AI Assistant tab
│       │   └── _layout.js
│       ├── src/
│       │   ├── screens/
│       │   │   ├── HomeScreen.js
│       │   │   └── AsistenteScreen.js
│       │   └── services/
│       │       ├── captureService.js        # Master orchestrator
│       │       ├── fileIngestionService.js  # Pre-processing per type
│       │       ├── embeddingService.js      # Gemini embeddings + Vision
│       │       ├── pineconeService.js       # Vector upsert/query
│       │       ├── nutritionService.js      # LLM-based macro estimation
│       │       ├── supabaseClient.js
│       │       ├── patientSessionService.js
│       │       ├── audioRecordingService.js
│       │       └── brains/
│       │           ├── metabolicBrain.js    # Meal/glucose analysis
│       │           ├── clinicalBrain.js     # Docs/transcripts
│       │           └── memoryBrain.js       # RAG Q&A
│       ├── .env.example
│       └── app.json
├── supabase/
│   ├── migrations/                # Database schema
│   └── seed.sql                   # Demo patient data
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
   - Audio    → OpenAI gpt-4o-transcribe
   - Document → Gemini OCR / JSZip (DOCX)
   - Text     → keyword classification
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
   - text        → Memory Brain context → plain confirmation
   ↓
7. Result bubble appears in chat with full summary
```

---

## Roadmap

**Hackathon MVP (built ✅)**
- Smart Capture: photo, audio, document, text
- Gemini Vision food identification + LLM macro estimation
- OpenAI audio transcription → clinical summary
- Gemini Embedding 2 + Pinecone vector memory
- 3-brain AI system (Metabolic, Clinical, Memory)
- Memory-backed Q&A in the Asistente chat
- Rich capture summary bubbles in chat after each upload

**Post-Hackathon**
- [ ] Dexcom CGM live sync
- [ ] Glucose prediction (LSTM/Transformer on OhioT1DM dataset)
- [ ] Caregiver dashboard (Next.js web app → Vercel)
- [ ] EAS Build → App Store / Play Store submission
- [ ] Push notification reminders (medications, glucose checks)
- [ ] OpenFDA medication safety lookup
- [ ] Full Auth hardening + Row Level Security audit

---

## Team

Built with ❤️ for [hackathon name] by **PatricRc**.

---

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

*Capture anything. Remember everything. Live better.*

**Diabetes Guardian** · Built with Expo, Gemini, OpenAI & Pinecone

</div>

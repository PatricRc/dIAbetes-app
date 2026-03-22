# Supabase Bootstrap

## Local development

Start the local stack:

```bash
supabase start
```

Reset the database and reapply migrations:

```bash
supabase db reset
```

Inspect connection details:

```bash
supabase status
```

## Remote project creation with CLI

Project creation is blocked until a personal access token is available. Once you have it:

```bash
supabase login
supabase orgs list
supabase projects create diabetes-guardian --org-id <ORG_ID> --db-password <STRONG_DB_PASSWORD> --region us-east-1
supabase link --project-ref <PROJECT_REF>
supabase db push
```

## Required secrets for the next backend phases

Set these after linking the remote project:

```bash
supabase secrets set \
  OPENAI_API_KEY=... \
  GEMINI_API_KEY=... \
  PINECONE_API_KEY=... \
  PINECONE_HOST=... \
  PINECONE_INDEX=... \
  FATSECRET_CLIENT_ID=... \
  FATSECRET_CLIENT_SECRET=... \
  NUTRITIONIX_APP_ID=... \
  NUTRITIONIX_APP_KEY=...
```

Deploy the audio transcription Edge Function after setting the secrets:

```bash
supabase functions deploy audio-intake
```

Optional model overrides for the function:

```bash
supabase secrets set \
  OPENAI_TRANSCRIPTION_MODEL=gpt-4o-transcribe \
  OPENAI_REASONING_MODEL=gpt-4o
```

## Storage path convention

All protected uploads should use this object key shape so the storage RLS policies can resolve patient ownership:

```text
patients/{patient_id}/documents/{filename}
patients/{patient_id}/images/{filename}
patients/{patient_id}/audio/{filename}
patients/{patient_id}/exports/{filename}
```

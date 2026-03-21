create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('patient', 'caregiver', 'clinician', 'admin');
create type public.patient_membership_role as enum ('owner', 'caregiver', 'clinician', 'viewer');
create type public.diabetes_type as enum ('type_1', 'type_2', 'gestational', 'prediabetes', 'other', 'unknown');
create type public.symptom_severity as enum ('none', 'mild', 'moderate', 'severe', 'critical');
create type public.medication_event_status as enum ('taken', 'missed', 'skipped', 'delayed', 'adjusted', 'stopped');
create type public.file_kind as enum ('document', 'image', 'audio', 'other');
create type public.processing_status as enum ('pending', 'processing', 'completed', 'failed', 'not_required');
create type public.job_status as enum ('pending', 'processing', 'completed', 'failed');
create type public.capture_input_type as enum ('text', 'photo', 'document', 'audio');
create type public.specialist_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.timeline_event_type as enum (
  'capture_logged',
  'symptom_logged',
  'medication_plan_updated',
  'medication_event_logged',
  'document_uploaded',
  'document_extracted',
  'audio_uploaded',
  'audio_transcribed',
  'lab_recorded',
  'nutrition_logged',
  'specialist_suggested',
  'care_plan_generated',
  'assistant_output',
  'timeline_note'
);
create type public.ai_output_type as enum (
  'assistant_answer',
  'what_changed',
  'doctor_prep',
  'care_plan',
  'document_summary',
  'transcript_summary',
  'specialist_recommendation',
  'daily_summary',
  'other'
);
create type public.memory_source_type as enum (
  'capture_entry',
  'timeline_event',
  'document',
  'document_extraction',
  'transcript',
  'care_plan',
  'ai_output'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, role)
  values (new.id, new.email, 'patient')
  on conflict (user_id) do update
    set email = excluded.email,
        updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.handle_new_patient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.patient_memberships (patient_id, user_id, role)
  values (new.id, new.owner_user_id, 'owner')
  on conflict (patient_id, user_id) do nothing;

  return new;
end;
$$;

create or replace function public.storage_patient_id(object_name text)
returns uuid
language plpgsql
stable
as $$
declare
  patient_segment text;
begin
  if split_part(object_name, '/', 1) <> 'patients' then
    return null;
  end if;

  patient_segment := split_part(object_name, '/', 2);

  if patient_segment is null or patient_segment = '' then
    return null;
  end if;

  begin
    return patient_segment::uuid;
  exception
    when invalid_text_representation then
      return null;
  end;
end;
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  preferred_name text,
  avatar_url text,
  role public.app_role not null default 'patient',
  locale text not null default 'es-PE',
  timezone text not null default 'America/Lima',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  diabetes_type public.diabetes_type not null default 'unknown',
  age_band text,
  birth_year integer,
  diagnosis_year integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint patients_birth_year_check
    check (birth_year is null or birth_year between 1900 and extract(year from now())::integer),
  constraint patients_diagnosis_year_check
    check (diagnosis_year is null or diagnosis_year between 1900 and extract(year from now())::integer)
);

create table public.patient_memberships (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.patient_membership_role not null default 'viewer',
  created_at timestamptz not null default timezone('utc', now()),
  unique (patient_id, user_id)
);

create table public.capture_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  input_type public.capture_input_type not null,
  source_text text,
  media_bucket text,
  media_path text,
  media_mime_type text,
  status public.processing_status not null default 'pending',
  classified_as text,
  classification_json jsonb not null default '{}'::jsonb,
  extraction_json jsonb not null default '{}'::jsonb,
  notes text,
  captured_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint capture_entries_payload_check
    check (
      source_text is not null
      or (media_bucket is not null and media_path is not null)
    )
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  capture_entry_id uuid references public.capture_entries(id) on delete set null,
  storage_bucket text not null default 'documents',
  storage_path text not null,
  file_kind public.file_kind not null default 'document',
  file_type text,
  mime_type text,
  original_name text not null,
  checksum_sha256 text,
  uploaded_at timestamptz not null default timezone('utc', now()),
  parse_status public.processing_status not null default 'pending',
  extraction_status public.processing_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  unique (storage_bucket, storage_path)
);

create table public.audio_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  capture_entry_id uuid references public.capture_entries(id) on delete set null,
  storage_bucket text not null default 'audio',
  storage_path text not null,
  original_name text not null,
  mime_type text,
  duration_seconds integer,
  uploaded_at timestamptz not null default timezone('utc', now()),
  transcribe_status public.processing_status not null default 'pending',
  summary_status public.processing_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  unique (storage_bucket, storage_path),
  constraint audio_notes_duration_check
    check (duration_seconds is null or duration_seconds >= 0)
);

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  audio_note_id uuid not null unique references public.audio_notes(id) on delete cascade,
  transcript_text text not null,
  diarized_json jsonb not null default '{}'::jsonb,
  summary_text text,
  language_code text,
  transcribed_with text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  source_document_id uuid references public.documents(id) on delete set null,
  name text not null,
  dosage text,
  dosage_unit text,
  route text,
  schedule_text text,
  instructions text,
  active boolean not null default true,
  started_at date,
  ended_at date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint medications_date_range_check
    check (ended_at is null or started_at is null or ended_at >= started_at)
);

create table public.symptoms (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  capture_entry_id uuid references public.capture_entries(id) on delete set null,
  symptom_name text not null,
  severity public.symptom_severity not null default 'mild',
  body_area text,
  notes text,
  onset_at timestamptz,
  resolved_at timestamptz,
  logged_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint symptoms_time_range_check
    check (resolved_at is null or onset_at is null or resolved_at >= onset_at)
);

create table public.medication_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  capture_entry_id uuid references public.capture_entries(id) on delete set null,
  status public.medication_event_status not null,
  dose_taken text,
  notes text,
  logged_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  extraction_type text not null,
  extraction_status public.processing_status not null default 'pending',
  structured_json jsonb not null default '{}'::jsonb,
  summary_text text,
  extraction_model text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.labs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  source_document_id uuid references public.documents(id) on delete set null,
  lab_name text not null,
  panel_name text,
  value_text text,
  numeric_value numeric,
  unit text,
  reference_range text,
  interpretation text,
  observed_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.nutrition_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  source_type text not null,
  source_record_id uuid,
  provider text not null,
  meal_label text,
  normalized_json jsonb not null default '{}'::jsonb,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.specialist_suggestions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  specialist_type text not null,
  rationale text not null,
  priority public.specialist_priority not null default 'medium',
  supporting_evidence jsonb not null default '[]'::jsonb,
  suggested_action text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.care_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  version integer not null default 1,
  active boolean not null default true,
  status_json jsonb not null default '{}'::jsonb,
  priorities_json jsonb not null default '[]'::jsonb,
  weekly_actions_json jsonb not null default '[]'::jsonb,
  goals_json jsonb not null default '[]'::jsonb,
  evidence_json jsonb not null default '[]'::jsonb,
  generated_from text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint care_plans_version_check check (version > 0)
);

create table public.care_tasks (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  care_plan_id uuid references public.care_plans(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'pending',
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  event_type public.timeline_event_type not null,
  linked_table text,
  linked_record_id uuid,
  summary_text text not null,
  event_at timestamptz not null,
  display_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.ai_outputs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  output_type public.ai_output_type not null,
  input_reference jsonb not null default '{}'::jsonb,
  model_provider text,
  model_name text,
  structured_json jsonb not null default '{}'::jsonb,
  summary_text text,
  citations_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  job_type text not null,
  status public.job_status not null default 'pending',
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  error_json jsonb not null default '{}'::jsonb,
  run_at timestamptz not null default timezone('utc', now()),
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  locked_at timestamptz,
  locked_by text,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint jobs_attempt_bounds check (attempts >= 0 and max_attempts > 0)
);

create table public.memory_chunks (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  source_type public.memory_source_type not null,
  source_table text not null,
  source_record_id uuid not null,
  content_kind text not null,
  chunk_index integer not null default 0,
  content_text text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  embedding_provider text not null default 'gemini',
  embedding_model text not null default 'gemini-embedding-2-preview',
  pinecone_namespace text,
  pinecone_record_id text,
  sync_status public.processing_status not null default 'pending',
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (source_table, source_record_id, content_kind, chunk_index),
  unique (pinecone_record_id),
  constraint memory_chunks_index_check check (chunk_index >= 0)
);

create index patients_owner_user_id_idx on public.patients (owner_user_id);
create index patient_memberships_user_id_idx on public.patient_memberships (user_id);
create index capture_entries_patient_captured_at_idx on public.capture_entries (patient_id, captured_at desc);
create index documents_patient_uploaded_at_idx on public.documents (patient_id, uploaded_at desc);
create index audio_notes_patient_uploaded_at_idx on public.audio_notes (patient_id, uploaded_at desc);
create index transcripts_patient_created_at_idx on public.transcripts (patient_id, created_at desc);
create index medications_patient_active_idx on public.medications (patient_id, active);
create index symptoms_patient_logged_at_idx on public.symptoms (patient_id, logged_at desc);
create index medication_events_patient_logged_at_idx on public.medication_events (patient_id, logged_at desc);
create index medication_events_medication_logged_at_idx on public.medication_events (medication_id, logged_at desc);
create index document_extractions_document_created_at_idx on public.document_extractions (document_id, created_at desc);
create index labs_patient_observed_at_idx on public.labs (patient_id, observed_at desc);
create index nutrition_events_patient_consumed_at_idx on public.nutrition_events (patient_id, consumed_at desc nulls last);
create index specialist_suggestions_patient_created_at_idx on public.specialist_suggestions (patient_id, created_at desc);
create index care_plans_patient_created_at_idx on public.care_plans (patient_id, created_at desc);
create unique index care_plans_one_active_per_patient_idx on public.care_plans (patient_id) where active;
create index care_tasks_patient_due_at_idx on public.care_tasks (patient_id, due_at desc nulls last);
create index timeline_events_patient_event_at_idx on public.timeline_events (patient_id, event_at desc);
create index ai_outputs_patient_created_at_idx on public.ai_outputs (patient_id, created_at desc);
create index jobs_status_run_at_idx on public.jobs (status, run_at);
create index jobs_patient_created_at_idx on public.jobs (patient_id, created_at desc);
create index memory_chunks_patient_source_idx on public.memory_chunks (patient_id, source_type, source_record_id);
create index memory_chunks_sync_status_idx on public.memory_chunks (sync_status, last_synced_at);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_patients_updated_at
before update on public.patients
for each row
execute function public.set_updated_at();

create trigger set_capture_entries_updated_at
before update on public.capture_entries
for each row
execute function public.set_updated_at();

create trigger set_transcripts_updated_at
before update on public.transcripts
for each row
execute function public.set_updated_at();

create trigger set_medications_updated_at
before update on public.medications
for each row
execute function public.set_updated_at();

create trigger set_symptoms_updated_at
before update on public.symptoms
for each row
execute function public.set_updated_at();

create trigger set_medication_events_updated_at
before update on public.medication_events
for each row
execute function public.set_updated_at();

create trigger set_document_extractions_updated_at
before update on public.document_extractions
for each row
execute function public.set_updated_at();

create trigger set_labs_updated_at
before update on public.labs
for each row
execute function public.set_updated_at();

create trigger set_nutrition_events_updated_at
before update on public.nutrition_events
for each row
execute function public.set_updated_at();

create trigger set_specialist_suggestions_updated_at
before update on public.specialist_suggestions
for each row
execute function public.set_updated_at();

create trigger set_care_plans_updated_at
before update on public.care_plans
for each row
execute function public.set_updated_at();

create trigger set_care_tasks_updated_at
before update on public.care_tasks
for each row
execute function public.set_updated_at();

create trigger set_jobs_updated_at
before update on public.jobs
for each row
execute function public.set_updated_at();

create trigger set_memory_chunks_updated_at
before update on public.memory_chunks
for each row
execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create trigger on_patient_created
after insert on public.patients
for each row
execute function public.handle_new_patient();

create or replace function public.is_patient_member(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patients p
    left join public.patient_memberships pm
      on pm.patient_id = p.id
     and pm.user_id = auth.uid()
    where p.id = target_patient_id
      and (p.owner_user_id = auth.uid() or pm.user_id is not null)
  );
$$;

create or replace function public.can_manage_patient(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patients p
    left join public.patient_memberships pm
      on pm.patient_id = p.id
     and pm.user_id = auth.uid()
    where p.id = target_patient_id
      and (
        p.owner_user_id = auth.uid()
        or pm.role in ('owner', 'caregiver', 'clinician')
      )
  );
$$;

create or replace function public.can_access_storage_object(bucket_id text, object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    bucket_id in ('documents', 'images', 'audio', 'exports')
    and public.is_patient_member(public.storage_patient_id(object_name));
$$;

create or replace function public.can_manage_storage_object(bucket_id text, object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    bucket_id in ('documents', 'images', 'audio', 'exports')
    and public.can_manage_patient(public.storage_patient_id(object_name));
$$;

grant execute on function public.is_patient_member(uuid) to authenticated;
grant execute on function public.can_manage_patient(uuid) to authenticated;
grant execute on function public.can_access_storage_object(text, text) to authenticated;
grant execute on function public.can_manage_storage_object(text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.patient_memberships enable row level security;
alter table public.capture_entries enable row level security;
alter table public.documents enable row level security;
alter table public.audio_notes enable row level security;
alter table public.transcripts enable row level security;
alter table public.medications enable row level security;
alter table public.symptoms enable row level security;
alter table public.medication_events enable row level security;
alter table public.document_extractions enable row level security;
alter table public.labs enable row level security;
alter table public.nutrition_events enable row level security;
alter table public.specialist_suggestions enable row level security;
alter table public.care_plans enable row level security;
alter table public.care_tasks enable row level security;
alter table public.timeline_events enable row level security;
alter table public.ai_outputs enable row level security;
alter table public.jobs enable row level security;
alter table public.memory_chunks enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "patients_select_member"
on public.patients
for select
to authenticated
using (public.is_patient_member(id));

create policy "patients_insert_owner"
on public.patients
for insert
to authenticated
with check (owner_user_id = auth.uid());

create policy "patients_update_manager"
on public.patients
for update
to authenticated
using (public.can_manage_patient(id))
with check (public.can_manage_patient(id));

create policy "patient_memberships_select_member"
on public.patient_memberships
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "patient_memberships_insert_manager"
on public.patient_memberships
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "patient_memberships_update_manager"
on public.patient_memberships
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "patient_memberships_delete_manager"
on public.patient_memberships
for delete
to authenticated
using (public.can_manage_patient(patient_id));

create policy "capture_entries_select_member"
on public.capture_entries
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "capture_entries_insert_manager"
on public.capture_entries
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "capture_entries_update_manager"
on public.capture_entries
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "documents_select_member"
on public.documents
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "documents_insert_manager"
on public.documents
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "documents_update_manager"
on public.documents
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "audio_notes_select_member"
on public.audio_notes
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "audio_notes_insert_manager"
on public.audio_notes
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "audio_notes_update_manager"
on public.audio_notes
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "transcripts_select_member"
on public.transcripts
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "transcripts_insert_manager"
on public.transcripts
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "transcripts_update_manager"
on public.transcripts
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "medications_select_member"
on public.medications
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "medications_insert_manager"
on public.medications
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "medications_update_manager"
on public.medications
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "symptoms_select_member"
on public.symptoms
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "symptoms_insert_manager"
on public.symptoms
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "symptoms_update_manager"
on public.symptoms
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "medication_events_select_member"
on public.medication_events
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "medication_events_insert_manager"
on public.medication_events
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "medication_events_update_manager"
on public.medication_events
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "document_extractions_select_member"
on public.document_extractions
for select
to authenticated
using (
  exists (
    select 1
    from public.documents d
    where d.id = document_id
      and public.is_patient_member(d.patient_id)
  )
);

create policy "document_extractions_insert_manager"
on public.document_extractions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.documents d
    where d.id = document_id
      and public.can_manage_patient(d.patient_id)
  )
);

create policy "document_extractions_update_manager"
on public.document_extractions
for update
to authenticated
using (
  exists (
    select 1
    from public.documents d
    where d.id = document_id
      and public.can_manage_patient(d.patient_id)
  )
)
with check (
  exists (
    select 1
    from public.documents d
    where d.id = document_id
      and public.can_manage_patient(d.patient_id)
  )
);

create policy "labs_select_member"
on public.labs
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "labs_insert_manager"
on public.labs
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "labs_update_manager"
on public.labs
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "nutrition_events_select_member"
on public.nutrition_events
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "nutrition_events_insert_manager"
on public.nutrition_events
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "nutrition_events_update_manager"
on public.nutrition_events
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "specialist_suggestions_select_member"
on public.specialist_suggestions
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "specialist_suggestions_insert_manager"
on public.specialist_suggestions
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "specialist_suggestions_update_manager"
on public.specialist_suggestions
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "care_plans_select_member"
on public.care_plans
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "care_plans_insert_manager"
on public.care_plans
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "care_plans_update_manager"
on public.care_plans
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "care_tasks_select_member"
on public.care_tasks
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "care_tasks_insert_manager"
on public.care_tasks
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "care_tasks_update_manager"
on public.care_tasks
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "timeline_events_select_member"
on public.timeline_events
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "timeline_events_insert_manager"
on public.timeline_events
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "timeline_events_update_manager"
on public.timeline_events
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "ai_outputs_select_member"
on public.ai_outputs
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "ai_outputs_insert_manager"
on public.ai_outputs
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "jobs_select_member"
on public.jobs
for select
to authenticated
using (patient_id is not null and public.is_patient_member(patient_id));

create policy "jobs_insert_manager"
on public.jobs
for insert
to authenticated
with check (patient_id is not null and public.can_manage_patient(patient_id));

create policy "jobs_update_manager"
on public.jobs
for update
to authenticated
using (patient_id is not null and public.can_manage_patient(patient_id))
with check (patient_id is not null and public.can_manage_patient(patient_id));

create policy "memory_chunks_select_member"
on public.memory_chunks
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "memory_chunks_insert_manager"
on public.memory_chunks
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "memory_chunks_update_manager"
on public.memory_chunks
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'documents',
    'documents',
    false,
    52428800,
    array[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  ),
  (
    'images',
    'images',
    false,
    52428800,
    array[
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  ),
  (
    'audio',
    'audio',
    false,
    104857600,
    array[
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/wav',
      'audio/x-wav',
      'audio/aac',
      'audio/flac',
      'audio/ogg'
    ]
  ),
  (
    'exports',
    'exports',
    false,
    52428800,
    null
  )
on conflict (id) do nothing;

create policy "storage_select_patient_member"
on storage.objects
for select
to authenticated
using (public.can_access_storage_object(bucket_id, name));

create policy "storage_insert_patient_manager"
on storage.objects
for insert
to authenticated
with check (public.can_manage_storage_object(bucket_id, name));

create policy "storage_update_patient_manager"
on storage.objects
for update
to authenticated
using (public.can_manage_storage_object(bucket_id, name))
with check (public.can_manage_storage_object(bucket_id, name));

create policy "storage_delete_patient_manager"
on storage.objects
for delete
to authenticated
using (public.can_manage_storage_object(bucket_id, name));

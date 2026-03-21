create type public.appointment_status as enum (
  'scheduled',
  'completed',
  'cancelled',
  'missed',
  'rescheduled'
);

create type public.assistant_message_role as enum (
  'user',
  'assistant',
  'system'
);

create type public.glucose_measurement_context as enum (
  'fasting',
  'pre_meal',
  'post_meal',
  'bedtime',
  'random',
  'other'
);

alter type public.timeline_event_type add value if not exists 'glucose_logged';
alter type public.timeline_event_type add value if not exists 'appointment_scheduled';
alter type public.timeline_event_type add value if not exists 'appointment_completed';
alter type public.timeline_event_type add value if not exists 'assistant_message';

alter type public.memory_source_type add value if not exists 'glucose_reading';
alter type public.memory_source_type add value if not exists 'appointment';
alter type public.memory_source_type add value if not exists 'assistant_message';

create table public.glucose_readings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  capture_entry_id uuid references public.capture_entries(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  value_mg_dl numeric(6, 2) not null,
  measurement_context public.glucose_measurement_context not null default 'random',
  source_type text not null default 'manual',
  source_device text,
  measured_at timestamptz not null default timezone('utc', now()),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint glucose_readings_value_check check (value_mg_dl > 0 and value_mg_dl < 1000)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  specialist_suggestion_id uuid references public.specialist_suggestions(id) on delete set null,
  clinician_name text,
  specialty text not null,
  appointment_type text,
  location_text text,
  scheduled_for timestamptz not null,
  ends_at timestamptz,
  status public.appointment_status not null default 'scheduled',
  prep_status public.processing_status not null default 'not_required',
  doctor_prep_output_id uuid references public.ai_outputs(id) on delete set null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint appointments_time_range_check
    check (ends_at is null or ends_at >= scheduled_for)
);

create table public.assistant_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text,
  last_activity_at timestamptz not null default timezone('utc', now()),
  last_user_message_at timestamptz,
  last_assistant_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assistant_sessions(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  role public.assistant_message_role not null,
  input_type public.capture_input_type,
  content_text text not null,
  content_json jsonb not null default '{}'::jsonb,
  attachments_json jsonb not null default '[]'::jsonb,
  citations_json jsonb not null default '[]'::jsonb,
  follow_ups_json jsonb not null default '[]'::jsonb,
  trace_id text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.specialist_suggestions
  add column if not exists timeframe_text text,
  add column if not exists suggested_due_at timestamptz,
  add column if not exists action_label text,
  add column if not exists action_route text,
  add column if not exists source_table text,
  add column if not exists source_record_id uuid,
  add column if not exists status text not null default 'suggested';

alter table public.care_tasks
  add column if not exists group_key text not null default 'general',
  add column if not exists urgent boolean not null default false,
  add column if not exists source_kind text not null default 'care_plan',
  add column if not exists sort_order integer not null default 0,
  add column if not exists action_route text;

alter table public.care_plans
  add column if not exists summary_text text,
  add column if not exists top_priority_text text,
  add column if not exists coverage_start_at timestamptz,
  add column if not exists coverage_end_at timestamptz,
  add column if not exists share_payload_json jsonb not null default '{}'::jsonb;

create index glucose_readings_patient_measured_at_idx
  on public.glucose_readings (patient_id, measured_at desc);

create index glucose_readings_patient_context_idx
  on public.glucose_readings (patient_id, measurement_context, measured_at desc);

create index appointments_patient_scheduled_for_idx
  on public.appointments (patient_id, scheduled_for desc);

create index appointments_status_scheduled_for_idx
  on public.appointments (status, scheduled_for desc);

create index assistant_sessions_patient_last_activity_idx
  on public.assistant_sessions (patient_id, last_activity_at desc);

create index assistant_messages_session_created_at_idx
  on public.assistant_messages (session_id, created_at asc);

create index assistant_messages_patient_created_at_idx
  on public.assistant_messages (patient_id, created_at desc);

create index specialist_suggestions_patient_status_idx
  on public.specialist_suggestions (patient_id, status, suggested_due_at desc nulls last);

create index care_tasks_patient_group_due_idx
  on public.care_tasks (patient_id, group_key, due_at desc nulls last);

create trigger set_glucose_readings_updated_at
before update on public.glucose_readings
for each row
execute function public.set_updated_at();

create trigger set_appointments_updated_at
before update on public.appointments
for each row
execute function public.set_updated_at();

create trigger set_assistant_sessions_updated_at
before update on public.assistant_sessions
for each row
execute function public.set_updated_at();

alter table public.glucose_readings enable row level security;
alter table public.appointments enable row level security;
alter table public.assistant_sessions enable row level security;
alter table public.assistant_messages enable row level security;

create policy "glucose_readings_select_member"
on public.glucose_readings
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "glucose_readings_insert_manager"
on public.glucose_readings
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "glucose_readings_update_manager"
on public.glucose_readings
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "appointments_select_member"
on public.appointments
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "appointments_insert_manager"
on public.appointments
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "appointments_update_manager"
on public.appointments
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "assistant_sessions_select_member"
on public.assistant_sessions
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "assistant_sessions_insert_manager"
on public.assistant_sessions
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "assistant_sessions_update_manager"
on public.assistant_sessions
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "assistant_messages_select_member"
on public.assistant_messages
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "assistant_messages_insert_manager"
on public.assistant_messages
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "assistant_messages_update_manager"
on public.assistant_messages
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

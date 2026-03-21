create type public.activity_intensity as enum (
  'low',
  'moderate',
  'high',
  'unknown'
);

alter type public.timeline_event_type add value if not exists 'journal_entry_logged';
alter type public.timeline_event_type add value if not exists 'activity_logged';
alter type public.timeline_event_type add value if not exists 'meal_logged';

alter type public.memory_source_type add value if not exists 'journal_entry';
alter type public.memory_source_type add value if not exists 'activity_event';
alter type public.memory_source_type add value if not exists 'nutrition_event';

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  capture_entry_id uuid references public.capture_entries(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  title text,
  entry_text text not null,
  logged_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  capture_entry_id uuid references public.capture_entries(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  activity_name text not null,
  duration_minutes integer,
  intensity public.activity_intensity not null default 'unknown',
  calories_burned integer,
  occurred_at timestamptz not null default timezone('utc', now()),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint activity_events_duration_check
    check (duration_minutes is null or duration_minutes >= 0),
  constraint activity_events_calories_check
    check (calories_burned is null or calories_burned >= 0)
);

alter table public.nutrition_events
  add column if not exists capture_entry_id uuid references public.capture_entries(id) on delete set null,
  add column if not exists title text,
  add column if not exists notes text,
  add column if not exists logged_at timestamptz not null default timezone('utc', now()),
  add column if not exists confidence_score numeric(4, 3),
  add column if not exists meal_type text;

create index journal_entries_patient_logged_at_idx
  on public.journal_entries (patient_id, logged_at desc);

create index activity_events_patient_occurred_at_idx
  on public.activity_events (patient_id, occurred_at desc);

create index nutrition_events_patient_logged_at_idx
  on public.nutrition_events (patient_id, logged_at desc);

create index nutrition_events_capture_entry_id_idx
  on public.nutrition_events (capture_entry_id);

create trigger set_journal_entries_updated_at
before update on public.journal_entries
for each row
execute function public.set_updated_at();

create trigger set_activity_events_updated_at
before update on public.activity_events
for each row
execute function public.set_updated_at();

alter table public.journal_entries enable row level security;
alter table public.activity_events enable row level security;

create policy "journal_entries_select_member"
on public.journal_entries
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "journal_entries_insert_manager"
on public.journal_entries
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "journal_entries_update_manager"
on public.journal_entries
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

create policy "activity_events_select_member"
on public.activity_events
for select
to authenticated
using (public.is_patient_member(patient_id));

create policy "activity_events_insert_manager"
on public.activity_events
for insert
to authenticated
with check (public.can_manage_patient(patient_id));

create policy "activity_events_update_manager"
on public.activity_events
for update
to authenticated
using (public.can_manage_patient(patient_id))
with check (public.can_manage_patient(patient_id));

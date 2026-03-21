create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.storage_patient_id(object_name text)
returns uuid
language plpgsql
stable
set search_path = public
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

create index if not exists appointments_created_by_idx
  on public.appointments (created_by);

create index if not exists appointments_specialist_suggestion_id_idx
  on public.appointments (specialist_suggestion_id);

create index if not exists appointments_doctor_prep_output_id_idx
  on public.appointments (doctor_prep_output_id);

create index if not exists assistant_sessions_created_by_idx
  on public.assistant_sessions (created_by);

create index if not exists glucose_readings_capture_entry_id_idx
  on public.glucose_readings (capture_entry_id);

create index if not exists glucose_readings_created_by_idx
  on public.glucose_readings (created_by);

create index if not exists audio_notes_capture_entry_id_idx
  on public.audio_notes (capture_entry_id);

create index if not exists capture_entries_created_by_idx
  on public.capture_entries (created_by);

create index if not exists care_tasks_care_plan_id_idx
  on public.care_tasks (care_plan_id);

create index if not exists documents_capture_entry_id_idx
  on public.documents (capture_entry_id);

create index if not exists labs_source_document_id_idx
  on public.labs (source_document_id);

create index if not exists medication_events_capture_entry_id_idx
  on public.medication_events (capture_entry_id);

create index if not exists medications_source_document_id_idx
  on public.medications (source_document_id);

create index if not exists symptoms_capture_entry_id_idx
  on public.symptoms (capture_entry_id);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "patients_insert_owner" on public.patients;
create policy "patients_insert_owner"
on public.patients
for insert
to authenticated
with check (owner_user_id = (select auth.uid()));

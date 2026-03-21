create index if not exists journal_entries_capture_entry_id_idx
  on public.journal_entries (capture_entry_id);

create index if not exists journal_entries_created_by_idx
  on public.journal_entries (created_by);

create index if not exists activity_events_capture_entry_id_idx
  on public.activity_events (capture_entry_id);

create index if not exists activity_events_created_by_idx
  on public.activity_events (created_by);

-- 0005 — Email notification preference
-- One on/off switch per user for transactional emails (offers, counters, matches).
-- Defaults ON; users can turn it off in Settings.

alter table profiles
  add column if not exists email_notifications boolean not null default true;

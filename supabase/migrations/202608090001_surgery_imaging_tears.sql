-- Add optional imaging findings without changing existing surgery records or RLS.
alter table public.surgeries
  add column if not exists red_tear boolean,
  add column if not exists anterior_cable_tear boolean;

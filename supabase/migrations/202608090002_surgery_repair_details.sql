-- Add optional repair details without changing existing surgery records or RLS.
alter table public.surgeries
  add column if not exists margin_convergence boolean,
  add column if not exists graft_use boolean,
  add column if not exists medialization boolean,
  add column if not exists operative_notes text;

-- Add an optional surgeon without changing existing surgery records or RLS.
alter table public.surgeries
  add column if not exists surgeon text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'surgeries_surgeon_check'
      and conrelid = 'public.surgeries'::regclass
  ) then
    alter table public.surgeries
      add constraint surgeries_surgeon_check
      check (surgeon in ('蔣恩榮', '陳昆暉', '馬瑄孝')) not valid;
  end if;
end $$;

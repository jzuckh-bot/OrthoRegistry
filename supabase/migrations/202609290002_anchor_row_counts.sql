-- Preserve existing totals; historical row counts remain NULL.
alter table public.surgeries
  add column if not exists medial_row_anchors smallint
    check (medial_row_anchors between 0 and 20),
  add column if not exists lateral_row_anchors smallint
    check (lateral_row_anchors between 0 and 20);

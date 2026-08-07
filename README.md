# OrthoRegistry

A mobile-first orthopedic surgical registry built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui conventions, and Supabase.

## Features

- Supabase email/password authentication
- Dashboard and responsive navigation
- Patient CRUD with server-rendered lists and detail pages
- Search by MRN or name
- Zod validation and automatic BMI calculation
- Light and dark modes
- Rotator cuff surgery create, view, edit, and delete workflows
- Patient-linked surgical history

## Phase 2 database migration

Apply `supabase/migrations/202608070001_phase_2_rotator_cuff_surgeries.sql` in the Supabase SQL editor before using the surgery module. It adds only missing surgery columns, constraints, a patient foreign key, and an index. It does not update or delete patient data and does not replace existing RLS policies.

## Local development

1. Copy `.env.local.example` to `.env.local`.
2. Run `pnpm install`.
3. Run `pnpm dev`.

The existing `patients` table must expose `id`, `mrn`, `name`, `birthday`, `sex`, `height`, `weight`, `bmi`, and `created_at`. Supabase Row Level Security policies must grant authenticated users the intended patient access.

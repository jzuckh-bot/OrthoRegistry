# Shared authenticated registry

Every Supabase Auth user has the same patient/surgery CRUD access. Anonymous
users have no RLS policy granting clinical access. Authentication middleware
continues to protect the app. No owner filtering or admin distinction applies.

## Restore the database after the abandoned isolation change

Apply `migrations/202610080002_restore_shared_registry.sql` in Supabase SQL
Editor. Git push does NOT run this migration. Until it is applied, the previously
installed ownership policies still restrict the live database.

The transaction replaces all policies on only public.patients/public.surgeries
with authenticated-only ALL policies (USING true / WITH CHECK true), enables
RLS, grants authenticated CRUD, and removes the owner_id default if present.
The owner_id column and its existing values are retained as unused metadata to
avoid deleting data. No patient or surgery row is updated or deleted. The old
uncommitted ownership migration and rollout instructions have been removed.

After applying, verify in SQL Editor:

```sql
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('patients', 'surgeries');
```

Expect two policies, both for authenticated, with ALL / true / true. Then sign
in with two separate accounts and confirm the same patient list, counts and
patient/surgery details. Logged-out users must still be redirected to login.
Local TypeScript/build verification does not establish that live RLS changed.

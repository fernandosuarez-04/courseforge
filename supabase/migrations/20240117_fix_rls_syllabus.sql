
-- Enable RLS on core tables
alter table public.artifacts enable row level security;
alter table public.syllabus enable row level security;

-- Grant standard permissions (avoid 406 Not Acceptable / 401 Unauthorized)
grant usage on schema public to postgres, anon, authenticated, service_role;

grant all privileges on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to anon; -- CAUTION: Open for dev/debugging if auth is flaky

-- POLICIES (Simple permissive for now to unblock deployment)

-- Artifacts
create policy "Enable all access for authenticated users to artifacts"
on public.artifacts
for all
to authenticated
using (true);

create policy "Enable all access for anon users to artifacts" -- Needed if polling happens occasionally without auth or during dev
on public.artifacts
for all
to anon
using (true);

-- Syllabus
create policy "Enable all access for authenticated users to syllabus"
on public.syllabus
for all
to authenticated
using (true);

create policy "Enable all access for anon users to syllabus"
on public.syllabus
for all
to anon
using (true);

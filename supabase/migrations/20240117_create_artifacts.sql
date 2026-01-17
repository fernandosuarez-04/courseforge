-- Create Enum for State (if not exists)
DO $$ BEGIN
    CREATE TYPE public.artifact_state AS ENUM ('DRAFT', 'PENDING_QA', 'IN_PROCESS', 'APPROVED', 'ESCALATED', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Artifacts Table matching the required structure
CREATE TABLE IF NOT EXISTS public.artifacts (
  id uuid not null default extensions.uuid_generate_v4 (),
  run_id text null,
  course_id text null,
  idea_central text not null,
  nombres jsonb not null default '[]'::jsonb,
  objetivos jsonb not null default '[]'::jsonb,
  descripcion jsonb not null default '{}'::jsonb,
  state public.artifact_state not null default 'DRAFT'::artifact_state,
  validation_report jsonb null,
  semantic_result jsonb null,
  auto_retry_count integer not null default 0,
  iteration_count integer not null default 0,
  generation_metadata jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint artifacts_pkey primary key (id),
  constraint artifacts_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null
) TABLESPACE pg_default;

-- Create Indexes
create index IF not exists idx_artifacts_state on public.artifacts using btree (state) TABLESPACE pg_default;
create index IF not exists idx_artifacts_created_by on public.artifacts using btree (created_by) TABLESPACE pg_default;
create index IF not exists idx_artifacts_created_at on public.artifacts using btree (created_at desc) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

-- Policies

-- Admin View All
CREATE POLICY "Admins can view all artifacts" ON public.artifacts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.platform_role = 'ADMIN'
        )
    );

-- Users View Own
CREATE POLICY "Users can view own artifacts" ON public.artifacts
    FOR SELECT
    USING (auth.uid() = created_by);

-- Users Insert Own
CREATE POLICY "Users can insert own artifacts" ON public.artifacts
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Users Update Own
CREATE POLICY "Users can update own artifacts" ON public.artifacts
    FOR UPDATE
    USING (auth.uid() = created_by);

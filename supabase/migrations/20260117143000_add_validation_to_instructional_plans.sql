alter table "public"."instructional_plans" 
add column if not exists "validation" jsonb null;

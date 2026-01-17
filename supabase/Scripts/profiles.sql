-- PROFILES & AUTH SCHEMA
-- Extiende la funcionalidad de Supabase Auth para gestionar perfiles, organizaciones e historial.

-- 1. ENUMS
-- Roles globales de la plataforma
create type public.app_role as enum ('ADMIN', 'ARQUITECTO', 'CONSTRUCTOR');

-- 2. ORGANIZACIONES
-- Entidad para agrupar usuarios
create table public.organizations (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. PERFILES DE USUARIO (Profiles)
-- Extensión pública de auth.users. No guarda contraseñas (están en auth.users).
create table public.profiles (
  -- El ID es FK a auth.users, garantizando relación 1:1
  id uuid not null references auth.users(id) on delete cascade primary key,
  
  -- Identificación y Contacto
  username text unique,
  email text, -- Copia de lectura sincronizada con auth
  
  -- Datos Personales
  first_name text,
  last_name_father text,
  last_name_mother text,
  avatar_url text,
  
  -- Roles y Permisos
  platform_role public.app_role not null default 'CONSTRUCTOR'::app_role,
  
  -- Contexto Organizacional
  organization_id uuid references public.organizations(id) on delete set null,
  organization_role text, -- Ejemplo: 'OWNER', 'ADMIN', 'MEMBER'
  
  -- Estado
  is_active boolean default true,
  last_login_at timestamp with time zone,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Índices para optimizar búsquedas
create index idx_profiles_username on public.profiles(username);
create index idx_profiles_email on public.profiles(email);
create index idx_profiles_organization on public.profiles(organization_id);

-- 4. HISTORIAL DE LOGINS
-- Registro de accesos
create table public.login_history (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  login_at timestamp with time zone default now(),
  ip_address text,
  user_agent text,
  metadata jsonb default '{}'::jsonb -- Para guardar info extra del dispositivo/navegador
);

create index idx_login_history_user on public.login_history(user_id);
create index idx_login_history_date on public.login_history(login_at desc);

-- 5. SESIONES DE USUARIO (Gestión de Cookies/Tokens)
-- Aunque Supabase maneja tokens JWT, esta tabla permite gestionar sesiones persistentes o invalidarlas manualmente
create table public.user_sessions (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  token_hash text not null, -- Hash del token de actualización o identificador de sesión
  device_info text,
  ip_address text,
  is_active boolean default true,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  last_accessed_at timestamp with time zone default now()
);

create index idx_user_sessions_user on public.user_sessions(user_id);
create index idx_user_sessions_token on public.user_sessions(token_hash);

-- 6. TRIGGERS DE ACTIVIDAD
-- Actualizar 'updated_at' automáticamente
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at_column();

create trigger update_orgs_updated_at before update on public.organizations
  for each row execute function update_updated_at_column();

-- Trigger para crear perfil automáticamente al registrarse en Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, 
    email, 
    first_name, 
    last_name_father, 
    last_name_mother, 
    username,
    platform_role
  )
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name_father',
    new.raw_user_meta_data->>'last_name_mother',
    new.raw_user_meta_data->>'username',
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'CONSTRUCTOR'::public.app_role)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Activar el trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

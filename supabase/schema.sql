-- nodaris_schema.sql
-- EJECUTÁ ESTE SCRIPT EN EL SQL EDITOR DE SUPABASE (solo si necesitás reiniciar).
-- Borra las tablas viejas y las recrea limpias.

drop table if exists notas cascade;
drop table if exists tareas cascade;
drop table if exists pagos cascade;
drop table if exists proyectos cascade;
drop table if exists clientes cascade;
drop table if exists personas cascade;

-- Personas (Usuarios del sistema)
create table personas (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  email text not null unique,
  rol text not null,
  creado timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Clientes
create table clientes (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  empresa text not null,
  email text not null,
  telefono text,
  estado text not null default 'lead',
  valor numeric not null default 0,
  notas text,
  creado date not null default current_date
);

-- Proyectos
create table proyectos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  titulo text not null,
  tipo text not null,
  estado text not null default 'pendiente',
  precio numeric not null default 0,
  fecha_inicio date not null,
  fecha_entrega date not null,
  descripcion text,
  drive_url text not null default '',
  creado timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Pagos
create table pagos (
  id uuid primary key default uuid_generate_v4(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  proyecto_id uuid references proyectos(id) on delete set null,
  monto numeric not null,
  estado text not null default 'pendiente',
  metodo text not null,
  fecha date not null,
  concepto text not null,
  creado timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tareas
create table tareas (
  id uuid primary key default uuid_generate_v4(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  titulo text not null,
  descripcion text,
  asignado_a uuid references personas(id) on delete set null,
  estado text not null default 'pendiente',
  prioridad text not null default 'media',
  fecha_vencimiento date,
  creado date not null default current_date
);

-- Notas
create table notas (
  id uuid primary key default uuid_generate_v4(),
  tarea_id uuid not null references tareas(id) on delete cascade,
  autor_id uuid not null references personas(id) on delete cascade,
  contenido text not null,
  imagenes text[] not null default '{}',
  fecha timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Leads (formulario de contacto de la landing, insertados via n8n)
create table if not exists leads (
  id        uuid primary key default uuid_generate_v4(),
  nombre    text not null,
  empresa   text,
  email     text not null,
  whatsapp  text,                -- se guarda como text para conservar el prefijo +54 9 ...
  mensaje   text,
  estado    text not null default 'nuevo', -- nuevo | revisado | contactado | descartado
  creado    timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS deshabilitado (entorno de desarrollo)
alter table personas disable row level security;
alter table clientes disable row level security;
alter table proyectos disable row level security;
alter table pagos disable row level security;
alter table tareas disable row level security;
alter table notas disable row level security;
alter table leads disable row level security;

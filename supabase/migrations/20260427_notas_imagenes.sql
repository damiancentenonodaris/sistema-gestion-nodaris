-- Migración: agregar adjuntos de imagen a notas
-- Ejecutá esto en el SQL Editor de Supabase si ya tenés data y no querés reiniciar el schema.

alter table notas
  add column if not exists imagenes text[] not null default '{}';

-- Bucket público para los adjuntos (idempotente).
insert into storage.buckets (id, name, public)
values ('notas-adjuntos', 'notas-adjuntos', true)
on conflict (id) do update set public = excluded.public;

-- Policies: lectura pública + escritura autenticada.
drop policy if exists "notas-adjuntos lectura publica" on storage.objects;
create policy "notas-adjuntos lectura publica"
  on storage.objects for select
  using (bucket_id = 'notas-adjuntos');

drop policy if exists "notas-adjuntos subida autenticada" on storage.objects;
create policy "notas-adjuntos subida autenticada"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'notas-adjuntos');

drop policy if exists "notas-adjuntos borrado autenticado" on storage.objects;
create policy "notas-adjuntos borrado autenticado"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'notas-adjuntos');

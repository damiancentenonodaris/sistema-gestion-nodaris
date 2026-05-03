-- Migración: renombrar vscode_path a drive_url
-- Ejecutá esto en el SQL Editor de Supabase si ya corriste la migración anterior.
-- Si nunca corriste 20260427_proyectos_vscode_path.sql, corré esta directamente —
-- crea la columna drive_url desde cero.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'proyectos' and column_name = 'vscode_path'
  ) then
    alter table proyectos rename column vscode_path to drive_url;
  elsif not exists (
    select 1 from information_schema.columns
    where table_name = 'proyectos' and column_name = 'drive_url'
  ) then
    alter table proyectos add column drive_url text not null default '';
  end if;
end $$;

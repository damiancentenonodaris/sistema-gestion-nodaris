-- Migración: agregar ruta de VS Code a proyectos
-- Ejecutá esto en el SQL Editor de Supabase si ya tenés data y no querés reiniciar el schema.

alter table proyectos
  add column if not exists vscode_path text not null default '';

"use client";

import { createClient } from "@/lib/supabase/client";

export const NOTAS_BUCKET = "notas-adjuntos";

function sanitize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-80);
}

export async function uploadNotaImagenes(tareaId: string, files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  const supabase = createClient();
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${tareaId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitize(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;

    const { error } = await supabase.storage.from(NOTAS_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) {
      console.error("[uploadNotaImagenes]", error);
      throw new Error(`No se pudo subir ${file.name}: ${error.message}`);
    }

    const { data } = supabase.storage.from(NOTAS_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

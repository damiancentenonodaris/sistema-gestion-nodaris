"use client";

import * as React from "react";
import {
  Circle,
  CircleDot,
  CheckCircle2,
  Pencil,
  Trash2,
  MessageSquare,
  CalendarClock,
  Send,
  Flag,
  ImagePlus,
  X,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { useNodaris } from "@/lib/store";
import { cn, diffDays, formatDateShort, timeAgo } from "@/lib/utils";
import { uploadNotaImagenes } from "@/lib/uploadNotaImagenes";
import type { EstadoTarea, Prioridad, Tarea } from "@/types";

interface Props {
  tarea: Tarea;
  onEdit: (t: Tarea) => void;
}

const estadoConfig: Record<
  EstadoTarea,
  { label: string; tone: "amber" | "blue" | "green"; icon: LucideIcon }
> = {
  pendiente: { label: "Pendiente", tone: "amber", icon: Circle },
  en_progreso: { label: "En curso", tone: "blue", icon: CircleDot },
  finalizado: { label: "Finalizada", tone: "green", icon: CheckCircle2 },
};

const prioridadConfig: Record<Prioridad, { label: string; tone: "red" | "amber" | "slate" }> = {
  alta: { label: "Alta", tone: "red" },
  media: { label: "Media", tone: "amber" },
  baja: { label: "Baja", tone: "slate" },
};

const ordenEstado: EstadoTarea[] = ["pendiente", "en_progreso", "finalizado"];

export function TareaItem({ tarea, onEdit }: Props) {
  const personas = useNodaris((s) => s.personas);
  const notas = useNodaris((s) => s.notas);
  const currentUserId = useNodaris((s) => s.currentUserId);
  const setCurrentUserId = useNodaris((s) => s.setCurrentUserId);
  const updateTarea = useNodaris((s) => s.updateTarea);
  const removeTarea = useNodaris((s) => s.removeTarea);
  const addNota = useNodaris((s) => s.addNota);
  const removeNota = useNodaris((s) => s.removeNota);

  const [expanded, setExpanded] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [adjuntos, setAdjuntos] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [enviando, setEnviando] = React.useState(false);
  const [errorEnvio, setErrorEnvio] = React.useState<string | null>(null);
  const [viewer, setViewer] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const urls = adjuntos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [adjuntos]);

  React.useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewer]);

  const asignado = personas.find((p) => p.id === tarea.asignadoA);
  const notasTarea = notas
    .filter((n) => n.tareaId === tarea.id)
    .sort((a, b) => +new Date(a.fecha) - +new Date(b.fecha));
  const estadoCfg = estadoConfig[tarea.estado];
  const prioridadCfg = prioridadConfig[tarea.prioridad];
  const StatusIcon = estadoCfg.icon;

  const vencido =
    tarea.fechaVencimiento &&
    tarea.estado !== "finalizado" &&
    diffDays(new Date().toISOString(), tarea.fechaVencimiento) < 0;

  const ciclarEstado = () => {
    const i = ordenEstado.indexOf(tarea.estado);
    const next = ordenEstado[(i + 1) % ordenEstado.length];
    updateTarea(tarea.id, { estado: next });
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lista = Array.from(e.target.files ?? []);
    if (lista.length === 0) return;
    const validos = lista.filter((f) => f.type.startsWith("image/") && f.size <= 8 * 1024 * 1024);
    if (validos.length !== lista.length) {
      setErrorEnvio("Solo imágenes de hasta 8 MB cada una.");
    } else {
      setErrorEnvio(null);
    }
    setAdjuntos((prev) => [...prev, ...validos].slice(0, 6));
    e.target.value = "";
  };

  const quitarAdjunto = (idx: number) => {
    setAdjuntos((prev) => prev.filter((_, i) => i !== idx));
  };

  const enviarNota = async () => {
    const contenido = draft.trim();
    if (!contenido && adjuntos.length === 0) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const imagenes = await uploadNotaImagenes(tarea.id, adjuntos);
      await addNota({
        tareaId: tarea.id,
        autorId: currentUserId,
        contenido,
        imagenes,
      });
      setDraft("");
      setAdjuntos([]);
      textareaRef.current?.focus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo enviar la nota.";
      setErrorEnvio(msg);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className={cn(
        "card-base overflow-hidden transition-all",
        tarea.estado === "finalizado" && "bg-surface-page/40",
      )}
    >
      {/* Fila principal */}
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={ciclarEstado}
          title={`Cambiar estado · actual: ${estadoCfg.label}`}
          className={cn(
            "shrink-0 mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full transition focus-ring",
            tarea.estado === "finalizado"
              ? "text-emerald-600"
              : tarea.estado === "en_progreso"
              ? "text-brand-600"
              : "text-ink-faint hover:text-brand-600",
          )}
        >
          <StatusIcon size={18} />
        </button>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 min-w-0 text-left focus-ring rounded"
        >
          <div className="flex items-start gap-2 flex-wrap">
            <p
              className={cn(
                "text-sm font-medium leading-snug",
                tarea.estado === "finalizado" ? "text-ink-subtle line-through" : "text-ink",
              )}
            >
              {tarea.titulo}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-ink-subtle">
            <Badge tone={prioridadCfg.tone} dot>
              <Flag size={10} /> {prioridadCfg.label}
            </Badge>
            <Badge tone={estadoCfg.tone} dot>
              {estadoCfg.label}
            </Badge>
            {asignado ? (
              <span className="inline-flex items-center gap-1.5">
                <Avatar name={asignado.nombre} size="xs" />
                <span className="text-xs text-ink-soft">{asignado.nombre}</span>
              </span>
            ) : (
              <span className="text-2xs italic text-ink-faint">Sin asignar</span>
            )}
            {tarea.fechaVencimiento && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-2xs",
                  vencido ? "text-rose-600 font-semibold" : "text-ink-subtle",
                )}
              >
                <CalendarClock size={11} />
                {vencido ? "vencida · " : ""}
                {formatDateShort(tarea.fechaVencimiento)}
              </span>
            )}
            {notasTarea.length > 0 && (
              <span className="inline-flex items-center gap-1 text-2xs text-ink-subtle">
                <MessageSquare size={11} />
                {notasTarea.length}
              </span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onEdit(tarea)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-surface-subtle hover:text-ink focus-ring"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar la tarea "${tarea.titulo}"?`)) removeTarea(tarea.id);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-rose-50 hover:text-danger focus-ring"
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expandido */}
      {expanded && (
        <div className="border-t border-surface-divider bg-surface-page/40 p-4 space-y-4 animate-fade-in">
          {tarea.descripcion && (
            <p className="text-sm text-ink-soft leading-relaxed">{tarea.descripcion}</p>
          )}

          {/* Notas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={13} className="text-ink-faint" />
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Notas{notasTarea.length > 0 && ` · ${notasTarea.length}`}
              </span>
            </div>

            {notasTarea.length === 0 ? (
              <p className="text-xs text-ink-faint italic">
                Aún no hay notas en esta tarea. Sé el primero en aportar.
              </p>
            ) : (
              <ul className="space-y-3">
                {notasTarea.map((n) => {
                  const autor = personas.find((p) => p.id === n.autorId);
                  const esMia = n.autorId === currentUserId;
                  return (
                    <li key={n.id} className="flex items-start gap-3 group/note">
                      <Avatar name={autor?.nombre ?? "?"} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-ink">
                            {autor?.nombre ?? "Usuario eliminado"}
                          </span>
                          <span className="text-2xs text-ink-faint">{timeAgo(n.fecha)}</span>
                          {autor?.rol && (
                            <span className="text-2xs text-ink-faint">· {autor.rol}</span>
                          )}
                        </div>
                        {n.contenido && (
                          <p className="text-sm text-ink-soft mt-0.5 whitespace-pre-wrap leading-relaxed">
                            {n.contenido}
                          </p>
                        )}
                        {n.imagenes && n.imagenes.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {n.imagenes.map((src, i) => (
                              <button
                                key={`${n.id}-img-${i}`}
                                type="button"
                                onClick={() => setViewer(src)}
                                className="group/img relative overflow-hidden rounded-lg border border-surface-border bg-surface-page focus-ring"
                                title="Ver en grande"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={src}
                                  alt={`Adjunto ${i + 1}`}
                                  className="h-24 w-24 sm:h-28 sm:w-28 object-cover transition group-hover/img:scale-105"
                                  loading="lazy"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {esMia && (
                        <button
                          onClick={() => {
                            if (confirm("¿Eliminar esta nota?")) removeNota(n.id);
                          }}
                          className="opacity-0 group-hover/note:opacity-100 text-ink-faint hover:text-danger transition shrink-0 mt-1"
                          title="Eliminar nota"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Agregar nota */}
            <div className="rounded-xl border border-surface-border bg-surface focus-within:border-brand-300 focus-within:shadow-ring transition">
              <div className="flex items-center gap-2 border-b border-surface-divider px-3 py-2">
                <span className="text-2xs text-ink-faint">Comentar como</span>
                <Avatar
                  name={personas.find((p) => p.id === currentUserId)?.nombre ?? "?"}
                  size="xs"
                />
                <Select
                  className="h-7 text-xs border-0 px-1 w-auto bg-transparent shadow-none focus:ring-0 -mr-2"
                  value={currentUserId}
                  onChange={(e) => setCurrentUserId(e.target.value)}
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    enviarNota();
                  }
                }}
                placeholder="Dejá una nota, mención o avance…"
                rows={2}
                className="w-full bg-transparent border-0 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none resize-none"
              />

              {previews.length > 0 && (
                <div className="flex flex-wrap gap-2 px-3 pb-2">
                  {previews.map((src, i) => (
                    <div
                      key={`preview-${i}`}
                      className="relative group/preview rounded-lg overflow-hidden border border-surface-border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Preview ${i + 1}`}
                        className="h-16 w-16 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => quitarAdjunto(i)}
                        className="absolute top-0.5 right-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 group-hover/preview:opacity-100 hover:bg-ink transition focus-ring"
                        aria-label="Quitar imagen"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errorEnvio && (
                <p className="px-3 pb-2 text-2xs text-rose-600">{errorEnvio}</p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onPickFiles}
              />

              <div className="flex items-center justify-between border-t border-surface-divider px-3 py-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={enviando || adjuntos.length >= 6}
                    className="inline-flex items-center gap-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-subtle px-2 py-1 text-2xs transition focus-ring disabled:opacity-40 disabled:cursor-not-allowed"
                    title={adjuntos.length >= 6 ? "Máximo 6 imágenes" : "Adjuntar imágenes"}
                  >
                    <ImagePlus size={13} />
                    Imagen
                    {adjuntos.length > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center rounded-full bg-brand-50 text-brand-700 font-semibold text-[10px] px-1.5 min-w-[16px] h-4">
                        {adjuntos.length}
                      </span>
                    )}
                  </button>
                  <span className="text-2xs text-ink-faint hidden sm:inline">
                    ⌘/Ctrl + Enter para enviar
                  </span>
                </div>
                <button
                  onClick={enviarNota}
                  disabled={enviando || (!draft.trim() && adjuntos.length === 0)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:hover:bg-brand-600 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 transition focus-ring"
                >
                  {enviando ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  {enviando ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setViewer(null)}
          role="dialog"
          aria-modal
        >
          <button
            type="button"
            onClick={() => setViewer(null)}
            className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink hover:bg-surface transition focus-ring"
            aria-label="Cerrar visor"
          >
            <X size={18} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewer}
            alt="Adjunto"
            className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-pop"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

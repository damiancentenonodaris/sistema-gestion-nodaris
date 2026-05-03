"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Globe,
  Layers,
  Calendar,
  Users as UsersIcon,
  ListChecks,
  CircleSlash,
  FolderOpen,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Header } from "@/components/shell/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProyectoModal } from "./ProyectoModal";
import { TareaModal } from "./TareaModal";
import { TareaItem } from "./TareaItem";
import { useNodaris } from "@/lib/store";
import { cn, formatCurrency, formatDate, diffDays, normalizeDriveUrl } from "@/lib/utils";
import type { EstadoTarea, Tarea } from "@/types";

interface Props {
  id: string;
}

const tabs: { value: "todas" | EstadoTarea; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "en_progreso", label: "En curso" },
  { value: "finalizado", label: "Finalizadas" },
];

const estadoProyectoTone = {
  pendiente: "amber",
  en_progreso: "blue",
  finalizado: "green",
} as const;

const estadoProyectoLabel = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  finalizado: "Finalizado",
};

export function ProyectoDetalle({ id }: Props) {
  const router = useRouter();
  const proyecto = useNodaris((s) => s.proyectos.find((p) => p.id === id));
  const cliente = useNodaris((s) =>
    proyecto ? s.clientes.find((c) => c.id === proyecto.clienteId) : undefined,
  );
  const tareas = useNodaris((s) => s.tareas.filter((t) => t.proyectoId === id));
  const personas = useNodaris((s) => s.personas);
  const removeProyecto = useNodaris((s) => s.removeProyecto);

  const [tab, setTab] = React.useState<"todas" | EstadoTarea>("todas");
  const [editProyectoOpen, setEditProyectoOpen] = React.useState(false);
  const [tareaModalOpen, setTareaModalOpen] = React.useState(false);
  const [tareaEdit, setTareaEdit] = React.useState<Tarea | null>(null);

  if (!proyecto) {
    return (
      <AppShell>
        <Header title="Proyecto no encontrado" />
        <div className="px-6 py-10">
          <EmptyState
            icon={<CircleSlash size={20} />}
            title="No encontramos este proyecto"
            description="Puede haber sido eliminado o el link es inválido."
            action={
              <Link href="/proyectos">
                <Button variant="secondary" iconLeft={<ArrowLeft size={14} />}>
                  Volver a proyectos
                </Button>
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  const counts = {
    todas: tareas.length,
    pendiente: tareas.filter((t) => t.estado === "pendiente").length,
    en_progreso: tareas.filter((t) => t.estado === "en_progreso").length,
    finalizado: tareas.filter((t) => t.estado === "finalizado").length,
  };

  const tareasFiltradas = tab === "todas" ? tareas : tareas.filter((t) => t.estado === tab);

  // Orden: vencidas primero, luego por prioridad alta, luego por estado, luego por fecha
  const ordenPrioridad = { alta: 0, media: 1, baja: 2 };
  const ordenEstado = { en_progreso: 0, pendiente: 1, finalizado: 2 };
  const tareasOrdenadas = [...tareasFiltradas].sort((a, b) => {
    if (a.estado !== b.estado) return ordenEstado[a.estado] - ordenEstado[b.estado];
    if (a.prioridad !== b.prioridad) return ordenPrioridad[a.prioridad] - ordenPrioridad[b.prioridad];
    return +new Date(a.fechaVencimiento ?? "9999") - +new Date(b.fechaVencimiento ?? "9999");
  });

  const progreso =
    counts.todas === 0 ? 0 : Math.round((counts.finalizado / counts.todas) * 100);

  const personasInvolucradas = Array.from(
    new Set(tareas.map((t) => t.asignadoA).filter(Boolean)),
  )
    .map((id) => personas.find((p) => p.id === id))
    .filter(Boolean) as typeof personas;

  const dias = diffDays(new Date().toISOString(), proyecto.fechaEntrega);
  const driveUrl = normalizeDriveUrl(proyecto.driveUrl ?? "");

  const openTarea = (t?: Tarea) => {
    setTareaEdit(t ?? null);
    setTareaModalOpen(true);
  };

  return (
    <AppShell>
      <Header
        title={proyecto.titulo}
        subtitle={cliente ? `${cliente.empresa} · ${cliente.nombre}` : undefined}
        action={{ label: "Nueva tarea", onClick: () => openTarea() }}
      />

      <div className="px-6 py-6 space-y-6">
        {/* Breadcrumb / back */}
        <div className="flex items-center gap-2 text-xs text-ink-subtle">
          <Link
            href="/proyectos"
            className="inline-flex items-center gap-1 hover:text-ink transition focus-ring rounded px-1 py-0.5"
          >
            <ArrowLeft size={12} />
            Proyectos
          </Link>
          <span className="text-ink-faint">/</span>
          <span className="text-ink-soft truncate">{proyecto.titulo}</span>
        </div>

        {/* Header card del proyecto */}
        <Card>
          <CardContent>
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
              <div className="space-y-3 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone={proyecto.tipo === "saas" ? "violet" : "blue"}>
                    {proyecto.tipo === "landing" ? (
                      <>
                        <Globe size={11} /> Landing
                      </>
                    ) : (
                      <>
                        <Layers size={11} /> SaaS
                      </>
                    )}
                  </Badge>
                  <Badge tone={estadoProyectoTone[proyecto.estado]} dot>
                    {estadoProyectoLabel[proyecto.estado]}
                  </Badge>
                  {proyecto.estado !== "finalizado" && (
                    <Badge tone={dias < 14 ? "red" : dias < 30 ? "amber" : "neutral"}>
                      <Calendar size={11} />
                      {dias > 0 ? `${dias} días para entrega` : "vencido"}
                    </Badge>
                  )}
                </div>

                <h2 className="text-xl font-semibold tracking-tight text-ink">
                  {proyecto.titulo}
                </h2>

                {proyecto.descripcion && (
                  <p className="text-sm text-ink-soft leading-relaxed max-w-2xl">
                    {proyecto.descripcion}
                  </p>
                )}

                {/* Carpeta del proyecto en Drive */}
                {driveUrl ? (
                  <a
                    href={driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-surface-page/60 px-3 py-2 hover:border-brand-300 hover:bg-brand-50/40 transition group/drive focus-ring max-w-full"
                    title="Abrir carpeta en Google Drive"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 shrink-0">
                      <FolderOpen size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-2xs uppercase tracking-wider text-ink-faint">
                        Carpeta en Google Drive
                      </span>
                      <span className="block text-xs font-mono text-ink-soft truncate group-hover/drive:text-brand-700 transition">
                        {driveUrl}
                      </span>
                    </span>
                    <ExternalLink size={13} className="text-ink-faint shrink-0" />
                  </a>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-lg border border-dashed border-surface-border bg-surface-page/40 px-3 py-2 text-2xs text-ink-faint">
                    <FolderOpen size={13} />
                    Configurá el link de Drive editando el proyecto.
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 pt-2">
                  <div>
                    <p className="text-2xs uppercase tracking-wider text-ink-faint">Cliente</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Avatar name={cliente?.nombre ?? "?"} size="xs" />
                      <span className="text-sm font-medium text-ink truncate">
                        {cliente?.empresa ?? "—"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xs uppercase tracking-wider text-ink-faint">Inicio</p>
                    <p className="text-sm font-medium text-ink mt-1">
                      {formatDate(proyecto.fechaInicio)}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xs uppercase tracking-wider text-ink-faint">Entrega</p>
                    <p className="text-sm font-medium text-ink mt-1">
                      {formatDate(proyecto.fechaEntrega)}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xs uppercase tracking-wider text-ink-faint">Precio</p>
                    <p className="text-sm font-semibold text-ink mt-1 tabular-nums">
                      {formatCurrency(proyecto.precio)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Panel lateral con progreso + equipo */}
              <div className="xl:w-72 shrink-0 space-y-4 xl:border-l xl:border-surface-divider xl:pl-6">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xs uppercase tracking-wider text-ink-faint">
                      Progreso
                    </span>
                    <span className="text-xs font-semibold text-ink tabular-nums">
                      {progreso}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-brand-700 rounded-full transition-all duration-500"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                  <p className="text-2xs text-ink-faint mt-2">
                    {counts.finalizado} de {counts.todas} tareas finalizadas
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <UsersIcon size={12} className="text-ink-faint" />
                    <span className="text-2xs uppercase tracking-wider text-ink-faint">
                      Equipo asignado
                    </span>
                  </div>
                  {personasInvolucradas.length > 0 ? (
                    <div className="space-y-2">
                      {personasInvolucradas.map((p) => {
                        const cant = tareas.filter((t) => t.asignadoA === p.id).length;
                        return (
                          <div key={p.id} className="flex items-center gap-2">
                            <Avatar name={p.nombre} size="xs" />
                            <span className="text-xs text-ink-soft flex-1 truncate">
                              {p.nombre}
                            </span>
                            <span className="text-2xs text-ink-faint tabular-nums">
                              {cant}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-2xs text-ink-faint italic">
                      Aún no hay tareas asignadas.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={<Pencil size={12} />}
                    onClick={() => setEditProyectoOpen(true)}
                  >
                    Editar proyecto
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          `¿Eliminar el proyecto "${proyecto.titulo}"?\nSe borrarán también sus tareas y notas.`,
                        )
                      ) {
                        removeProyecto(proyecto.id);
                        router.push("/proyectos");
                      }
                    }}
                    className="text-ink-subtle hover:text-danger"
                    title="Eliminar"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tareas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <ListChecks size={16} className="text-ink-subtle" />
              <h3 className="text-sm font-semibold text-ink">Tareas</h3>
              <span className="text-xs text-ink-subtle">· {counts.todas} en total</span>
            </div>
            <Button onClick={() => openTarea()} iconLeft={<Plus size={14} />} size="sm">
              Nueva tarea
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-surface-border bg-surface p-1 w-fit overflow-x-auto">
            {tabs.map((t) => {
              const active = tab === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition whitespace-nowrap",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-subtle hover:text-ink",
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-2xs tabular-nums",
                      active ? "bg-brand-600 text-white" : "bg-surface-subtle text-ink-subtle",
                    )}
                  >
                    {counts[t.value]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Lista */}
          {tareasOrdenadas.length === 0 ? (
            <Card>
              <EmptyState
                icon={<ListChecks size={20} />}
                title={
                  counts.todas === 0
                    ? "Todavía no hay tareas en este proyecto"
                    : "No hay tareas en este filtro"
                }
                description={
                  counts.todas === 0
                    ? "Empezá creando la primera unidad de trabajo del proyecto."
                    : "Probá cambiando de pestaña o creando una tarea nueva."
                }
                action={
                  <Button onClick={() => openTarea()} iconLeft={<Plus size={14} />}>
                    Crear tarea
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-2.5">
              {tareasOrdenadas.map((t) => (
                <TareaItem key={t.id} tarea={t} onEdit={(tt) => openTarea(tt)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ProyectoModal
        open={editProyectoOpen}
        onClose={() => setEditProyectoOpen(false)}
        proyecto={proyecto}
      />
      <TareaModal
        open={tareaModalOpen}
        onClose={() => setTareaModalOpen(false)}
        proyectoId={proyecto.id}
        tarea={tareaEdit}
      />
    </AppShell>
  );
}

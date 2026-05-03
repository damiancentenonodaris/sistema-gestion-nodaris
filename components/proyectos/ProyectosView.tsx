"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Search,
  Pencil,
  Trash2,
  Globe,
  Layers,
  Calendar,
  ListChecks,
  LayoutGrid,
  ArrowUpRight,
  FolderOpen,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Header } from "@/components/shell/Header";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { useNodaris } from "@/lib/store";
import type { EstadoProyecto, Proyecto } from "@/types";
import { formatCurrency, formatDateShort, diffDays, cn, normalizeDriveUrl } from "@/lib/utils";

const estados: { value: EstadoProyecto; label: string; tone: "amber" | "blue" | "green" }[] = [
  { value: "pendiente", label: "Pendiente", tone: "amber" },
  { value: "en_progreso", label: "En progreso", tone: "blue" },
  { value: "finalizado", label: "Finalizado", tone: "green" },
];

const ProyectoModal = dynamic(() => import("./ProyectoModal").then((m) => m.ProyectoModal), {
  ssr: false,
});

export function ProyectosView() {
  const proyectos = useNodaris((s) => s.proyectos);
  const clientes = useNodaris((s) => s.clientes);
  const removeProyecto = useNodaris((s) => s.removeProyecto);

  const [view, setView] = React.useState<"kanban" | "tabla">("kanban");
  const [query, setQuery] = React.useState("");
  const [filtroTipo, setFiltroTipo] = React.useState<"todos" | "landing" | "saas">("todos");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Proyecto | null>(null);

  const clientesPorId = React.useMemo(
    () => new Map(clientes.map((cliente) => [cliente.id, cliente])),
    [clientes],
  );

  const queryNormalizada = query.trim().toLowerCase();

  const filtrados = React.useMemo(() => proyectos.filter((p) => {
    const cliente = clientesPorId.get(p.clienteId);
    const matchQ =
      !queryNormalizada ||
      p.titulo.toLowerCase().includes(queryNormalizada) ||
      cliente?.empresa.toLowerCase().includes(queryNormalizada);
    const matchTipo = filtroTipo === "todos" || p.tipo === filtroTipo;
    return matchQ && matchTipo;
  }), [clientesPorId, filtroTipo, proyectos, queryNormalizada]);

  const open = (p?: Proyecto) => {
    setEditing(p ?? null);
    setModalOpen(true);
  };

  return (
    <AppShell>
      <Header
        title="Proyectos"
        subtitle={`${proyectos.length} proyectos · ${proyectos.filter((p) => p.estado === "en_progreso").length} en curso`}
        action={{ label: "Nuevo proyecto", onClick: () => open() }}
      />

      <div className="px-6 py-6 space-y-5">
        {/* Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por proyecto o cliente…"
                iconLeft={<Search size={15} />}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                className="w-40"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
              >
                <option value="todos">Todos los tipos</option>
                <option value="landing">Landing</option>
                <option value="saas">SaaS</option>
              </Select>
              <div className="flex items-center gap-1 rounded-lg border border-surface-border p-1">
                <button
                  onClick={() => setView("kanban")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition",
                    view === "kanban"
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-subtle hover:text-ink",
                  )}
                >
                  <LayoutGrid size={13} /> Tablero
                </button>
                <button
                  onClick={() => setView("tabla")}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition",
                    view === "tabla"
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-subtle hover:text-ink",
                  )}
                >
                  <ListChecks size={13} /> Lista
                </button>
              </div>
            </div>
          </div>
        </Card>

        {view === "kanban" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {estados.map((est) => {
              const items = filtrados.filter((p) => p.estado === est.value);
              return (
                <div key={est.value} className="rounded-2xl bg-surface-page/60 border border-surface-divider min-h-[400px]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-surface-divider">
                    <div className="flex items-center gap-2">
                      <Badge tone={est.tone} dot>
                        {est.label}
                      </Badge>
                      <span className="text-xs text-ink-subtle">{items.length}</span>
                    </div>
                    <span className="text-xs font-semibold text-ink tabular-nums">
                      {formatCurrency(items.reduce((s, p) => s + p.precio, 0), true)}
                    </span>
                  </div>
                  <div className="p-3 space-y-3">
                    {items.length === 0 && (
                      <p className="text-xs text-ink-faint text-center py-8">
                        Sin proyectos en este estado
                      </p>
                    )}
                    {items.map((p) => {
                      const cliente = clientesPorId.get(p.clienteId);
                      const dias = diffDays(new Date().toISOString(), p.fechaEntrega);
                      const driveUrl = normalizeDriveUrl(p.driveUrl ?? "");
                      return (
                        <Link
                          key={p.id}
                          href={`/proyectos/${p.id}`}
                          className="block card-base p-4 hover:shadow-card hover:-translate-y-px transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-2xs text-ink-faint mb-1">
                                {p.tipo === "landing" ? <Globe size={11} /> : <Layers size={11} />}
                                <span className="uppercase tracking-wider font-semibold">
                                  {p.tipo === "landing" ? "Landing" : "SaaS"}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-ink truncate group-hover:text-brand-700 transition">
                                {p.titulo}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {driveUrl && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.open(driveUrl, "_blank", "noopener,noreferrer");
                                  }}
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-amber-600 hover:bg-amber-50 transition focus-ring"
                                  title="Abrir carpeta en Google Drive"
                                  aria-label="Abrir en Drive"
                                >
                                  <FolderOpen size={12} />
                                </button>
                              )}
                              <ArrowUpRight
                                size={14}
                                className="text-ink-faint opacity-0 group-hover:opacity-100 transition"
                              />
                            </div>
                          </div>

                          {p.descripcion && (
                            <p className="text-xs text-ink-subtle mt-2 line-clamp-2">
                              {p.descripcion}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-divider">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar name={cliente?.nombre ?? "?"} size="xs" />
                              <span className="text-xs text-ink-subtle truncate">
                                {cliente?.empresa}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {p.estado !== "finalizado" && (
                                <span
                                  className={cn(
                                    "text-2xs font-medium inline-flex items-center gap-1",
                                    dias < 7
                                      ? "text-rose-600"
                                      : dias < 21
                                      ? "text-amber-600"
                                      : "text-ink-subtle",
                                  )}
                                >
                                  <Calendar size={10} />
                                  {dias > 0 ? `${dias}d` : "vencido"}
                                </span>
                              )}
                              <span className="text-xs font-semibold text-ink tabular-nums">
                                {formatCurrency(p.precio, true)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-page text-2xs uppercase tracking-wider text-ink-subtle border-b border-surface-border">
                    <th className="px-5 py-3 text-left font-semibold">Proyecto</th>
                    <th className="px-5 py-3 text-left font-semibold">Cliente</th>
                    <th className="px-5 py-3 text-left font-semibold">Tipo</th>
                    <th className="px-5 py-3 text-left font-semibold">Estado</th>
                    <th className="px-5 py-3 text-left font-semibold">Inicio</th>
                    <th className="px-5 py-3 text-left font-semibold">Entrega</th>
                    <th className="px-5 py-3 text-right font-semibold">Precio</th>
                    <th className="px-5 py-3 text-right font-semibold w-20">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-divider">
                  {filtrados.map((p) => {
                    const cliente = clientesPorId.get(p.clienteId);
                    const est = estados.find((e) => e.value === p.estado)!;
                    const driveUrl = normalizeDriveUrl(p.driveUrl ?? "");
                    return (
                      <tr key={p.id} className="hover:bg-surface-page/60 transition group">
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/proyectos/${p.id}`}
                            className="font-medium text-ink hover:text-brand-700 transition"
                          >
                            {p.titulo}
                          </Link>
                          {p.descripcion && (
                            <p className="text-xs text-ink-subtle truncate max-w-[280px]">
                              {p.descripcion}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Avatar name={cliente?.nombre ?? "?"} size="xs" />
                            <span className="text-xs text-ink-soft">
                              {cliente?.empresa}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone={p.tipo === "saas" ? "violet" : "blue"}>
                            {p.tipo === "landing" ? "Landing" : "SaaS"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone={est.tone} dot>
                            {est.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-ink-subtle">
                          {formatDateShort(p.fechaInicio)}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-ink-subtle">
                          {formatDateShort(p.fechaEntrega)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-ink tabular-nums">
                          {formatCurrency(p.precio)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                            {driveUrl && (
                              <a
                                href={driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-amber-600 hover:bg-amber-50 focus-ring"
                                title="Abrir carpeta en Google Drive"
                                aria-label="Abrir en Drive"
                              >
                                <FolderOpen size={14} />
                              </a>
                            )}
                            <button
                              onClick={() => open(p)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-surface-subtle hover:text-ink focus-ring"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar el proyecto "${p.titulo}"?`)) {
                                  removeProyecto(p.id);
                                }
                              }}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-rose-50 hover:text-danger focus-ring"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {modalOpen && (
        <ProyectoModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          proyecto={editing}
        />
      )}
    </AppShell>
  );
}

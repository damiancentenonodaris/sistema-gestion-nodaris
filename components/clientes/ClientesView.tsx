"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Search, Pencil, Trash2, Mail, Phone, Filter, Users } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Header } from "@/components/shell/Header";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useNodaris } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Cliente, EstadoCliente } from "@/types";

const estadoTone = {
  activo: "green",
  lead: "blue",
  inactivo: "slate",
} as const;

const ClienteModal = dynamic(() => import("./ClienteModal").then((m) => m.ClienteModal), {
  ssr: false,
});

export function ClientesView() {
  const clientes = useNodaris((s) => s.clientes);
  const proyectos = useNodaris((s) => s.proyectos);
  const removeCliente = useNodaris((s) => s.removeCliente);

  const [query, setQuery] = React.useState("");
  const [filtro, setFiltro] = React.useState<EstadoCliente | "todos">("todos");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Cliente | null>(null);

  const queryNormalizada = query.trim().toLowerCase();

  const filtrados = React.useMemo(() => clientes.filter((c) => {
    const matchQ =
      !queryNormalizada ||
      c.nombre.toLowerCase().includes(queryNormalizada) ||
      c.empresa.toLowerCase().includes(queryNormalizada) ||
      c.email.toLowerCase().includes(queryNormalizada);
    const matchE = filtro === "todos" || c.estado === filtro;
    return matchQ && matchE;
  }), [clientes, filtro, queryNormalizada]);

  const proyectosPorCliente = React.useMemo(() => {
    const counts = new Map<string, number>();
    proyectos.forEach((p) => counts.set(p.clienteId, (counts.get(p.clienteId) ?? 0) + 1));
    return counts;
  }, [proyectos]);

  const open = (c?: Cliente) => {
    setEditing(c ?? null);
    setModalOpen(true);
  };

  const eliminar = (c: Cliente) => {
    if (
      confirm(
        `¿Eliminar a ${c.nombre}?\nSe borrarán también sus proyectos y pagos asociados.`,
      )
    ) {
      removeCliente(c.id);
    }
  };

  const counts = React.useMemo(() => ({
    todos: clientes.length,
    activo: clientes.filter((c) => c.estado === "activo").length,
    lead: clientes.filter((c) => c.estado === "lead").length,
    inactivo: clientes.filter((c) => c.estado === "inactivo").length,
  }), [clientes]);

  return (
    <AppShell>
      <Header
        title="Clientes"
        subtitle={`${clientes.length} en tu cartera · ${counts.lead} leads activos`}
        action={{ label: "Nuevo cliente", onClick: () => open() }}
      />
      <div className="px-6 py-6 space-y-5">
        {/* Toolbar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, empresa o email…"
                iconLeft={<Search size={15} />}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1 rounded-lg border border-surface-border p-1">
                {(["todos", "activo", "lead", "inactivo"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFiltro(opt)}
                    className={`relative px-3 py-1.5 text-xs font-medium rounded-md capitalize transition ${
                      filtro === opt
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink-subtle hover:text-ink"
                    }`}
                  >
                    {opt} <span className="text-2xs opacity-60">{counts[opt]}</span>
                  </button>
                ))}
              </div>
              <div className="md:hidden flex-1">
                <Select
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value as EstadoCliente | "todos")}
                >
                  <option value="todos">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="lead">Leads</option>
                  <option value="inactivo">Inactivos</option>
                </Select>
              </div>
              <Button variant="outline" iconLeft={<Filter size={14} />}>
                Más filtros
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabla */}
        <Card className="overflow-hidden">
          {filtrados.length === 0 ? (
            <EmptyState
              icon={<Users size={20} />}
              title="No encontramos clientes"
              description="Probá ajustar la búsqueda o creá uno nuevo."
              action={<Button onClick={() => open()}>Nuevo cliente</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-page text-2xs uppercase tracking-wider text-ink-subtle border-b border-surface-border">
                    <th className="px-5 py-3 text-left font-semibold">Cliente</th>
                    <th className="px-5 py-3 text-left font-semibold">Contacto</th>
                    <th className="px-5 py-3 text-left font-semibold">Estado</th>
                    <th className="px-5 py-3 text-left font-semibold">Proyectos</th>
                    <th className="px-5 py-3 text-right font-semibold">Valor</th>
                    <th className="px-5 py-3 text-left font-semibold">Alta</th>
                    <th className="px-5 py-3 text-right font-semibold w-20">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-divider">
                  {filtrados.map((c) => {
                    const cantProyectos = proyectosPorCliente.get(c.id) ?? 0;
                    return (
                      <tr key={c.id} className="hover:bg-surface-page/60 transition group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={c.nombre} size="md" />
                            <div className="min-w-0">
                              <p className="font-medium text-ink">{c.nombre}</p>
                              <p className="text-xs text-ink-subtle">{c.empresa}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col text-xs gap-0.5">
                            <span className="text-ink flex items-center gap-1.5">
                              <Mail size={11} className="text-ink-faint" />
                              {c.email}
                            </span>
                            <span className="text-ink-subtle flex items-center gap-1.5">
                              <Phone size={11} className="text-ink-faint" />
                              {c.telefono || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge tone={estadoTone[c.estado]} dot>
                            {c.estado}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium text-ink">
                            {cantProyectos}
                          </span>
                          <span className="text-xs text-ink-subtle ml-1">
                            {cantProyectos === 1 ? "proyecto" : "proyectos"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="font-semibold text-ink tabular-nums">
                            {c.valor > 0 ? formatCurrency(c.valor) : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-ink-subtle">{formatDate(c.creado)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => open(c)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-surface-subtle hover:text-ink focus-ring"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => eliminar(c)}
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
          )}
        </Card>
      </div>

      {modalOpen && (
        <ClienteModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          cliente={editing}
        />
      )}
    </AppShell>
  );
}

"use client";

import * as React from "react";
import {
  Inbox,
  RefreshCw,
  Trash2,
  MessageSquare,
  Building2,
  Mail,
  Phone,
  ChevronDown,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Header } from "@/components/shell/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useNodaris } from "@/lib/store";
import type { Lead, EstadoLead } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADOS: { value: EstadoLead; label: string; tone: "blue" | "amber" | "green" | "slate" }[] = [
  { value: "nuevo",      label: "Nuevo",      tone: "blue" },
  { value: "revisado",   label: "Revisado",   tone: "amber" },
  { value: "contactado", label: "Contactado", tone: "green" },
  { value: "descartado", label: "Descartado", tone: "slate" },
];

function estadoInfo(estado: EstadoLead) {
  return ESTADOS.find((e) => e.value === estado) ?? ESTADOS[0];
}

function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Selector de estado ───────────────────────────────────────────────────────

interface EstadoSelectorProps {
  lead: Lead;
  onUpdate: (id: string, estado: EstadoLead) => Promise<void>;
}

function EstadoSelector({ lead, onUpdate }: EstadoSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const info = estadoInfo(lead.estado);

  // Cierra al click fuera
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const cambiar = async (estado: EstadoLead) => {
    setLoading(true);
    setOpen(false);
    await onUpdate(lead.id, estado);
    setLoading(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        disabled={loading}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full border border-transparent hover:border-surface-border transition focus-ring"
      >
        <Badge tone={info.tone} dot>{info.label}</Badge>
        <ChevronDown size={12} className="text-ink-faint mr-1" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-36 rounded-xl border border-surface-border bg-surface shadow-lg overflow-hidden">
          {ESTADOS.map((e) => (
            <button
              key={e.value}
              onClick={() => cambiar(e.value)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-subtle transition text-ink"
            >
              <Badge tone={e.tone} dot>{e.label}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export function LeadsView() {
  const leads = useNodaris((s) => s.leads);
  const refreshLeads = useNodaris((s) => s.refreshLeads);
  const updateLeadEstado = useNodaris((s) => s.updateLeadEstado);
  const removeLead = useNodaris((s) => s.removeLead);

  const [refreshing, setRefreshing] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const leadsNuevos = leads.filter((l) => l.estado === "nuevo").length;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLeads();
    setRefreshing(false);
  };

  const handleDelete = async (lead: Lead) => {
    if (!confirm(`¿Eliminar el lead de ${lead.nombre}?`)) return;
    await removeLead(lead.id);
  };

  return (
    <AppShell>
      <Header
        title="Leads"
        subtitle={
          leads.length === 0
            ? "No hay leads todavía"
            : `${leads.length} lead${leads.length !== 1 ? "s" : ""} recibido${leads.length !== 1 ? "s" : ""}${leadsNuevos > 0 ? ` · ${leadsNuevos} nuevo${leadsNuevos !== 1 ? "s" : ""}` : ""}`
        }
        action={{
          label: refreshing ? "Actualizando…" : "Actualizar",
          onClick: handleRefresh,
        }}
      />

      <div className="px-6 py-6">
        {leads.length === 0 ? (
          <EmptyState
            icon={<Inbox size={20} />}
            title="Sin leads aún"
            description="Cuando alguien complete el formulario de la landing, los leads aparecerán aquí automáticamente vía n8n."
            action={
              <Button variant="ghost" onClick={handleRefresh}>
                <RefreshCw size={14} className="mr-2" />
                Actualizar
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-surface-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-divider bg-surface-subtle">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-subtle">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-subtle">Empresa</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-subtle">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-subtle">WhatsApp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-subtle">Mensaje</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-subtle">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-subtle">Recibido</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-divider">
                {leads.map((lead) => {
                  const isExpanded = expandedId === lead.id;
                  const msgCorto = lead.mensaje && lead.mensaje.length > 60
                    ? lead.mensaje.slice(0, 60) + "…"
                    : lead.mensaje;

                  return (
                    <React.Fragment key={lead.id}>
                      <tr className="group hover:bg-surface-subtle transition">
                        {/* Nombre */}
                        <td className="px-4 py-3 font-medium text-ink whitespace-nowrap">
                          {lead.estado === "nuevo" && (
                            <span className="inline-block w-2 h-2 rounded-full bg-brand-500 mr-2 shrink-0 align-middle" />
                          )}
                          {lead.nombre}
                        </td>

                        {/* Empresa */}
                        <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                          {lead.empresa ? (
                            <span className="flex items-center gap-1.5">
                              <Building2 size={12} className="text-ink-faint shrink-0" />
                              {lead.empresa}
                            </span>
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3">
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-1.5 text-brand-600 hover:underline"
                          >
                            <Mail size={12} className="shrink-0" />
                            {lead.email}
                          </a>
                        </td>

                        {/* WhatsApp */}
                        <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                          {lead.whatsapp ? (
                            <a
                              href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-emerald-600 hover:underline"
                            >
                              <Phone size={12} className="shrink-0" />
                              {lead.whatsapp}
                            </a>
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>

                        {/* Mensaje (truncado, expandible) */}
                        <td className="px-4 py-3 text-ink-soft max-w-[220px]">
                          {lead.mensaje ? (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                              className="flex items-start gap-1.5 text-left hover:text-ink transition"
                            >
                              <MessageSquare size={12} className="text-ink-faint shrink-0 mt-0.5" />
                              <span>{isExpanded ? lead.mensaje : msgCorto}</span>
                            </button>
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="px-4 py-3">
                          <EstadoSelector lead={lead} onUpdate={updateLeadEstado} />
                        </td>

                        {/* Fecha */}
                        <td className="px-4 py-3 text-ink-faint text-xs whitespace-nowrap">
                          {formatFecha(lead.creado)}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(lead)}
                            className="opacity-0 group-hover:opacity-100 inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-rose-50 hover:text-danger transition focus-ring"
                            title="Eliminar lead"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cards resumen */}
      {leads.length > 0 && (
        <div className="px-6 pb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ESTADOS.map((e) => {
            const count = leads.filter((l) => l.estado === e.value).length;
            return (
              <Card key={e.value} className="p-4 flex flex-col gap-1">
                <Badge tone={e.tone} dot>{e.label}</Badge>
                <p className="text-2xl font-bold text-ink mt-1">{count}</p>
                <p className="text-xs text-ink-faint">{count === 1 ? "lead" : "leads"}</p>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

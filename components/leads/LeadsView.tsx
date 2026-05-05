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
  Plus,
  Upload,
  Filter,
  X,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Header } from "@/components/shell/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeadModal } from "./LeadModal";
import { LeadsImportModal } from "./LeadsImportModal";
import { LeadAnalyzeModal } from "./LeadAnalyzeModal";
import { LeadConversationDrawer } from "./LeadConversationDrawer";
import { useNodaris } from "@/lib/store";
import { cn } from "@/lib/utils";
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

// ─── Selector de estado (por fila) ────────────────────────────────────────────

interface EstadoSelectorProps {
  lead: Lead;
  onUpdate: (id: string, estado: EstadoLead) => Promise<void>;
}

function EstadoSelector({ lead, onUpdate }: EstadoSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const info = estadoInfo(lead.estado);

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

// ─── Encabezado con filtro ────────────────────────────────────────────────────

interface FilterableHeaderProps {
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
  align?: "left" | "right";
}

function FilterableHeader({ label, active, open, onToggle, onClose, children, align = "left" }: FilterableHeaderProps) {
  const ref = React.useRef<HTMLTableCellElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <th ref={ref} className="px-4 py-3 text-left relative">
      <button
        onClick={onToggle}
        className={cn(
          "group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition focus-ring rounded-md -mx-1 px-1",
          active ? "text-brand-600 dark:text-brand-400" : "text-ink-subtle hover:text-ink",
        )}
      >
        {label}
        <Filter
          size={11}
          className={cn(
            "transition",
            active
              ? "text-brand-600 dark:text-brand-400 fill-brand-600/20 dark:fill-brand-400/20"
              : "text-ink-faint opacity-0 group-hover:opacity-100",
          )}
        />
        {active && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-1 z-40 w-64 rounded-xl border border-surface-border bg-surface shadow-pop p-3",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children}
        </div>
      )}
    </th>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────

type ColumnKey = "nombre" | "empresa" | "email" | "whatsapp" | "estado";

interface Filters {
  nombre: string;
  empresa: string;
  email: string;
  whatsapp: string;
  estados: EstadoLead[]; // vacío = todos
}

const EMPTY_FILTERS: Filters = {
  nombre: "",
  empresa: "",
  email: "",
  whatsapp: "",
  estados: [],
};

export function LeadsView() {
  const leads = useNodaris((s) => s.leads);
  const refreshLeads = useNodaris((s) => s.refreshLeads);
  const updateLeadEstado = useNodaris((s) => s.updateLeadEstado);
  const removeLead = useNodaris((s) => s.removeLead);

  const [refreshing, setRefreshing] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [newOpen, setNewOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [analyzeLead, setAnalyzeLead] = React.useState<Lead | null>(null);
  const [conversationLead, setConversationLead] = React.useState<Lead | null>(null);

  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = React.useState<ColumnKey | null>(null);

  const leadsNuevos = leads.filter((l) => l.estado === "nuevo").length;

  const filtered = React.useMemo(() => {
    const matchText = (val: string | undefined, q: string) =>
      q.trim() === "" || (val ?? "").toLowerCase().includes(q.trim().toLowerCase());
    return leads.filter((l) =>
      matchText(l.nombre, filters.nombre) &&
      matchText(l.empresa, filters.empresa) &&
      matchText(l.email, filters.email) &&
      matchText(l.whatsapp, filters.whatsapp) &&
      (filters.estados.length === 0 || filters.estados.includes(l.estado))
    );
  }, [leads, filters]);

  const activeCount =
    (filters.nombre ? 1 : 0) +
    (filters.empresa ? 1 : 0) +
    (filters.email ? 1 : 0) +
    (filters.whatsapp ? 1 : 0) +
    (filters.estados.length > 0 ? 1 : 0);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLeads();
    setRefreshing(false);
  };

  const handleDelete = async (lead: Lead) => {
    if (!confirm(`¿Eliminar el lead de ${lead.nombre}?`)) return;
    await removeLead(lead.id);
  };

  const toggleEstado = (e: EstadoLead) => {
    setFilters((f) => ({
      ...f,
      estados: f.estados.includes(e) ? f.estados.filter((x) => x !== e) : [...f.estados, e],
    }));
  };

  const subtitle = leads.length === 0
    ? "No hay leads todavía"
    : activeCount > 0
      ? `${filtered.length} de ${leads.length} · ${activeCount} filtro${activeCount !== 1 ? "s" : ""} activo${activeCount !== 1 ? "s" : ""}`
      : `${leads.length} lead${leads.length !== 1 ? "s" : ""} recibido${leads.length !== 1 ? "s" : ""}${leadsNuevos > 0 ? ` · ${leadsNuevos} nuevo${leadsNuevos !== 1 ? "s" : ""}` : ""}`;

  return (
    <AppShell>
      <Header
        title="Leads"
        subtitle={subtitle}
        action={{
          label: "Nuevo lead",
          onClick: () => setNewOpen(true),
        }}
      />

      {/* Toolbar secundaria */}
      <div className="px-6 pt-4 flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={() => setImportOpen(true)}>
          <Upload size={14} className="mr-2" />
          Importar CSV
        </Button>
        <Button variant="ghost" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={14} className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Actualizando…" : "Actualizar"}
        </Button>
        {activeCount > 0 && (
          <Button variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
            <X size={14} className="mr-2" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Cards resumen — KPIs por estado */}
      {leads.length > 0 && (
        <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
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

      <div className="px-6 py-6">
        {leads.length === 0 ? (
          <EmptyState
            icon={<Inbox size={20} />}
            title="Sin leads aún"
            description="Cargá un lead a mano, importá un CSV, o esperá a que lleguen desde la landing vía n8n."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={() => setNewOpen(true)}>
                  <Plus size={14} className="mr-2" />
                  Nuevo lead
                </Button>
                <Button variant="ghost" onClick={() => setImportOpen(true)}>
                  <Upload size={14} className="mr-2" />
                  Importar CSV
                </Button>
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-surface-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-divider bg-surface-subtle">
                  <FilterableHeader
                    label="Nombre"
                    active={filters.nombre !== ""}
                    open={openFilter === "nombre"}
                    onToggle={() => setOpenFilter(openFilter === "nombre" ? null : "nombre")}
                    onClose={() => setOpenFilter(null)}
                  >
                    <TextFilter
                      value={filters.nombre}
                      onChange={(v) => setFilters({ ...filters, nombre: v })}
                      onClose={() => setOpenFilter(null)}
                      placeholder="Buscar por nombre…"
                    />
                  </FilterableHeader>

                  <FilterableHeader
                    label="Empresa"
                    active={filters.empresa !== ""}
                    open={openFilter === "empresa"}
                    onToggle={() => setOpenFilter(openFilter === "empresa" ? null : "empresa")}
                    onClose={() => setOpenFilter(null)}
                  >
                    <TextFilter
                      value={filters.empresa}
                      onChange={(v) => setFilters({ ...filters, empresa: v })}
                      onClose={() => setOpenFilter(null)}
                      placeholder="Buscar por empresa…"
                    />
                  </FilterableHeader>

                  <FilterableHeader
                    label="Email"
                    active={filters.email !== ""}
                    open={openFilter === "email"}
                    onToggle={() => setOpenFilter(openFilter === "email" ? null : "email")}
                    onClose={() => setOpenFilter(null)}
                  >
                    <TextFilter
                      value={filters.email}
                      onChange={(v) => setFilters({ ...filters, email: v })}
                      onClose={() => setOpenFilter(null)}
                      placeholder="Buscar por email…"
                    />
                  </FilterableHeader>

                  <FilterableHeader
                    label="WhatsApp"
                    active={filters.whatsapp !== ""}
                    open={openFilter === "whatsapp"}
                    onToggle={() => setOpenFilter(openFilter === "whatsapp" ? null : "whatsapp")}
                    onClose={() => setOpenFilter(null)}
                  >
                    <TextFilter
                      value={filters.whatsapp}
                      onChange={(v) => setFilters({ ...filters, whatsapp: v })}
                      onClose={() => setOpenFilter(null)}
                      placeholder="Buscar por WhatsApp…"
                    />
                  </FilterableHeader>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-subtle">Mensaje</th>

                  <FilterableHeader
                    label="Estado"
                    active={filters.estados.length > 0}
                    open={openFilter === "estado"}
                    onToggle={() => setOpenFilter(openFilter === "estado" ? null : "estado")}
                    onClose={() => setOpenFilter(null)}
                  >
                    <div className="space-y-1.5">
                      <p className="text-2xs font-semibold uppercase tracking-wider text-ink-faint mb-1">
                        Mostrar estados
                      </p>
                      {ESTADOS.map((e) => {
                        const checked = filters.estados.includes(e.value);
                        return (
                          <label
                            key={e.value}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-subtle cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleEstado(e.value)}
                              className="rounded border-surface-border text-brand-600 focus-ring"
                            />
                            <Badge tone={e.tone} dot>{e.label}</Badge>
                          </label>
                        );
                      })}
                      {filters.estados.length > 0 && (
                        <button
                          onClick={() => setFilters({ ...filters, estados: [] })}
                          className="w-full text-xs text-ink-subtle hover:text-ink mt-1 pt-2 border-t border-surface-divider transition"
                        >
                          Limpiar selección
                        </button>
                      )}
                    </div>
                  </FilterableHeader>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-subtle">Recibido</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-divider">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <p className="text-sm text-ink-subtle">No hay leads que coincidan con los filtros.</p>
                      <button
                        onClick={() => setFilters(EMPTY_FILTERS)}
                        className="text-xs text-brand-600 hover:underline mt-1"
                      >
                        Limpiar filtros
                      </button>
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => {
                    const isExpanded = expandedId === lead.id;
                    const msgCorto = lead.mensaje && lead.mensaje.length > 60
                      ? lead.mensaje.slice(0, 60) + "…"
                      : lead.mensaje;

                    return (
                      <tr key={lead.id} className="group hover:bg-surface-subtle transition">
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          {lead.estado === "nuevo" && (
                            <span className="inline-block w-2 h-2 rounded-full bg-brand-500 mr-2 shrink-0 align-middle" />
                          )}
                          <button
                            onClick={() => setConversationLead(lead)}
                            className="text-ink hover:text-brand-600 dark:hover:text-brand-400 hover:underline underline-offset-2 transition focus-ring rounded"
                            title="Ver conversación en Gmail"
                          >
                            {lead.nombre}
                          </button>
                        </td>
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
                        <td className="px-4 py-3">
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-1.5 text-brand-600 hover:underline"
                          >
                            <Mail size={12} className="shrink-0" />
                            {lead.email}
                          </a>
                        </td>
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
                        <td className="px-4 py-3">
                          <EstadoSelector lead={lead} onUpdate={updateLeadEstado} />
                        </td>
                        <td className="px-4 py-3 text-ink-faint text-xs whitespace-nowrap">
                          {formatFecha(lead.creado)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setAnalyzeLead(lead)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-300 transition focus-ring"
                              title="Analizar y redactar email"
                            >
                              <Sparkles size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(lead)}
                              className="opacity-0 group-hover:opacity-100 inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-rose-50 hover:text-danger dark:hover:bg-rose-500/10 transition focus-ring"
                              title="Eliminar lead"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LeadModal open={newOpen} onClose={() => setNewOpen(false)} />
      <LeadsImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <LeadAnalyzeModal
        open={analyzeLead !== null}
        onClose={() => setAnalyzeLead(null)}
        lead={analyzeLead}
      />
      <LeadConversationDrawer
        open={conversationLead !== null}
        onClose={() => setConversationLead(null)}
        lead={conversationLead}
      />
    </AppShell>
  );
}

// ─── Filtro de texto reusable ─────────────────────────────────────────────────

function TextFilter({
  value,
  onChange,
  onClose,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  placeholder: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);
  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => { if (e.key === "Enter") onClose(); }}
      />
      <div className="flex items-center justify-between">
        <button
          onClick={() => onChange("")}
          disabled={value === ""}
          className="text-xs text-ink-subtle hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Limpiar
        </button>
        <button
          onClick={onClose}
          className="text-xs text-brand-600 hover:underline"
        >
          Listo
        </button>
      </div>
    </div>
  );
}

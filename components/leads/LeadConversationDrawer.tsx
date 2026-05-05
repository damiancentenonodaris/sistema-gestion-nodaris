"use client";

import * as React from "react";
import {
  X,
  RefreshCw,
  MessageSquare,
  Loader2,
  AlertCircle,
  Building2,
  Mail,
} from "lucide-react";
import type { Lead } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
}

interface ThreadMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  internalDate: number;
  snippet: string;
  html: string;
  text: string;
}

const URL_THREAD = process.env.NEXT_PUBLIC_N8N_LEAD_THREAD_URL || "";

function asString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(asString).filter(Boolean).join(", ");
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.value === "string") return o.value;
    if (typeof o.address === "string") {
      return o.name ? `${o.name} <${o.address}>` : String(o.address);
    }
    if (typeof o.email === "string") return String(o.email);
  }
  return String(v);
}

function fromName(from: string) {
  // "Nombre <email@x>" → "Nombre"; si no hay nombre, devuelve el email.
  const m = from.match(/^(.*?)<.*?>$/);
  return (m ? m[1].trim().replace(/^"|"$/g, "") : from).trim();
}

function formatDate(internal: number, fallback: string) {
  if (internal > 0) {
    return new Date(internal).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
  }
  return fallback;
}

export function LeadConversationDrawer({ open, onClose, lead }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ThreadMessage[]>([]);

  const fetchThread = React.useCallback(async (l: Lead) => {
    if (!URL_THREAD) {
      setError("Falta configurar NEXT_PUBLIC_N8N_LEAD_THREAD_URL en .env.local");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(URL_THREAD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: l.email }),
      });
      if (!res.ok) throw new Error(`Webhook respondió ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open && lead) {
      setMessages([]);
      setError(null);
      fetchThread(lead);
    }
  }, [open, lead, fetchThread]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !lead) return null;

  const isFromUs = (msg: ThreadMessage) => {
    const from = asString(msg.from);
    return from !== "" && !from.toLowerCase().includes(lead.email.toLowerCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-4xl max-h-[88vh] bg-surface rounded-2xl border border-surface-border shadow-pop flex flex-col animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-surface-border">
          <div className="min-w-0 flex-1">
            <p className="text-2xs uppercase tracking-wider font-semibold text-ink-faint">
              Conversación
            </p>
            <h2 className="text-base font-semibold text-ink truncate mt-0.5">{lead.nombre}</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-ink-subtle min-w-0">
              {lead.empresa && (
                <span className="inline-flex items-center gap-1 truncate">
                  <Building2 size={11} className="text-ink-faint shrink-0" />
                  {lead.empresa}
                </span>
              )}
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center gap-1 truncate text-brand-600 hover:underline"
              >
                <Mail size={11} className="shrink-0" />
                {lead.email}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => fetchThread(lead)}
              disabled={loading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-subtle hover:bg-surface-subtle hover:text-ink transition focus-ring disabled:opacity-40"
              title="Refrescar"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-subtle hover:bg-surface-subtle hover:text-ink transition focus-ring"
              title="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-surface-page">
          {loading && messages.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-12 text-ink-subtle">
              <Loader2 size={18} className="animate-spin text-brand-500" />
              <span className="text-sm">Buscando conversación en Gmail…</span>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/20 px-3 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
                <AlertCircle size={14} />
                Error al cargar la conversación
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 break-all">{error}</p>
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4">
              <MessageSquare size={28} className="text-ink-faint mb-3" />
              <p className="text-sm font-semibold text-ink">Sin conversación todavía</p>
              <p className="text-xs text-ink-subtle mt-1 max-w-xs">
                No hay mails en Gmail con este contacto. Envíale uno desde el botón ✨ para empezar.
              </p>
            </div>
          )}

          {messages.map((m) => {
            const fromUs = isFromUs(m);
            return (
              <div key={m.id} className={`flex ${fromUs ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                    fromUs
                      ? "bg-brand-600 text-white"
                      : "bg-surface text-ink border border-surface-border shadow-soft"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between gap-3 mb-1.5 text-2xs ${
                      fromUs ? "text-brand-100" : "text-ink-faint"
                    }`}
                  >
                    <span className="truncate font-medium">{fromUs ? "Vos" : fromName(asString(m.from))}</span>
                    <span className="shrink-0">{formatDate(m.internalDate, asString(m.date))}</span>
                  </div>
                  {asString(m.subject) && (
                    <p
                      className={`text-sm font-semibold mb-1 ${fromUs ? "text-white" : "text-ink"}`}
                    >
                      {asString(m.subject)}
                    </p>
                  )}
                  <div
                    className={`text-sm max-w-none [&_p]:my-1 [&_a]:underline [&_ul]:my-1 [&_li]:ml-4 break-words ${
                      fromUs ? "text-white/95" : "text-ink-soft"
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: asString(m.html) || `<p>${asString(m.text || m.snippet).replace(/\n/g, "<br/>")}</p>`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        {messages.length > 0 && (
          <div className="px-5 py-2 border-t border-surface-border bg-surface text-2xs text-ink-faint">
            {messages.length} mensaje{messages.length !== 1 ? "s" : ""} · sincronizado desde Gmail
          </div>
        )}
      </aside>
    </div>
  );
}

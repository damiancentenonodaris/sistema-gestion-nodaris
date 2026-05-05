"use client";

import * as React from "react";
import { Sparkles, Send, AlertCircle, Loader2, CheckCircle2, Eye, Code as CodeIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { useNodaris } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
}

interface AnalysisResult {
  ok: boolean;
  insights: string[];
  asunto: string;
  cuerpo: string;
  fetched: boolean;
}

const ANALYZE_URL = process.env.NEXT_PUBLIC_N8N_LEAD_ANALYZE_URL || "";
const SEND_URL = process.env.NEXT_PUBLIC_N8N_LEAD_SEND_URL || "";

export function LeadAnalyzeModal({ open, onClose, lead }: Props) {
  const updateLeadEstado = useNodaris((s) => s.updateLeadEstado);

  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Campos editables
  const [asunto, setAsunto] = React.useState("");
  const [cuerpo, setCuerpo] = React.useState("");
  const [tab, setTab] = React.useState<"editor" | "preview">("editor");

  // Estado del envío
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);

  const run = React.useCallback(async (l: Lead) => {
    if (!ANALYZE_URL) {
      setError("Falta configurar NEXT_PUBLIC_N8N_LEAD_ANALYZE_URL en .env.local");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setSent(false);
    setSendError(null);
    try {
      const res = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: l.id,
          nombre: l.nombre,
          empresa: l.empresa ?? "",
          email: l.email,
          whatsapp: l.whatsapp ?? "",
          mensaje: l.mensaje ?? "",
        }),
      });
      if (!res.ok) {
        throw new Error(`Webhook respondió ${res.status}: ${await res.text()}`);
      }
      const data = (await res.json()) as AnalysisResult;
      setResult(data);
      setAsunto(data.asunto || "");
      setCuerpo(data.cuerpo || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-run al abrir
  React.useEffect(() => {
    if (open && lead) {
      setResult(null);
      setError(null);
      setAsunto("");
      setCuerpo("");
      setSent(false);
      setSendError(null);
      setTab("editor");
      run(lead);
    }
  }, [open, lead, run]);

  const sendMail = async () => {
    if (!lead || !asunto.trim() || !cuerpo.trim()) return;
    if (!SEND_URL) {
      setSendError("Falta configurar NEXT_PUBLIC_N8N_LEAD_SEND_URL en .env.local");
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          to: lead.email,
          toName: lead.nombre,
          subject: asunto,
          html: cuerpo,
        }),
      });
      if (!res.ok) {
        throw new Error(`Webhook respondió ${res.status}: ${await res.text()}`);
      }
      setSent(true);
      // Marca el lead como contactado de forma optimista.
      if (lead.estado !== "contactado") {
        await updateLeadEstado(lead.id, "contactado");
      }
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSending(false);
    }
  };

  const canSend = !!lead && asunto.trim() !== "" && cuerpo.trim() !== "" && !sending && !sent;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lead ? `Analizar negocio · ${lead.empresa || lead.nombre}` : "Analizar lead"}
      description="El agente visita el sitio del lead, redacta un email y vos lo editás antes de enviar."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={sending}>Cerrar</Button>
          {result && lead && (
            <>
              <Button variant="ghost" onClick={() => run(lead)} disabled={sending || loading}>
                <Sparkles size={14} className="mr-2" />
                Regenerar
              </Button>
              <Button onClick={sendMail} disabled={!canSend}>
                {sending ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Enviando…
                  </>
                ) : sent ? (
                  <>
                    <CheckCircle2 size={14} className="mr-2" />
                    Enviado
                  </>
                ) : (
                  <>
                    <Send size={14} className="mr-2" />
                    Enviar mail
                  </>
                )}
              </Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-ink-subtle">
            <Loader2 size={18} className="animate-spin text-brand-500" />
            <span className="text-sm">Analizando el negocio del lead…</span>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/20 px-3 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
              <AlertCircle size={14} />
              No se pudo generar el email
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 break-all">{error}</p>
            {lead && (
              <Button variant="ghost" onClick={() => run(lead)} className="mt-2">
                Reintentar
              </Button>
            )}
          </div>
        )}

        {result && !loading && !error && (
          <>
            {/* Estado del scraping */}
            <div className="text-2xs uppercase tracking-wider font-semibold text-ink-faint">
              {result.fetched
                ? "✓ Sitio leído correctamente"
                : "⚠ No se pudo leer el sitio — análisis basado solo en empresa/mensaje"}
            </div>

            {/* Insights */}
            {result.insights && result.insights.length > 0 && (
              <div className="rounded-xl border border-surface-border bg-surface-subtle px-4 py-3">
                <p className="text-2xs uppercase tracking-wider font-semibold text-ink-faint mb-2">
                  Insights del negocio
                </p>
                <ul className="space-y-1.5">
                  {result.insights.map((i, idx) => (
                    <li key={idx} className="text-sm text-ink-soft flex gap-2">
                      <span className="text-brand-500 shrink-0">·</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Destinatario (solo lectura) */}
            {lead && (
              <Field label="Para">
                <Input value={lead.email} readOnly className="text-ink-soft cursor-not-allowed" />
              </Field>
            )}

            {/* Asunto editable */}
            <Field label="Asunto" required>
              <Input
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Asunto del email"
              />
            </Field>

            {/* Cuerpo: tabs editor / preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-ink-soft">
                  Cuerpo <span className="text-brand-600">*</span>
                </span>
                <div className="inline-flex rounded-md border border-surface-border bg-surface-subtle p-0.5">
                  <button
                    type="button"
                    onClick={() => setTab("editor")}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold rounded transition",
                      tab === "editor" ? "bg-surface text-ink shadow-soft" : "text-ink-subtle hover:text-ink"
                    )}
                  >
                    <CodeIcon size={11} />
                    Editor (HTML)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("preview")}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold rounded transition",
                      tab === "preview" ? "bg-surface text-ink shadow-soft" : "text-ink-subtle hover:text-ink"
                    )}
                  >
                    <Eye size={11} />
                    Vista previa
                  </button>
                </div>
              </div>
              {tab === "editor" ? (
                <Textarea
                  value={cuerpo}
                  onChange={(e) => setCuerpo(e.target.value)}
                  className="min-h-[220px] font-mono text-xs"
                  placeholder="<p>Hola...</p>"
                />
              ) : (
                <div
                  className="prose prose-sm max-w-none text-sm text-ink rounded-lg border border-surface-border bg-surface px-4 py-3 min-h-[220px] [&_p]:my-2 [&_ul]:my-2 [&_li]:ml-4 [&_strong]:text-ink"
                  dangerouslySetInnerHTML={{ __html: cuerpo }}
                />
              )}
              <p className="text-2xs text-ink-faint mt-1">
                HTML simple soportado: <code>&lt;p&gt;</code>, <code>&lt;strong&gt;</code>, <code>&lt;ul&gt;</code>, <code>&lt;li&gt;</code>, <code>&lt;a href&gt;</code>.
              </p>
            </div>

            {/* Estado del envío */}
            {sent && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-3 py-2 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={14} />
                Email enviado a {lead?.email}. El lead se marcó como contactado.
              </div>
            )}
            {sendError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/20 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
                  <AlertCircle size={14} />
                  No se pudo enviar
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 break-all">{sendError}</p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

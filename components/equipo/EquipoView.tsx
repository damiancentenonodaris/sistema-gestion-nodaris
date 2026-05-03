"use client";

import * as React from "react";
import {
  UserPlus,
  Mail,
  Pencil,
  Trash2,
  Briefcase,
  Users2,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Header } from "@/components/shell/Header";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Input";
import { useNodaris } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import type { Persona } from "@/types";

// ─── Modal de persona ─────────────────────────────────────────────────────────

interface PersonaModalProps {
  open: boolean;
  onClose: () => void;
  persona?: Persona | null;
  onSaved: () => void;
}

function PersonaModal({ open, onClose, persona, onSaved }: PersonaModalProps) {
  const [form, setForm] = React.useState({ nombre: "", email: "", rol: "" });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (persona) {
      setForm({ nombre: persona.nombre, email: persona.email, rol: persona.rol });
    } else {
      setForm({ nombre: "", email: "", rol: "" });
    }
    setError(null);
  }, [persona, open]);

  const valido = form.nombre.trim() && form.email.trim() && form.rol.trim();

  const submit = async () => {
    if (!valido) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    let err;
    if (persona) {
      ({ error: err } = await supabase.from("personas").update(form).eq("id", persona.id));
    } else {
      ({ error: err } = await supabase.from("personas").insert(form));
    }
    setLoading(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={persona ? "Editar miembro" : "Nuevo miembro"}
      description={persona ? "Actualizá los datos del miembro del equipo" : "Agregá un nuevo miembro al equipo de Nodaris"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!valido || loading}>
            {loading ? "Guardando…" : persona ? "Guardar cambios" : "Crear miembro"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre completo" required>
          <Input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Damián Cenci"
            autoFocus
          />
        </Field>
        <Field label="Email" required>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="damian@nodaris.io"
          />
        </Field>
        <Field label="Rol" required>
          <Input
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
            placeholder="Fundador · Estrategia"
          />
        </Field>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export function EquipoView() {
  const personas = useNodaris((s) => s.personas);
  const tareas = useNodaris((s) => s.tareas);
  const fetchInitialData = useNodaris((s) => s.fetchInitialData);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Persona | null>(null);

  const open = (p?: Persona) => {
    setEditing(p ?? null);
    setModalOpen(true);
  };

  const eliminar = async (p: Persona) => {
    if (!confirm(`¿Eliminar a ${p.nombre} del equipo?`)) return;
    const supabase = createClient();
    await supabase.from("personas").delete().eq("id", p.id);
    fetchInitialData();
  };

  const tareasActivasPor = (id: string) =>
    tareas.filter((t) => t.asignadoA === id && t.estado !== "finalizado").length;

  return (
    <AppShell>
      <Header
        title="Equipo"
        subtitle={`${personas.length} ${personas.length === 1 ? "miembro" : "miembros"} en Nodaris Studio`}
        action={{ label: "Nuevo miembro", onClick: () => open() }}
      />

      <div className="px-6 py-6">
        {personas.length === 0 ? (
          <EmptyState
            icon={<Users2 size={20} />}
            title="El equipo está vacío"
            description="Agregá el primer miembro para empezar a asignar tareas."
            action={<Button onClick={() => open()}>Nuevo miembro</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {personas.map((p) => {
              const activas = tareasActivasPor(p.id);
              return (
                <Card key={p.id} className="p-5 flex flex-col gap-4 group">
                  {/* Header de la card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.nombre} size="lg" />
                      <div className="min-w-0">
                        <p className="font-semibold text-ink leading-tight truncate">{p.nombre}</p>
                        <p className="text-xs text-ink-subtle truncate mt-0.5">{p.rol}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                      <button
                        onClick={() => open(p)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-surface-subtle hover:text-ink focus-ring"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => eliminar(p)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-rose-50 hover:text-danger focus-ring"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-xs text-ink-soft">
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-ink-faint shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase size={12} className="text-ink-faint shrink-0" />
                      <span>{activas > 0 ? `${activas} tarea${activas !== 1 ? "s" : ""} activa${activas !== 1 ? "s" : ""}` : "Sin tareas activas"}</span>
                    </div>
                  </div>

                  {/* Badge de tareas */}
                  {activas > 0 && (
                    <div className="mt-auto pt-3 border-t border-surface-divider">
                      <Badge tone="blue" dot>{activas} en curso</Badge>
                    </div>
                  )}
                </Card>
              );
            })}

            {/* Card de invitar */}
            <button
              onClick={() => open()}
              className="rounded-2xl border-2 border-dashed border-surface-border hover:border-brand-300 hover:bg-brand-50/30 transition-all p-5 flex flex-col items-center justify-center gap-2 text-ink-subtle hover:text-brand-600 min-h-[160px]"
            >
              <UserPlus size={20} />
              <span className="text-sm font-medium">Agregar miembro</span>
            </button>
          </div>
        )}
      </div>

      <PersonaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        persona={editing}
        onSaved={fetchInitialData}
      />
    </AppShell>
  );
}

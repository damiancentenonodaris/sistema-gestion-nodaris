"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { useNodaris } from "@/lib/store";
import type { EstadoLead } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ESTADO_OPTIONS: { value: EstadoLead; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "revisado", label: "Revisado" },
  { value: "contactado", label: "Contactado" },
  { value: "descartado", label: "Descartado" },
];

const EMPTY = {
  nombre: "",
  empresa: "",
  email: "",
  whatsapp: "",
  mensaje: "",
  estado: "nuevo" as EstadoLead,
};

export function LeadModal({ open, onClose }: Props) {
  const addLead = useNodaris((s) => s.addLead);
  const [form, setForm] = React.useState(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError(null);
    }
  }, [open]);

  const valido = form.nombre.trim() !== "" && form.email.trim() !== "";

  const submit = async () => {
    if (!valido) return;
    setSaving(true);
    setError(null);
    const res = await addLead({
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      empresa: form.empresa.trim() || undefined,
      whatsapp: form.whatsapp.trim() || undefined,
      mensaje: form.mensaje.trim() || undefined,
      estado: form.estado,
    });
    setSaving(false);
    if (!res) {
      setError("No se pudo guardar el lead. Revisá la consola.");
      return;
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo lead"
      description="Cargá un lead a mano (referidos, llamadas, eventos…)"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={!valido || saving}>
            {saving ? "Guardando…" : "Crear lead"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre" required>
          <Input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Nombre y apellido"
          />
        </Field>
        <Field label="Empresa">
          <Input
            value={form.empresa}
            onChange={(e) => setForm({ ...form, empresa: e.target.value })}
            placeholder="Razón social"
          />
        </Field>
        <Field label="Email" required>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="hola@empresa.com"
          />
        </Field>
        <Field label="WhatsApp">
          <Input
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            placeholder="+54 11 0000-0000"
          />
        </Field>
        <Field label="Estado">
          <Select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoLead })}
          >
            {ESTADO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Mensaje" className="sm:col-span-2">
          <Textarea
            value={form.mensaje}
            onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
            placeholder="Contexto, origen del contacto, próximo paso…"
          />
        </Field>
      </div>
      {error && <p className="text-sm text-danger mt-3">{error}</p>}
    </Modal>
  );
}

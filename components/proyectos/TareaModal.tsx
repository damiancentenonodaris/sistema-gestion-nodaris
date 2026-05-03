"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { useNodaris } from "@/lib/store";
import type { EstadoTarea, Prioridad, Tarea } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  proyectoId: string;
  tarea?: Tarea | null;
}

export function TareaModal({ open, onClose, proyectoId, tarea }: Props) {
  const personas = useNodaris((s) => s.personas);
  const addTarea = useNodaris((s) => s.addTarea);
  const updateTarea = useNodaris((s) => s.updateTarea);

  const [form, setForm] = React.useState<Omit<Tarea, "id" | "creado">>({
    proyectoId,
    titulo: "",
    descripcion: "",
    asignadoA: personas[0]?.id,
    estado: "pendiente" as EstadoTarea,
    prioridad: "media" as Prioridad,
    fechaVencimiento: "",
  });

  React.useEffect(() => {
    if (tarea) {
      const { id, creado, ...rest } = tarea;
      setForm(rest);
    } else {
      setForm({
        proyectoId,
        titulo: "",
        descripcion: "",
        asignadoA: personas[0]?.id,
        estado: "pendiente",
        prioridad: "media",
        fechaVencimiento: "",
      });
    }
  }, [tarea, open, proyectoId, personas]);

  const valido = form.titulo.trim().length > 0;

  const submit = () => {
    if (!valido) return;
    const payload = {
      ...form,
      fechaVencimiento: form.fechaVencimiento || undefined,
      descripcion: form.descripcion || undefined,
    };
    if (tarea) updateTarea(tarea.id, payload);
    else addTarea(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tarea ? "Editar tarea" : "Nueva tarea"}
      description={tarea ? "Actualizá los datos de la tarea" : "Definí una unidad de trabajo asignable"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!valido}>
            {tarea ? "Guardar cambios" : "Crear tarea"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Título" required className="sm:col-span-2">
          <Input
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Diseñar wireframes del hero"
            autoFocus
          />
        </Field>
        <Field label="Asignar a">
          <Select
            value={form.asignadoA ?? ""}
            onChange={(e) => setForm({ ...form, asignadoA: e.target.value || undefined })}
          >
            <option value="">— Sin asignar —</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Prioridad">
          <Select
            value={form.prioridad}
            onChange={(e) => setForm({ ...form, prioridad: e.target.value as Prioridad })}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </Select>
        </Field>
        <Field label="Estado">
          <Select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoTarea })}
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="finalizado">Finalizada</option>
          </Select>
        </Field>
        <Field label="Vencimiento" hint="Opcional">
          <Input
            type="date"
            value={form.fechaVencimiento ?? ""}
            onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
          />
        </Field>
        <Field label="Descripción" className="sm:col-span-2">
          <Textarea
            value={form.descripcion ?? ""}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Detalles, criterios de aceptación, links…"
          />
        </Field>
      </div>
    </Modal>
  );
}

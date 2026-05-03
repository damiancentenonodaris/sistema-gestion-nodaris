"use client";

import * as React from "react";
import { FolderOpen } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { useNodaris } from "@/lib/store";
import { normalizeDriveUrl } from "@/lib/utils";
import type { EstadoProyecto, Proyecto, TipoProyecto } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  proyecto?: Proyecto | null;
}

export function ProyectoModal({ open, onClose, proyecto }: Props) {
  const clientes = useNodaris((s) => s.clientes);
  const addProyecto = useNodaris((s) => s.addProyecto);
  const updateProyecto = useNodaris((s) => s.updateProyecto);

  const [form, setForm] = React.useState<Omit<Proyecto, "id">>({
    clienteId: clientes[0]?.id ?? "",
    titulo: "",
    tipo: "landing" as TipoProyecto,
    estado: "pendiente" as EstadoProyecto,
    precio: 0,
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaEntrega: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    descripcion: "",
    driveUrl: "",
  });

  React.useEffect(() => {
    if (proyecto) {
      const { id, ...rest } = proyecto;
      setForm({ ...rest, driveUrl: rest.driveUrl ?? "" });
    } else {
      setForm({
        clienteId: clientes[0]?.id ?? "",
        titulo: "",
        tipo: "landing",
        estado: "pendiente",
        precio: 0,
        fechaInicio: new Date().toISOString().slice(0, 10),
        fechaEntrega: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        descripcion: "",
        driveUrl: "",
      });
    }
  }, [proyecto, open, clientes]);

  const driveUrlTrim = form.driveUrl.trim();
  const driveUrlInvalido = driveUrlTrim.length > 0 && !normalizeDriveUrl(driveUrlTrim);
  const valido =
    form.titulo.trim() &&
    form.clienteId &&
    driveUrlTrim.length > 0 &&
    !driveUrlInvalido;

  const submit = () => {
    if (!valido) return;
    if (proyecto) {
      updateProyecto(proyecto.id, form);
    } else {
      addProyecto(form);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={proyecto ? "Editar proyecto" : "Nuevo proyecto"}
      description={proyecto ? "Actualizá los datos del proyecto" : "Sumá un proyecto a un cliente"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!valido}>
            {proyecto ? "Guardar cambios" : "Crear proyecto"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Título" required className="sm:col-span-2">
          <Input
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Landing temporada otoño"
          />
        </Field>
        <Field label="Cliente" required>
          <Select
            value={form.clienteId}
            onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
          >
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} · {c.empresa}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tipo">
          <Select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoProyecto })}
          >
            <option value="landing">Landing page</option>
            <option value="saas">SaaS</option>
          </Select>
        </Field>
        <Field label="Estado">
          <Select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoProyecto })}
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="finalizado">Finalizado</option>
          </Select>
        </Field>
        <Field label="Precio (USD)">
          <Input
            type="number"
            min={0}
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
          />
        </Field>
        <Field label="Fecha de inicio">
          <Input
            type="date"
            value={form.fechaInicio}
            onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
          />
        </Field>
        <Field label="Fecha de entrega">
          <Input
            type="date"
            value={form.fechaEntrega}
            onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })}
          />
        </Field>
        <Field label="Descripción" className="sm:col-span-2">
          <Textarea
            value={form.descripcion ?? ""}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Alcance del proyecto, hitos, integraciones…"
          />
        </Field>
        <Field
          label="Carpeta del proyecto en Google Drive"
          required
          className="sm:col-span-2"
          error={driveUrlInvalido ? "Tiene que ser una URL válida (https://…)." : undefined}
          hint="Pegá el link público de Drive donde subís las actualizaciones del proyecto."
        >
          <Input
            type="url"
            value={form.driveUrl}
            onChange={(e) => setForm({ ...form, driveUrl: e.target.value })}
            placeholder="https://drive.google.com/drive/folders/…"
            iconLeft={<FolderOpen size={15} />}
          />
        </Field>
      </div>
    </Modal>
  );
}

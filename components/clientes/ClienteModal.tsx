"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { useNodaris } from "@/lib/store";
import type { Cliente, EstadoCliente } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
}

export function ClienteModal({ open, onClose, cliente }: Props) {
  const addCliente = useNodaris((s) => s.addCliente);
  const updateCliente = useNodaris((s) => s.updateCliente);

  const [form, setForm] = React.useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    estado: "lead" as EstadoCliente,
    valor: 0,
    notas: "",
  });

  React.useEffect(() => {
    if (cliente) {
      setForm({
        nombre: cliente.nombre,
        empresa: cliente.empresa,
        email: cliente.email,
        telefono: cliente.telefono,
        estado: cliente.estado,
        valor: cliente.valor,
        notas: cliente.notas ?? "",
      });
    } else {
      setForm({
        nombre: "",
        empresa: "",
        email: "",
        telefono: "",
        estado: "lead",
        valor: 0,
        notas: "",
      });
    }
  }, [cliente, open]);

  const valido = form.nombre.trim() && form.email.trim() && form.empresa.trim();

  const submit = () => {
    if (!valido) return;
    if (cliente) {
      updateCliente(cliente.id, form);
    } else {
      addCliente(form);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={cliente ? "Editar cliente" : "Nuevo cliente"}
      description={cliente ? "Actualizá los datos del cliente" : "Sumá un nuevo cliente al pipeline"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!valido}>
            {cliente ? "Guardar cambios" : "Crear cliente"}
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
        <Field label="Empresa" required>
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
        <Field label="Teléfono">
          <Input
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="+54 11 0000-0000"
          />
        </Field>
        <Field label="Estado">
          <Select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoCliente })}
          >
            <option value="lead">Lead</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </Select>
        </Field>
        <Field label="Valor estimado (USD)" hint="Suma total facturada al cliente">
          <Input
            type="number"
            min={0}
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })}
          />
        </Field>
        <Field label="Notas" className="sm:col-span-2">
          <Textarea
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            placeholder="Detalles internos, próximos pasos…"
          />
        </Field>
      </div>
    </Modal>
  );
}

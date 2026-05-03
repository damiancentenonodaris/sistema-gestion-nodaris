"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { useNodaris } from "@/lib/store";
import type { EstadoPago, MetodoPago, Pago } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  pago?: Pago | null;
}

export function PagoModal({ open, onClose, pago }: Props) {
  const clientes = useNodaris((s) => s.clientes);
  const proyectos = useNodaris((s) => s.proyectos);
  const addPago = useNodaris((s) => s.addPago);
  const updatePago = useNodaris((s) => s.updatePago);

  const [form, setForm] = React.useState<Omit<Pago, "id">>({
    clienteId: clientes[0]?.id ?? "",
    proyectoId: undefined,
    monto: 0,
    estado: "pendiente" as EstadoPago,
    metodo: "transferencia" as MetodoPago,
    fecha: new Date().toISOString().slice(0, 10),
    concepto: "",
  });

  React.useEffect(() => {
    if (pago) {
      const { id, ...rest } = pago;
      setForm(rest);
    } else {
      setForm({
        clienteId: clientes[0]?.id ?? "",
        proyectoId: undefined,
        monto: 0,
        estado: "pendiente",
        metodo: "transferencia",
        fecha: new Date().toISOString().slice(0, 10),
        concepto: "",
      });
    }
  }, [pago, open, clientes]);

  const valido = form.clienteId && form.monto > 0 && form.concepto.trim();
  const proyectosCliente = proyectos.filter((p) => p.clienteId === form.clienteId);

  const submit = () => {
    if (!valido) return;
    if (pago) updatePago(pago.id, form);
    else addPago(form);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={pago ? "Editar pago" : "Registrar pago"}
      description={pago ? "Actualizá los datos del pago" : "Sumá un movimiento al historial"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!valido}>
            {pago ? "Guardar" : "Registrar"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Cliente" required>
          <Select
            value={form.clienteId}
            onChange={(e) => setForm({ ...form, clienteId: e.target.value, proyectoId: undefined })}
          >
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.empresa}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Proyecto" hint="Opcional">
          <Select
            value={form.proyectoId ?? ""}
            onChange={(e) => setForm({ ...form, proyectoId: e.target.value || undefined })}
          >
            <option value="">— Sin proyecto —</option>
            {proyectosCliente.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Monto (USD)" required>
          <Input
            type="number"
            min={0}
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: Number(e.target.value) })}
          />
        </Field>
        <Field label="Fecha">
          <Input
            type="date"
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
          />
        </Field>
        <Field label="Estado">
          <Select
            value={form.estado}
            onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoPago })}
          >
            <option value="pendiente">Pendiente</option>
            <option value="cobrado">Cobrado</option>
            <option value="vencido">Vencido</option>
          </Select>
        </Field>
        <Field label="Método">
          <Select
            value={form.metodo}
            onChange={(e) => setForm({ ...form, metodo: e.target.value as MetodoPago })}
          >
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="mercado_pago">Mercado Pago</option>
            <option value="efectivo">Efectivo</option>
          </Select>
        </Field>
        <Field label="Concepto" required className="sm:col-span-2">
          <Input
            value={form.concepto}
            onChange={(e) => setForm({ ...form, concepto: e.target.value })}
            placeholder="Anticipo 50% landing otoño"
          />
        </Field>
      </div>
    </Modal>
  );
}

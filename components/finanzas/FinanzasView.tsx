"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  CircleDollarSign,
  Clock4,
  AlertTriangle,
  TrendingUp,
  Pencil,
  Trash2,
  Receipt,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Header } from "@/components/shell/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useNodaris } from "@/lib/store";
import type { Egreso } from "@/lib/store";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { EstadoPago, Pago, SerieMensual } from "@/types";

const estadoTone = {
  cobrado: "green",
  pendiente: "amber",
  vencido: "red",
} as const;

const CashflowChart = dynamic(
  () => import("./CashflowChart").then((m) => m.CashflowChart),
  {
    ssr: false,
    loading: () => <div className="h-[240px] w-full animate-pulse rounded-lg bg-surface-page" />,
  },
);

const PagoModal = dynamic(() => import("./PagoModal").then((m) => m.PagoModal), {
  ssr: false,
});

const EgresoModal = dynamic(() => import("./EgresoModal").then((m) => m.EgresoModal), {
  ssr: false,
});

export function FinanzasView() {
  const pagos = useNodaris((s) => s.pagos);
  const egresos = useNodaris((s) => s.egresos);
  const clientes = useNodaris((s) => s.clientes);
  const proyectos = useNodaris((s) => s.proyectos);
  const removePago = useNodaris((s) => s.removePago);
  const removeEgreso = useNodaris((s) => s.removeEgreso);

  const [query, setQuery] = React.useState("");
  const [filtro, setFiltro] = React.useState<EstadoPago | "todos" | "egreso">("todos");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [egresoModalOpen, setEgresoModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Pago | null>(null);

  const cobrado = pagos.filter((p) => p.estado === "cobrado").reduce((s, p) => s + p.monto, 0);
  const pendiente = pagos.filter((p) => p.estado === "pendiente").reduce((s, p) => s + p.monto, 0);
  const totalEgresos = egresos.reduce((s, e) => s + e.monto, 0);
  const balanceNeto = cobrado - totalEgresos;

  type Movimiento = (Pago & { tipo: "ingreso" }) | (Egreso & { tipo: "egreso" });

  const movimientos: Movimiento[] = React.useMemo(() => {
    const arr: Movimiento[] = [
      ...pagos.map((p) => ({ ...p, tipo: "ingreso" as const })),
      ...egresos.map((e) => ({ ...e, tipo: "egreso" as const })),
    ];
    return arr.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [pagos, egresos]);

  const clientesPorId = React.useMemo(
    () => new Map(clientes.map((cliente) => [cliente.id, cliente])),
    [clientes],
  );

  const proyectosPorId = React.useMemo(
    () => new Map(proyectos.map((proyecto) => [proyecto.id, proyecto])),
    [proyectos],
  );

  const queryNormalizada = query.trim().toLowerCase();

  const filtrados = React.useMemo(() => movimientos.filter((m) => {
    const matchE = filtro === "todos" || 
      (filtro === "egreso" ? m.tipo === "egreso" : m.tipo === "ingreso" && m.estado === filtro);
      
    const cliente = m.tipo === "ingreso" ? clientesPorId.get(m.clienteId) : null;
    const matchQ =
      !queryNormalizada ||
      m.concepto.toLowerCase().includes(queryNormalizada) ||
      cliente?.empresa.toLowerCase().includes(queryNormalizada);
    return matchE && matchQ;
  }), [clientesPorId, filtro, movimientos, queryNormalizada]);

  const open = (p?: Pago) => {
    setEditing(p ?? null);
    setModalOpen(true);
  };

  // Generamos la data del gráfico dinámicamente con los últimos 6 meses
  const chartData = React.useMemo(() => {
    const meses: (SerieMensual & { year: number; month: number })[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mesNombre = new Intl.DateTimeFormat("es-ES", { month: "short" }).format(d).replace(".", "");
      meses.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
        ingresos: 0,
        egresos: 0,
        proyectos: 0,
      });
    }

    pagos.forEach((p) => {
      if (p.estado === "cobrado") {
        const d = new Date(p.fecha);
        const m = meses.find((mes) => mes.year === d.getFullYear() && mes.month === d.getMonth());
        if (m) m.ingresos += p.monto;
      }
    });

    egresos.forEach((e) => {
      const d = new Date(e.fecha);
      const m = meses.find((mes) => mes.year === d.getFullYear() && mes.month === d.getMonth());
      if (m) m.egresos += e.monto;
    });

    return meses;
  }, [pagos, egresos]);

  return (
    <AppShell>
      <Header
        title="Finanzas"
        subtitle={`${formatCurrency(cobrado)} cobrados · ${formatCurrency(pendiente)} por cobrar`}
      />

      <div className="px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Ingresos (cobrados)"
            value={formatCurrency(cobrado)}
            delta={32}
            hint="ingresos cobrados"
            icon={<CircleDollarSign size={14} />}
            accent="emerald"
          />
          <MetricCard
            label="Egresos"
            value={formatCurrency(totalEgresos)}
            delta={-5}
            hint="compras y gastos"
            icon={<Receipt size={14} />}
            accent="rose"
          />
          <MetricCard
            label="Balance Neto"
            value={formatCurrency(balanceNeto)}
            delta={12}
            hint="ingresos - egresos"
            icon={<TrendingUp size={14} />}
            accent="blue"
          />
          <MetricCard
            label="Por cobrar"
            value={formatCurrency(pendiente)}
            delta={2}
            hint="próximos 30 días"
            icon={<Clock4 size={14} />}
            accent="amber"
          />
        </div>

        {/* Cashflow */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Cashflow</CardTitle>
              <CardDescription>Ingresos vs egresos · últimos 6 meses</CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-2xs text-ink-subtle">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-brand-500" /> Ingresos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-slate-300" /> Egresos
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <CashflowChart data={chartData} />
          </CardContent>
        </Card>

        {/* Pagos */}
        <Card className="overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-surface-border px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-ink">Movimientos</h3>
              <p className="text-xs text-ink-subtle mt-0.5">Historial de ventas y compras</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => open()}
                className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition shadow-soft"
              >
                + Ingreso
              </button>
              <button
                onClick={() => setEgresoModalOpen(true)}
                className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium bg-surface-subtle border border-surface-border hover:bg-surface-border text-ink transition"
              >
                + Egreso
              </button>
              <div className="w-60">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar movimiento…"
                  iconLeft={<Search size={15} />}
                />
              </div>
              <Select
                className="w-36"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value as any)}
              >
                <option value="todos">Todos</option>
                <option value="cobrado">Cobrados</option>
                <option value="pendiente">Pendientes</option>
                <option value="vencido">Vencidos</option>
                <option value="egreso">Egresos</option>
              </Select>
            </div>
          </div>

          {filtrados.length === 0 ? (
            <div className="py-12 text-center">
              <Receipt className="mx-auto text-ink-faint" size={28} />
              <p className="mt-2 text-sm text-ink-subtle">Sin movimientos para mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-page text-2xs uppercase tracking-wider text-ink-subtle border-b border-surface-border">
                    <th className="px-5 py-3 text-left font-semibold">Concepto</th>
                    <th className="px-5 py-3 text-left font-semibold">Ref</th>
                    <th className="px-5 py-3 text-left font-semibold">Estado</th>
                    <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-5 py-3 text-right font-semibold">Monto</th>
                    <th className="px-5 py-3 text-right font-semibold w-20">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-divider">
                  {filtrados.map((m) => {
                    const isIngreso = m.tipo === "ingreso";
                    const cliente = isIngreso ? clientesPorId.get(m.clienteId) : null;
                    const proyecto = isIngreso && m.proyectoId ? proyectosPorId.get(m.proyectoId) : null;
                    return (
                      <tr key={m.id} className="hover:bg-surface-page/60 transition group">
                        <td className="px-5 py-3.5 max-w-[280px]">
                          <p className="font-medium text-ink truncate">{m.concepto}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          {isIngreso ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={cliente?.nombre ?? "?"} size="xs" />
                              <div className="flex flex-col">
                                <span className="text-xs text-ink-soft truncate max-w-[120px]">{cliente?.empresa}</span>
                                <span className="text-2xs text-ink-subtle truncate max-w-[120px]">{proyecto?.titulo}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-ink-subtle">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {isIngreso ? (
                            <Badge tone={estadoTone[m.estado]} dot>
                              cobro {m.estado}
                            </Badge>
                          ) : (
                            <Badge tone="slate" dot>
                              pago egreso
                            </Badge>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-ink-subtle">{formatDate(m.fecha)}</td>
                        <td
                          className={cn(
                            "px-5 py-3.5 text-right font-semibold tabular-nums",
                            isIngreso && m.estado === "cobrado" ? "text-emerald-600" : 
                            !isIngreso ? "text-rose-600" : "text-ink"
                          )}
                        >
                          {isIngreso && m.estado === "cobrado" ? "+" : ""}
                          {!isIngreso ? "-" : ""}
                          {formatCurrency(m.monto)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                            {isIngreso && (
                              <button
                                onClick={() => open(m as Pago)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-surface-subtle hover:text-ink focus-ring"
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm("¿Eliminar este movimiento?")) {
                                  isIngreso ? removePago(m.id) : removeEgreso(m.id);
                                }
                              }}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-rose-50 hover:text-danger focus-ring"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {modalOpen && <PagoModal open={modalOpen} onClose={() => setModalOpen(false)} pago={editing} />}
      {egresoModalOpen && (
        <EgresoModal open={egresoModalOpen} onClose={() => setEgresoModalOpen(false)} />
      )}
    </AppShell>
  );
}

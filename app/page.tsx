"use client";

import dynamic from "next/dynamic";
import {
  Users,
  Wallet,
  FolderKanban,
  TrendingUp,
  CalendarClock,
  CircleDollarSign,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Header } from "@/components/shell/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ConversionRing } from "@/components/dashboard/ConversionRing";
import { RecentClients } from "@/components/dashboard/RecentClients";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useNodaris } from "@/lib/store";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { actividadMensual } from "@/lib/data";
import { formatCurrency, formatDateShort, diffDays } from "@/lib/utils";

const ActivityChart = dynamic(
  () => import("@/components/dashboard/ActivityChart").then((m) => m.ActivityChart),
  {
    ssr: false,
    loading: () => <div className="h-[260px] w-full animate-pulse rounded-lg bg-surface-page" />,
  },
);

export default function DashboardPage() {
  const clientes = useNodaris((s) => s.clientes);
  const proyectos = useNodaris((s) => s.proyectos);
  const pagos = useNodaris((s) => s.pagos);
  const { fullName } = useCurrentUser();
  const firstName = fullName.split(" ")[0] || "";

  const activos = clientes.filter((c) => c.estado === "activo").length;
  const leads = clientes.filter((c) => c.estado === "lead").length;
  const ingresosTotal = pagos
    .filter((p) => p.estado === "cobrado")
    .reduce((sum, p) => sum + p.monto, 0);
  const proyectosActivos = proyectos.filter((p) => p.estado !== "finalizado").length;
  const recientes = [...clientes]
    .sort((a, b) => +new Date(b.creado) - +new Date(a.creado))
    .slice(0, 5);

  const proximasEntregas = [...proyectos]
    .filter((p) => p.estado !== "finalizado")
    .sort((a, b) => +new Date(a.fechaEntrega) - +new Date(b.fechaEntrega))
    .slice(0, 4);

  return (
    <AppShell>
      <Header
        title={firstName ? `Buenas tardes, ${firstName}` : "Buenas tardes"}
        subtitle="Un resumen de tu estudio en este momento"
      />
      <div className="px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Total clientes"
            value={String(clientes.length)}
            delta={12}
            hint="vs. mes anterior"
            icon={<Users size={14} />}
            accent="blue"
            spark={[6, 7, 7, 8, 9, 10, 10]}
          />
          <MetricCard
            label="Ingresos totales"
            value={formatCurrency(ingresosTotal)}
            delta={28}
            hint="cobrado este trimestre"
            icon={<CircleDollarSign size={14} />}
            accent="emerald"
            spark={[2, 3, 4, 6, 7, 9, 12]}
          />
          <MetricCard
            label="Proyectos activos"
            value={String(proyectosActivos)}
            delta={-4}
            hint="en curso ahora"
            icon={<FolderKanban size={14} />}
            accent="violet"
            spark={[5, 5, 6, 5, 6, 7, 6]}
          />
          <MetricCard
            label="Conversión"
            value={`${Math.round((activos / Math.max(activos + leads, 1)) * 100)}%`}
            delta={6}
            hint="leads → activos"
            icon={<TrendingUp size={14} />}
            accent="amber"
            spark={[40, 45, 50, 52, 60, 64, 68]}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Actividad mensual</CardTitle>
                <CardDescription>Ingresos vs egresos · últimos 6 meses</CardDescription>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-2xs text-ink-subtle">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                  Ingresos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  Egresos
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityChart data={actividadMensual} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Pipeline</CardTitle>
                <CardDescription>Conversión leads → activos</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ConversionRing leads={leads} activos={activos} />
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-surface-page py-3">
                  <p className="text-2xs text-ink-subtle">Inactivos</p>
                  <p className="text-base font-semibold text-ink mt-0.5">
                    {clientes.filter((c) => c.estado === "inactivo").length}
                  </p>
                </div>
                <div className="rounded-lg bg-brand-50 py-3">
                  <p className="text-2xs text-brand-700">Leads</p>
                  <p className="text-base font-semibold text-brand-700 mt-0.5">{leads}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 py-3">
                  <p className="text-2xs text-emerald-700">Activos</p>
                  <p className="text-base font-semibold text-emerald-700 mt-0.5">{activos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <CardContent>
              <RecentClients items={recientes} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Próximas entregas</CardTitle>
                <CardDescription>Vencimientos cercanos</CardDescription>
              </div>
              <CalendarClock size={16} className="text-ink-faint" />
            </CardHeader>
            <CardContent className="space-y-3">
              {proximasEntregas.map((p) => {
                const cliente = clientes.find((c) => c.id === p.clienteId);
                const dias = diffDays(new Date().toISOString(), p.fechaEntrega);
                const urgent = dias <= 14;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-surface-divider p-3 hover:border-surface-border transition"
                  >
                    <Avatar name={cliente?.nombre ?? "?"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">{p.titulo}</p>
                      <p className="text-2xs text-ink-subtle truncate">
                        {cliente?.empresa} · entrega {formatDateShort(p.fechaEntrega)}
                      </p>
                    </div>
                    <Badge tone={urgent ? "amber" : "blue"} dot>
                      {dias > 0 ? `${dias}d` : "vencido"}
                    </Badge>
                  </div>
                );
              })}
              {proximasEntregas.length === 0 && (
                <p className="text-xs text-ink-subtle text-center py-4">
                  Sin entregas pendientes
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

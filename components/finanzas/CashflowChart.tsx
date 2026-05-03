"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SerieMensual } from "@/types";
import { formatCurrency } from "@/lib/utils";

function CashTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const ingresos = payload.find((p: any) => p.dataKey === "ingresos")?.value ?? 0;
  const egresos = payload.find((p: any) => p.dataKey === "egresos")?.value ?? 0;
  return (
    <div className="rounded-lg border border-surface-border bg-surface px-3 py-2 shadow-pop">
      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle mb-1">{label}</p>
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between gap-6">
          <span className="text-ink-subtle">Ingresos</span>
          <span className="font-semibold text-ink">{formatCurrency(ingresos)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-ink-subtle">Egresos</span>
          <span className="font-semibold text-ink">{formatCurrency(egresos)}</span>
        </div>
        <div className="flex justify-between gap-6 pt-1 border-t border-surface-divider mt-1">
          <span className="text-ink-soft font-medium">Neto</span>
          <span className="font-semibold text-emerald-600">{formatCurrency(ingresos - egresos)}</span>
        </div>
      </div>
    </div>
  );
}

export function CashflowChart({ data }: { data: SerieMensual[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barCategoryGap="30%">
          <defs>
            <linearGradient id="bar-ingresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} dy={6} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={48}
          />
          <Tooltip content={<CashTooltip />} cursor={{ fill: "rgba(37,99,235,0.06)" }} />
          <Bar dataKey="ingresos" name="Ingresos" fill="url(#bar-ingresos)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="egresos" name="Egresos" fill="#E2E8F0" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SerieMensual } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: SerieMensual[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-surface-border bg-surface px-3 py-2 shadow-pop">
      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-subtle">{label}</p>
      <div className="mt-1 space-y-0.5">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-ink-subtle">{p.name}</span>
            <span className="font-semibold text-ink ml-auto">
              {formatCurrency(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityChart({ data }: Props) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="grad-ingresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-egresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94A3B8" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#94A3B8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} dy={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#CBD5E1", strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="ingresos"
            name="Ingresos"
            stroke="#2563EB"
            strokeWidth={2.2}
            fill="url(#grad-ingresos)"
          />
          <Area
            type="monotone"
            dataKey="egresos"
            name="Egresos"
            stroke="#94A3B8"
            strokeWidth={1.6}
            strokeDasharray="3 3"
            fill="url(#grad-egresos)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

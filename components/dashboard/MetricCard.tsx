"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  delta?: number; // porcentaje
  hint?: string;
  spark?: number[];
  icon?: React.ReactNode;
  accent?: "blue" | "violet" | "emerald" | "amber" | "rose";
}

const accentMap = {
  blue: { stroke: "#2563EB", fill: "#3B82F6", soft: "bg-brand-50 text-brand-600" },
  violet: { stroke: "#7C3AED", fill: "#8B5CF6", soft: "bg-violet-50 text-violet-600" },
  emerald: { stroke: "#059669", fill: "#10B981", soft: "bg-emerald-50 text-emerald-600" },
  amber: { stroke: "#D97706", fill: "#F59E0B", soft: "bg-amber-50 text-amber-600" },
  rose: { stroke: "#E11D48", fill: "#F43F5E", soft: "bg-rose-50 text-rose-600" },
};

export function MetricCard({ label, value, delta, hint, spark, icon, accent = "blue" }: MetricCardProps) {
  const positive = (delta ?? 0) >= 0;
  const colors = accentMap[accent];
  const data = (spark ?? []).map((v, i) => ({ i, v }));

  return (
    <div className="card-base p-5 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {icon && (
              <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg", colors.soft)}>
                {icon}
              </span>
            )}
            <p className="text-xs font-medium text-ink-subtle">{label}</p>
          </div>
          <p className="text-[26px] font-semibold tracking-tight text-ink leading-none">{value}</p>
          <div className="flex items-center gap-2 pt-1">
            {typeof delta === "number" && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-2xs font-semibold",
                  positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
                )}
              >
                {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {Math.abs(delta)}%
              </span>
            )}
            {hint && <span className="text-2xs text-ink-faint">{hint}</span>}
          </div>
        </div>
        {data.length > 0 && (
          <div className="h-12 w-24 -mr-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`spark-${accent}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.fill} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={colors.fill} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={colors.stroke}
                  strokeWidth={1.6}
                  fill={`url(#spark-${accent})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { Cliente } from "@/types";
import { formatCurrency } from "@/lib/utils";

const tone = {
  activo: "green",
  lead: "blue",
  inactivo: "slate",
} as const;

export function RecentClients({ items }: { items: Cliente[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">Clientes recientes</h3>
          <p className="text-xs text-ink-subtle mt-0.5">Últimos en sumarse al pipeline</p>
        </div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 focus-ring rounded-md px-1.5 py-1"
        >
          Ver todos <ArrowUpRight size={13} />
        </Link>
      </div>
      <ul className="divide-y divide-surface-divider">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-3 py-3 hover:bg-surface-page/60 -mx-2 px-2 rounded-lg transition"
          >
            <Avatar name={c.nombre} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink truncate">{c.nombre}</p>
              <p className="text-xs text-ink-subtle truncate">{c.empresa}</p>
            </div>
            <Badge tone={tone[c.estado]} dot>
              {c.estado}
            </Badge>
            <span className="text-sm font-semibold text-ink tabular-nums w-20 text-right">
              {c.valor > 0 ? formatCurrency(c.valor) : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

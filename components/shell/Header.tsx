"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, ChevronDown, Plus, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const router = useRouter();
  const { fullName, email, loading } = useCurrentUser();
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const displayName = loading ? "Cargando…" : fullName || "Usuario";
  const displayEmail = loading ? "" : email;

  return (
    <header className="sticky top-0 z-30 border-b border-surface-border bg-surface/85 backdrop-blur-md">
      <div className="flex items-center gap-4 px-6 py-3.5">
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-ink truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-ink-subtle truncate">{subtitle}</p>
          )}
        </div>

        <div className="hidden md:block w-72">
          <Input
            placeholder="Buscar clientes, proyectos…"
            iconLeft={<Search size={15} />}
          />
        </div>

        <button
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-subtle hover:text-ink hover:bg-surface-subtle transition focus-ring"
          aria-label="Notificaciones"
        >
          <Bell size={17} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand-500 ring-2 ring-surface" />
        </button>

        {action && (
          <Button onClick={action.onClick} iconLeft={<Plus size={15} />}>
            {action.label}
          </Button>
        )}

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 pl-3 ml-1 border-l border-surface-border rounded-r-lg hover:bg-surface-subtle transition py-1 pr-2 focus-ring"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <Avatar name={displayName} size="sm" />
            <div className="hidden sm:flex flex-col leading-tight text-left max-w-[160px]">
              <span className="text-xs font-semibold text-ink truncate">{displayName}</span>
              <span className="text-2xs text-ink-faint truncate">{displayEmail}</span>
            </div>
            <ChevronDown size={14} className="text-ink-faint hidden sm:block" />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 rounded-xl border border-surface-border bg-surface shadow-lg overflow-hidden z-40"
            >
              <div className="px-3 py-3 border-b border-surface-divider">
                <p className="text-xs font-semibold text-ink truncate">{displayName}</p>
                <p className="text-2xs text-ink-faint truncate">{displayEmail}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium text-ink hover:bg-surface-subtle transition"
              >
                <LogOut size={14} className="text-ink-faint" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

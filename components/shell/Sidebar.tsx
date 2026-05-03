"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Wallet,
  Settings,
  LifeBuoy,
  Users2,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  Inbox,
} from "lucide-react";
import { NodarisLogo } from "./NodarisLogo";
import { useNodaris } from "@/lib/store";
import { cn } from "@/lib/utils";

const secondary = [
  { href: "#", label: "Configuración", icon: Settings },
  { href: "#", label: "Soporte", icon: LifeBuoy },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const proyectos = useNodaris((s) => s.proyectos);
  const isSidebarOpen = useNodaris((s) => s.isSidebarOpen);
  const toggleSidebar = useNodaris((s) => s.toggleSidebar);
  const theme = useNodaris((s) => s.theme);
  const toggleTheme = useNodaris((s) => s.toggleTheme);
  const personas = useNodaris((s) => s.personas);
  const leads = useNodaris((s) => s.leads);
  const proyectosActivos = proyectos.filter((p) => p.estado !== "finalizado").length;
  const leadsNuevos = leads.filter((l) => l.estado === "nuevo").length;

  const nav = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, badge: null as string | null },
    { href: "/clientes", label: "Clientes", icon: Users, badge: null as string | null },
    { href: "/proyectos", label: "Proyectos", icon: FolderKanban, badge: String(proyectosActivos) },
    { href: "/finanzas", label: "Finanzas", icon: Wallet, badge: null as string | null },
    { href: "/leads", label: "Leads", icon: Inbox, badge: leadsNuevos > 0 ? String(leadsNuevos) : null },
    { href: "/equipo", label: "Equipo", icon: Users2, badge: null as string | null },
  ];

  return (
    <aside 
      className={cn(
        "hidden lg:flex shrink-0 flex-col bg-sidebar text-slate-200 transition-all duration-300 sticky top-0 h-screen z-40",
        isSidebarOpen ? "w-[240px]" : "w-[72px]"
      )}
    >
      {/* Botón para colapsar/expandir el sidebar */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 bg-sidebar border border-sidebar-divider rounded-full p-1 text-slate-400 hover:text-white transition-colors z-50"
      >
        {isSidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
      </button>

      <div className={cn("pt-6 pb-4 flex items-center", isSidebarOpen ? "px-5" : "px-0 justify-center")}>
        <NodarisLogo withWordmark={isSidebarOpen} tone="dark" />
      </div>

      <div className="px-3 mt-2">
        {isSidebarOpen && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 px-3 mb-2">
            Workspace
          </p>
        )}
        <nav className="space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                title={!isSidebarOpen ? item.label : undefined}
                className={cn(
                  "group relative flex items-center rounded-lg py-2 text-sm font-medium transition-all",
                  isSidebarOpen ? "px-3 gap-3" : "justify-center",
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-slate-400 hover:text-white hover:bg-sidebar-accent/60",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand-500" />
                )}
                <Icon size={16} className={active ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300"} />
                {isSidebarOpen && <span className="flex-1">{item.label}</span>}
                {isSidebarOpen && item.badge && (
                  <span className="rounded-full bg-sidebar-divider px-1.5 py-0.5 text-2xs font-semibold text-slate-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-3 mt-8">
        {isSidebarOpen && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 px-3 mb-2">
            General
          </p>
        )}
        <nav className="space-y-1">
          {secondary.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                title={!isSidebarOpen ? item.label : undefined}
                className={cn(
                  "group flex items-center rounded-lg py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-sidebar-accent/60 transition",
                  isSidebarOpen ? "px-3 gap-3" : "justify-center"
                )}
              >
                <Icon size={16} className="text-slate-500 group-hover:text-slate-300" />
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}

          <button
            onClick={toggleTheme}
            title={!isSidebarOpen ? (theme === "dark" ? "Modo Claro" : "Modo Oscuro") : undefined}
            className={cn(
              "group flex w-full items-center rounded-lg py-2 mt-1 text-sm font-medium text-slate-400 hover:text-white hover:bg-sidebar-accent/60 transition",
              isSidebarOpen ? "px-3 gap-3" : "justify-center"
            )}
          >
            {theme === "dark" ? <Sun size={16} className="text-slate-500 group-hover:text-amber-400" /> : <Moon size={16} className="text-slate-500 group-hover:text-blue-400" />}
            {isSidebarOpen && <span>{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>}
          </button>
        </nav>
      </div>

      {/* Footer con identidad del workspace */}
      <div className={cn("mt-auto", isSidebarOpen ? "p-4" : "p-3 pb-4")}>
        <div className={cn(
          "flex items-center rounded-xl border border-sidebar-divider bg-sidebar-accent/40",
          isSidebarOpen ? "gap-3 p-3" : "p-2 justify-center"
        )}>
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20 text-brand-300 font-semibold text-xs">
            ND
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar-accent" />
          </span>
          {isSidebarOpen && (
            <div className="min-w-0 leading-tight">
              <p className="text-xs font-semibold text-white truncate">Nodaris Studio</p>
              <p className="text-2xs text-slate-400 truncate">Workspace · {personas.length} {personas.length === 1 ? "miembro" : "miembros"}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

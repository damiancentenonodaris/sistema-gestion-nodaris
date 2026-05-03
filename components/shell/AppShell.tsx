"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { RoutePrefetcher } from "./RoutePrefetcher";
import { useNodaris } from "@/lib/store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const fetchInitialData = useNodaris((s) => s.fetchInitialData);
  const initialized = useNodaris((s) => s.initialized);
  const pathname = usePathname();

  React.useEffect(() => {
    const storedTheme = localStorage.getItem("nodaris-theme");
    if (storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
      useNodaris.setState({ theme: "dark" });
    }
  }, []);

  React.useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Solo muestra el spinner la primera vez (initialized = false)
  // En navegaciones siguientes los datos ya están en el store → render inmediato
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-page">
        <p className="text-sm text-ink-subtle animate-pulse">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-surface-page">
      <RoutePrefetcher />
      <Sidebar />
      <main key={pathname} className="flex-1 min-w-0 flex flex-col animate-slide-up">
        {children}
      </main>
    </div>
  );
}

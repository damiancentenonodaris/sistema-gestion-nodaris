"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const ROUTES_TO_PREFETCH = [
  "/",
  "/clientes",
  "/proyectos",
  "/finanzas",
  "/leads",
  "/equipo",
];

export function RoutePrefetcher() {
  const router = useRouter();

  React.useEffect(() => {
    const warmup = () => {
      ROUTES_TO_PREFETCH.forEach((route) => router.prefetch(route));
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(warmup, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }

    const id = globalThis.setTimeout(warmup, 600);
    return () => globalThis.clearTimeout(id);
  }, [router]);

  return null;
}

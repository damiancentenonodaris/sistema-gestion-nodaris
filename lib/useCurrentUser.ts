"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface CurrentUser {
  user: User | null;
  email: string;
  fullName: string;
  loading: boolean;
}

function deriveFullName(user: User | null): string {
  if (!user) return "";
  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  const full = (md.full_name as string) || (md.name as string);
  if (full && full.trim()) return full.trim();

  const nombre = (md.nombre as string) || (md.first_name as string) || "";
  const apellido = (md.apellido as string) || (md.last_name as string) || "";
  const composed = `${nombre} ${apellido}`.trim();
  if (composed) return composed;

  const local = user.email?.split("@")[0] ?? "";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function useCurrentUser(): CurrentUser {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    email: user?.email ?? "",
    fullName: deriveFullName(user),
    loading,
  };
}

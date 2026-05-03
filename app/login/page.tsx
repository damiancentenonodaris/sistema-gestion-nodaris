"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { NodarisLogo } from "@/components/shell/NodarisLogo";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("admin@nodaris.io");
  const [password, setPassword] = React.useState("nodaris");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const supabase = createClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-surface">
      {/* Form side */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          <NodarisLogo withWordmark size={32} />

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Buenas tardes 👋
            </h1>
            <p className="text-sm text-ink-subtle">
              Ingresá a tu workspace para alinear el sistema.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Email" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hola@empresa.com"
                autoFocus
              />
            </Field>
            <Field label="Contraseña" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 text-ink-subtle cursor-pointer">
                <input type="checkbox" className="rounded border-surface-border text-brand-600 focus-ring" defaultChecked />
                Recordarme
              </label>
              <a href="#" className="text-brand-600 hover:text-brand-700 font-medium">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            
            {error && (
              <p className="text-sm font-medium text-red-500">{error}</p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
              iconRight={<ArrowRight size={15} />}
            >
              {loading ? "Ingresando…" : "Ingresar al panel"}
            </Button>
          </form>

          <p className="text-2xs text-ink-faint text-center pt-4 border-t border-surface-divider">
            Demo cargada con datos de ejemplo. Cualquier credencial funciona.
          </p>
        </div>
      </div>

      {/* Visual side */}
      <div className="relative hidden lg:flex items-center justify-center bg-sidebar overflow-hidden">
        {/* Constelación */}
        <div className="absolute inset-0 bg-grid-fade opacity-50" />
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-52 w-52 rounded-full bg-brand-500/20 blur-3xl" />

        {/* Diagrama nodal */}
        <svg
          viewBox="0 0 480 480"
          className="relative z-10 w-[420px] max-w-full opacity-90"
        >
          <defs>
            <linearGradient id="line" x1="0" y1="0" x2="480" y2="480" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60A5FA" stopOpacity="0.6" />
              <stop offset="1" stopColor="#1D4ED8" stopOpacity="0.2" />
            </linearGradient>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Conexiones */}
          <g stroke="url(#line)" strokeWidth="1">
            <line x1="240" y1="240" x2="120" y2="100" />
            <line x1="240" y1="240" x2="380" y2="120" />
            <line x1="240" y1="240" x2="80" y2="280" />
            <line x1="240" y1="240" x2="400" y2="280" />
            <line x1="240" y1="240" x2="160" y2="400" />
            <line x1="240" y1="240" x2="340" y2="400" />
            <line x1="120" y1="100" x2="380" y2="120" strokeDasharray="2 4" opacity="0.5" />
            <line x1="80" y1="280" x2="160" y2="400" strokeDasharray="2 4" opacity="0.5" />
            <line x1="400" y1="280" x2="340" y2="400" strokeDasharray="2 4" opacity="0.5" />
          </g>
          {/* Nodos secundarios */}
          {[
            [120, 100],
            [380, 120],
            [80, 280],
            [400, 280],
            [160, 400],
            [340, 400],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="20" fill="url(#glow)" />
              <circle cx={cx} cy={cy} r="5" fill="#fff" />
              <circle cx={cx} cy={cy} r="3" fill="#1D4ED8" />
            </g>
          ))}
          {/* Nodo central */}
          <circle cx="240" cy="240" r="50" fill="url(#glow)" />
          <circle cx="240" cy="240" r="14" fill="#fff" />
          <circle cx="240" cy="240" r="9" fill="#2563EB" />
        </svg>

        <div className="absolute bottom-12 left-12 right-12 z-10">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-brand-300 bg-brand-900/40 border border-brand-500/30 rounded-full px-3 py-1 mb-4">
            <Sparkles size={12} />
            Nodaris CRM
          </div>
          <p className="text-2xl font-semibold text-white leading-tight max-w-md">
            El sistema que <span className="text-brand-300">alinea</span> el negocio.
          </p>
          <p className="text-sm text-slate-400 mt-2 max-w-md">
            Clientes, proyectos y finanzas en un solo lugar. Diseñado para estudios que crean SaaS y landing pages.
          </p>
        </div>
      </div>
    </div>
  );
}

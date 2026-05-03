# Nodaris CRM

> El sistema que alinea el negocio.

CRM moderno para estudios que crean SaaS y landing pages. Gestión de clientes, proyectos y finanzas en un solo lugar — con la pulcritud de Stripe / Linear y un toque nodal propio.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** con sistema de tokens (azul como primario)
- **Recharts** para gráficos
- **Zustand** para estado global (sin recargas)
- **lucide-react** para iconografía
- Tipografía **Inter** (servida desde rsms.me)

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`. Para entrar, andá a `/login` o directamente al dashboard `/`.

> Cualquier credencial funciona — la auth real queda como integración futura (Supabase / NextAuth).

## Estructura

```
app/
  layout.tsx              # raíz + metadata
  globals.css             # tokens + Inter + helpers
  page.tsx                # Dashboard
  clientes/page.tsx
  proyectos/page.tsx
  finanzas/page.tsx
  login/page.tsx
components/
  shell/                  # Sidebar, Header, AppShell, Logo
  ui/                     # Card, Button, Input, Modal, Badge, Avatar, EmptyState
  dashboard/              # MetricCard, ActivityChart, ConversionRing, RecentClients
  clientes/               # ClientesView, ClienteModal
  proyectos/              # ProyectosView (kanban + tabla), ProyectoModal
  finanzas/               # FinanzasView, CashflowChart, PagoModal
lib/
  data.ts                 # mock seed (clientes, proyectos, pagos, series)
  store.ts                # Zustand store con CRUD
  utils.ts                # cn, formatCurrency, formatDate, initials, …
types/
  index.ts                # Cliente, Proyecto, Pago, etc.
```

## Sistema de diseño

| Token             | Valor      | Uso                              |
| ----------------- | ---------- | -------------------------------- |
| `brand-600`       | `#2563EB`  | CTA primarios                    |
| `brand-50/700`    | —          | Estados, badges, hover           |
| `sidebar`         | `#0B1220`  | Sidebar oscura                   |
| `surface-page`    | `#F7F9FC`  | Fondo de la app                  |
| `surface`         | `#FFFFFF`  | Tarjetas y modales               |
| `ink` / `subtle`  | —          | Jerarquía tipográfica            |

Convenciones:

- Bordes `rounded-xl` / `rounded-2xl`, sombras `shadow-soft` / `shadow-card`.
- Animaciones cortas (`fade-in`, `scale-in`) — sin abuso.
- Patrón "constelación" (`bg-nodal`, `bg-grid-fade`) sutil para fondos sin saturar.

## Funcionalidades

**Dashboard** — KPIs (clientes, ingresos, proyectos, conversión), gráfico de actividad mensual, anillo de conversión, lista de clientes recientes y próximas entregas.

**Clientes** — Tabla con búsqueda + filtros por estado (lead/activo/inactivo), modal de alta/edición con validación, eliminación con cascada (también borra proyectos y pagos del cliente).

**Proyectos** — Vista doble: tablero (kanban-lite por estado) y tabla. Tipos `landing` y `saas`, fechas de inicio/entrega, indicador de urgencia automático.

**Finanzas** — KPIs financieros, gráfico cashflow (barras), tabla de pagos cobrados/pendientes/vencidos con filtros, registro y edición de pagos.

**Login** — Pantalla split-screen con identidad nodal (constelación animada).

## Próximos pasos sugeridos

1. **Persistencia real**: cambiar Zustand por Supabase (`@supabase/ssr`) — los modelos en `types/` ya están listos.
2. **Auth**: NextAuth.js o Supabase Auth con la pantalla `/login` ya armada.
3. **Modo oscuro**: `darkMode: "class"` está habilitado en `tailwind.config.ts`. Falta el toggle.
4. **Notificaciones**: el campanita del Header tiene el dot pero no la lista.
5. **Export**: PDF de presupuestos / facturas.

---

Diseñado para sentirse como un SaaS premium listo para vender.

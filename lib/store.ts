"use client";

import { create } from "zustand";
import type { Cliente, Lead, Nota, Pago, Persona, Proyecto, Tarea } from "@/types";
import { createClient } from "@/lib/supabase/client";

// ─── Mappers: DB (snake_case) ↔ App (camelCase) ───────────────────────────

export interface Egreso {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
}

function mapProyecto(r: any): Proyecto {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    titulo: r.titulo,
    tipo: r.tipo,
    estado: r.estado,
    precio: r.precio,
    fechaInicio: r.fecha_inicio,
    fechaEntrega: r.fecha_entrega,
    descripcion: r.descripcion,
    driveUrl: r.drive_url ?? "",
  };
}
function proyectoToDb(d: Omit<Proyecto, "id">) {
  return {
    cliente_id: d.clienteId,
    titulo: d.titulo,
    tipo: d.tipo,
    estado: d.estado,
    precio: d.precio,
    fecha_inicio: d.fechaInicio,
    fecha_entrega: d.fechaEntrega,
    descripcion: d.descripcion,
    drive_url: d.driveUrl ?? "",
  };
}

function mapPago(r: any): Pago {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    proyectoId: r.proyecto_id,
    monto: r.monto,
    estado: r.estado,
    metodo: r.metodo,
    fecha: r.fecha,
    concepto: r.concepto,
  };
}
function pagoToDb(d: Omit<Pago, "id">) {
  return {
    cliente_id: d.clienteId,
    proyecto_id: d.proyectoId ?? null,
    monto: d.monto,
    estado: d.estado,
    metodo: d.metodo,
    fecha: d.fecha,
    concepto: d.concepto,
  };
}

function mapTarea(r: any): Tarea {
  return {
    id: r.id,
    proyectoId: r.proyecto_id,
    titulo: r.titulo,
    descripcion: r.descripcion,
    asignadoA: r.asignado_a,
    estado: r.estado,
    prioridad: r.prioridad,
    fechaVencimiento: r.fecha_vencimiento,
    creado: r.creado,
  };
}
function tareaToDb(d: Omit<Tarea, "id" | "creado">) {
  return {
    proyecto_id: d.proyectoId,
    titulo: d.titulo,
    descripcion: d.descripcion,
    asignado_a: d.asignadoA ?? null,
    estado: d.estado,
    prioridad: d.prioridad,
    fecha_vencimiento: d.fechaVencimiento ?? null,
  };
}

function mapNota(r: any): Nota {
  return {
    id: r.id,
    tareaId: r.tarea_id,
    autorId: r.autor_id,
    contenido: r.contenido,
    fecha: r.fecha,
    imagenes: r.imagenes ?? [],
  };
}
function notaToDb(d: Omit<Nota, "id" | "fecha">) {
  return {
    tarea_id: d.tareaId,
    autor_id: d.autorId,
    contenido: d.contenido,
    imagenes: d.imagenes ?? [],
  };
}

// ─── State ────────────────────────────────────────────────────────────────

interface NodarisState {
  clientes: Cliente[];
  proyectos: Proyecto[];
  pagos: Pago[];
  personas: Persona[];
  tareas: Tarea[];
  notas: Nota[];
  egresos: Egreso[];
  leads: Lead[];

  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  theme: "light" | "dark";
  toggleTheme: () => void;

  currentUserId: string;
  setCurrentUserId: (id: string) => void;

  loading: boolean;
  initialized: boolean;
  fetchInitialData: () => Promise<void>;
  refreshLeads: () => Promise<void>;

  addCliente: (data: Omit<Cliente, "id" | "creado">) => Promise<void>;
  updateCliente: (id: string, data: Partial<Omit<Cliente, "id">>) => Promise<void>;
  removeCliente: (id: string) => Promise<void>;

  addProyecto: (data: Omit<Proyecto, "id">) => Promise<void>;
  updateProyecto: (id: string, data: Partial<Omit<Proyecto, "id">>) => Promise<void>;
  removeProyecto: (id: string) => Promise<void>;

  addPago: (data: Omit<Pago, "id">) => Promise<void>;
  updatePago: (id: string, data: Partial<Omit<Pago, "id">>) => Promise<void>;
  removePago: (id: string) => Promise<void>;

  addTarea: (data: Omit<Tarea, "id" | "creado">) => Promise<void>;
  updateTarea: (id: string, data: Partial<Omit<Tarea, "id">>) => Promise<void>;
  removeTarea: (id: string) => Promise<void>;

  addNota: (data: Omit<Nota, "id" | "fecha">) => Promise<void>;
  removeNota: (id: string) => Promise<void>;

  addEgreso: (data: Omit<Egreso, "id">) => Promise<void>;
  removeEgreso: (id: string) => Promise<void>;

  updateLeadEstado: (id: string, estado: Lead["estado"]) => Promise<void>;
  removeLead: (id: string) => Promise<void>;
  addLead: (data: Omit<Lead, "id" | "creado">) => Promise<Lead | null>;
  addLeadsBulk: (data: Omit<Lead, "id" | "creado">[]) => Promise<{ inserted: number; errors: string[] }>;
}

let initialDataPromise: Promise<void> | null = null;

export const useNodaris = create<NodarisState>((set) => ({
  clientes: [],
  proyectos: [],
  pagos: [],
  personas: [],
  tareas: [],
  notas: [],
  egresos: [],
  leads: [],

  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

  theme: "light",
  toggleTheme: () => set((s) => {
    const newTheme = s.theme === "light" ? "dark" : "light";
    if (typeof window !== "undefined") {
      if (newTheme === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      localStorage.setItem("nodaris-theme", newTheme);
    }
    return { theme: newTheme };
  }),

  currentUserId: "",
  setCurrentUserId: (id) => set({ currentUserId: id }),

  loading: true,
  initialized: false,
  fetchInitialData: async () => {
    // Si ya se cargó alguna vez, no volver a cargar
    if (useNodaris.getState().initialized) return;
    // Si ya hay una fetch en curso, esperarla sin lanzar otra
    if (initialDataPromise) {
      await initialDataPromise;
      return;
    }

    initialDataPromise = (async () => {
      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();

        const [
          { data: clientes },
          { data: proyectosRaw },
          { data: pagosRaw },
          { data: personas },
          { data: tareasRaw },
          { data: notasRaw },
          { data: egresosRaw },
          { data: leadsRaw },
        ] = await Promise.all([
          supabase.from("clientes").select("*").order("creado", { ascending: false }),
          supabase.from("proyectos").select("*").order("creado", { ascending: false }),
          supabase.from("pagos").select("*").order("creado", { ascending: false }),
          supabase.from("personas").select("*"),
          supabase.from("tareas").select("*").order("creado", { ascending: false }),
          supabase.from("notas").select("*").order("fecha", { ascending: true }),
          supabase.from("egresos").select("*").order("fecha", { ascending: false }),
          supabase.from("leads").select("*").order("creado", { ascending: false }),
        ]);

        // Intentamos matchear el usuario autenticado con una persona por email
        const authEmail = authData?.user?.email;
        const personaActual = (personas || []).find((p: any) => p.email === authEmail);

        set({
          clientes: (clientes as Cliente[]) || [],
          proyectos: (proyectosRaw || []).map(mapProyecto),
          pagos: (pagosRaw || []).map(mapPago),
          personas: (personas as Persona[]) || [],
          tareas: (tareasRaw || []).map(mapTarea),
          notas: (notasRaw || []).map(mapNota),
          egresos: (egresosRaw || []).map((r: any) => ({ id: r.id, concepto: r.concepto, monto: r.monto, fecha: r.fecha })),
          leads: (leadsRaw as Lead[]) || [],
          currentUserId: personaActual?.id ?? authData?.user?.id ?? "",
          loading: false,
          initialized: true,
        });
      } catch (err) {
        console.error("[fetchInitialData]", err);
        // Aunque falle, marcamos initialized para no dejar la UI colgada en "Cargando..."
        set({ loading: false, initialized: true });
        // Permitimos reintento en una próxima navegación
        initialDataPromise = null;
        throw err;
      }
    })();

    try {
      await initialDataPromise;
    } catch {
      // ya logueado arriba; evitamos propagar para no romper el render
    }
  },

  // ── Clientes (columnas ya son camelCase en DB) ──────────────────────────
  addCliente: async (data) => {
    const supabase = createClient();
    const { data: res, error } = await supabase.from("clientes").insert(data).select().single();
    if (error) console.error("[addCliente]", error);
    if (res) set((s) => ({ clientes: [res as Cliente, ...s.clientes] }));
  },
  updateCliente: async (id, data) => {
    const supabase = createClient();
    const { data: res, error } = await supabase.from("clientes").update(data).eq("id", id).select().single();
    if (error) console.error("[updateCliente]", error);
    if (res) set((s) => ({ clientes: s.clientes.map((c) => (c.id === id ? (res as Cliente) : c)) }));
  },
  removeCliente: async (id) => {
    const supabase = createClient();
    await supabase.from("clientes").delete().eq("id", id);
    set((s) => ({
      clientes: s.clientes.filter((c) => c.id !== id),
      proyectos: s.proyectos.filter((p) => p.clienteId !== id),
      pagos: s.pagos.filter((pg) => pg.clienteId !== id),
    }));
  },

  // ── Proyectos ─────────────────────────────────────────────────────────
  addProyecto: async (data) => {
    const supabase = createClient();
    const { data: res, error } = await supabase.from("proyectos").insert(proyectoToDb(data)).select().single();
    if (error) console.error("[addProyecto]", error);
    if (res) set((s) => ({ proyectos: [mapProyecto(res), ...s.proyectos] }));
  },
  updateProyecto: async (id, data) => {
    const supabase = createClient();
    const dbData = proyectoToDb({ ...data } as Omit<Proyecto, "id">);
    const cleanData = Object.fromEntries(Object.entries(dbData).filter(([, v]) => v !== undefined));
    const { data: res, error } = await supabase.from("proyectos").update(cleanData).eq("id", id).select().single();
    if (error) console.error("[updateProyecto]", error);
    if (res) set((s) => ({ proyectos: s.proyectos.map((p) => (p.id === id ? mapProyecto(res) : p)) }));
  },
  removeProyecto: async (id) => {
    const supabase = createClient();
    await supabase.from("proyectos").delete().eq("id", id);
    set((s) => ({
      proyectos: s.proyectos.filter((p) => p.id !== id),
      pagos: s.pagos.filter((pg) => pg.proyectoId !== id),
      tareas: s.tareas.filter((t) => t.proyectoId !== id),
    }));
  },

  // ── Pagos ─────────────────────────────────────────────────────────────
  addPago: async (data) => {
    const supabase = createClient();
    const { data: res, error } = await supabase.from("pagos").insert(pagoToDb(data)).select().single();
    if (error) console.error("[addPago]", error);
    if (res) set((s) => ({ pagos: [mapPago(res), ...s.pagos] }));
  },
  updatePago: async (id, data) => {
    const supabase = createClient();
    const dbData = pagoToDb({ ...data } as Omit<Pago, "id">);
    const cleanData = Object.fromEntries(Object.entries(dbData).filter(([, v]) => v !== undefined));
    const { data: res, error } = await supabase.from("pagos").update(cleanData).eq("id", id).select().single();
    if (error) console.error("[updatePago]", error);
    if (res) set((s) => ({ pagos: s.pagos.map((p) => (p.id === id ? mapPago(res) : p)) }));
  },
  removePago: async (id) => {
    const supabase = createClient();
    await supabase.from("pagos").delete().eq("id", id);
    set((s) => ({ pagos: s.pagos.filter((p) => p.id !== id) }));
  },

  // ── Tareas ────────────────────────────────────────────────────────────
  addTarea: async (data) => {
    const supabase = createClient();
    const { data: res, error } = await supabase.from("tareas").insert(tareaToDb(data)).select().single();
    if (error) console.error("[addTarea]", error);
    if (res) set((s) => ({ tareas: [mapTarea(res), ...s.tareas] }));
  },
  updateTarea: async (id, data) => {
    const supabase = createClient();
    const dbData = tareaToDb({ ...data } as Omit<Tarea, "id" | "creado">);
    const cleanData = Object.fromEntries(Object.entries(dbData).filter(([, v]) => v !== undefined));
    const { data: res, error } = await supabase.from("tareas").update(cleanData).eq("id", id).select().single();
    if (error) console.error("[updateTarea]", error);
    if (res) set((s) => ({ tareas: s.tareas.map((t) => (t.id === id ? mapTarea(res) : t)) }));
  },
  removeTarea: async (id) => {
    const supabase = createClient();
    await supabase.from("tareas").delete().eq("id", id);
    set((s) => ({
      tareas: s.tareas.filter((t) => t.id !== id),
      notas: s.notas.filter((n) => n.tareaId !== id),
    }));
  },

  // ── Notas ─────────────────────────────────────────────────────────────
  addNota: async (data) => {
    const supabase = createClient();
    const { data: res, error } = await supabase.from("notas").insert(notaToDb(data)).select().single();
    if (error) console.error("[addNota]", error);
    if (res) set((s) => ({ notas: [...s.notas, mapNota(res)] }));
  },
  removeNota: async (id) => {
    const supabase = createClient();
    await supabase.from("notas").delete().eq("id", id);
    set((s) => ({ notas: s.notas.filter((n) => n.id !== id) }));
  },

  // ── Egresos ───────────────────────────────────────────────────────────
  addEgreso: async (data) => {
    const supabase = createClient();
    const { data: res, error } = await supabase.from("egresos").insert(data).select().single();
    if (error) console.error("[addEgreso]", error);
    if (res) set((s) => ({ egresos: [{ id: res.id, concepto: res.concepto, monto: res.monto, fecha: res.fecha }, ...s.egresos] }));
  },
  removeEgreso: async (id) => {
    const supabase = createClient();
    await supabase.from("egresos").delete().eq("id", id);
    set((s) => ({ egresos: s.egresos.filter((e) => e.id !== id) }));
  },

  // ── Leads ─────────────────────────────────────────────────────────────
  refreshLeads: async () => {
    const supabase = createClient();
    const { data } = await supabase.from("leads").select("*").order("creado", { ascending: false });
    set({ leads: (data as Lead[]) || [] });
  },
  updateLeadEstado: async (id, estado) => {
    const supabase = createClient();
    const { data: res, error } = await supabase.from("leads").update({ estado }).eq("id", id).select().single();
    if (error) console.error("[updateLeadEstado]", error);
    if (res) set((s) => ({ leads: s.leads.map((l) => (l.id === id ? (res as Lead) : l)) }));
  },
  removeLead: async (id) => {
    const supabase = createClient();
    await supabase.from("leads").delete().eq("id", id);
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }));
  },
  addLead: async (data) => {
    const supabase = createClient();
    const payload = { ...data, creado: new Date().toISOString() };
    const { data: res, error } = await supabase.from("leads").insert(payload).select().single();
    if (error) {
      console.error("[addLead]", error);
      return null;
    }
    const lead = res as Lead;
    set((s) => ({ leads: [lead, ...s.leads] }));
    return lead;
  },
  addLeadsBulk: async (rows) => {
    const supabase = createClient();
    const errors: string[] = [];
    if (rows.length === 0) return { inserted: 0, errors };
    const payload = rows.map((r) => ({ ...r, creado: new Date().toISOString() }));
    const { data, error } = await supabase.from("leads").insert(payload).select();
    if (error) {
      errors.push(error.message);
      return { inserted: 0, errors };
    }
    const inserted = (data as Lead[]) || [];
    set((s) => ({ leads: [...inserted, ...s.leads] }));
    return { inserted: inserted.length, errors };
  },
}));

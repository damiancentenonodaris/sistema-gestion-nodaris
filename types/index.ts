export type EstadoCliente = "lead" | "activo" | "inactivo";

export type TipoProyecto = "landing" | "saas";

export type EstadoProyecto = "pendiente" | "en_progreso" | "finalizado";

export type EstadoPago = "pendiente" | "cobrado" | "vencido";

export type MetodoPago = "transferencia" | "tarjeta" | "efectivo" | "mercado_pago";

export interface Cliente {
  id: string;
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  estado: EstadoCliente;
  valor: number;
  notas?: string;
  creado: string; // ISO
}

export interface Proyecto {
  id: string;
  clienteId: string;
  titulo: string;
  tipo: TipoProyecto;
  estado: EstadoProyecto;
  precio: number;
  fechaInicio: string;
  fechaEntrega: string;
  descripcion?: string;
  driveUrl: string; // Link público a la carpeta de Google Drive del proyecto
}

export interface Pago {
  id: string;
  clienteId: string;
  proyectoId?: string;
  monto: number;
  estado: EstadoPago;
  metodo: MetodoPago;
  fecha: string;
  concepto: string;
}

export interface SerieMensual {
  mes: string;
  ingresos: number;
  egresos: number;
  proyectos: number;
}

export interface Persona {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export type EstadoTarea = "pendiente" | "en_progreso" | "finalizado";
export type Prioridad = "baja" | "media" | "alta";

export interface Tarea {
  id: string;
  proyectoId: string;
  titulo: string;
  descripcion?: string;
  asignadoA?: string; // personaId
  estado: EstadoTarea;
  prioridad: Prioridad;
  fechaVencimiento?: string;
  creado: string;
}

export interface Nota {
  id: string;
  tareaId: string;
  autorId: string;
  contenido: string;
  fecha: string; // ISO datetime
  imagenes?: string[]; // URLs públicas en Supabase Storage
}

export type EstadoLead = "nuevo" | "revisado" | "contactado" | "descartado";

export interface Lead {
  id: string;
  nombre: string;
  empresa?: string;
  email: string;
  whatsapp?: string;
  mensaje?: string;
  estado: EstadoLead;
  creado: string; // ISO datetime
}

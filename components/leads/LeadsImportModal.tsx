"use client";

import * as React from "react";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useNodaris } from "@/lib/store";
import type { EstadoLead, Lead } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Row = Omit<Lead, "id" | "creado">;

const HEADER_MAP: Record<string, keyof Row> = {
  nombre: "nombre",
  name: "nombre",
  "nombre y apellido": "nombre",
  email: "email",
  "e-mail": "email",
  correo: "email",
  empresa: "empresa",
  company: "empresa",
  whatsapp: "whatsapp",
  telefono: "whatsapp",
  teléfono: "whatsapp",
  phone: "whatsapp",
  mensaje: "mensaje",
  message: "mensaje",
  comentario: "mensaje",
  estado: "estado",
  status: "estado",
};

const ESTADOS_VALIDOS: EstadoLead[] = ["nuevo", "revisado", "contactado", "descartado"];

// Parser de CSV simple con soporte para comillas y comas internas.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  // Normaliza saltos de línea
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Quita BOM si lo hay
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { inQuotes = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === "," || c === ";") { cur.push(field); field = ""; i++; continue; }
    if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

interface Parsed {
  rows: Row[];
  errors: string[];
  totalLines: number;
}

function buildRows(csv: string): Parsed {
  const matrix = parseCSV(csv);
  const errors: string[] = [];
  if (matrix.length < 2) {
    return { rows: [], errors: ["El archivo no tiene filas de datos."], totalLines: 0 };
  }
  const headers = matrix[0].map((h) => h.trim().toLowerCase());
  const mapped: (keyof Row | null)[] = headers.map((h) => HEADER_MAP[h] ?? null);

  if (!mapped.includes("nombre") || !mapped.includes("email")) {
    return {
      rows: [],
      errors: ["El CSV debe tener al menos las columnas: nombre, email."],
      totalLines: matrix.length - 1,
    };
  }

  const rows: Row[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r];
    const obj: Partial<Row> = { estado: "nuevo" };
    cells.forEach((cell, idx) => {
      const key = mapped[idx];
      if (!key) return;
      const value = cell.trim();
      if (!value) return;
      if (key === "estado") {
        const v = value.toLowerCase() as EstadoLead;
        obj.estado = ESTADOS_VALIDOS.includes(v) ? v : "nuevo";
      } else {
        (obj as Record<string, string>)[key] = value;
      }
    });
    if (!obj.nombre || !obj.email) {
      errors.push(`Fila ${r + 1}: falta nombre o email — omitida.`);
      continue;
    }
    rows.push({
      nombre: obj.nombre,
      email: obj.email,
      empresa: obj.empresa,
      whatsapp: obj.whatsapp,
      mensaje: obj.mensaje,
      estado: obj.estado ?? "nuevo",
    });
  }
  return { rows, errors, totalLines: matrix.length - 1 };
}

export function LeadsImportModal({ open, onClose }: Props) {
  const addLeadsBulk = useNodaris((s) => s.addLeadsBulk);
  const [fileName, setFileName] = React.useState<string>("");
  const [parsed, setParsed] = React.useState<Parsed | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<{ inserted: number; errors: string[] } | null>(null);

  React.useEffect(() => {
    if (open) {
      setFileName("");
      setParsed(null);
      setImporting(false);
      setResult(null);
    }
  }, [open]);

  const onFile = async (file: File) => {
    setFileName(file.name);
    setResult(null);
    const text = await file.text();
    setParsed(buildRows(text));
  };

  const onImport = async () => {
    if (!parsed || parsed.rows.length === 0) return;
    setImporting(true);
    const res = await addLeadsBulk(parsed.rows);
    setImporting(false);
    setResult(res);
  };

  const validRows = parsed?.rows.length ?? 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Importar leads desde CSV"
      description="Subí un archivo .csv con tus leads. Aceptamos columnas: nombre, email, empresa, whatsapp, mensaje, estado."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={importing}>
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          {!result && (
            <Button onClick={onImport} disabled={!parsed || validRows === 0 || importing}>
              {importing ? "Importando…" : `Importar ${validRows} lead${validRows === 1 ? "" : "s"}`}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Dropzone */}
        <label className="flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed border-surface-border hover:border-brand-500 hover:bg-surface-subtle transition cursor-pointer">
          <Upload size={22} className="text-ink-faint" />
          <p className="text-sm font-medium text-ink">
            {fileName ? "Reemplazar archivo" : "Hacé click para subir un CSV"}
          </p>
          <p className="text-xs text-ink-faint">o arrastrá el archivo aquí</p>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>

        {/* Archivo cargado */}
        {fileName && (
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <FileText size={14} className="text-ink-faint" />
            <span className="font-medium">{fileName}</span>
            {parsed && (
              <span className="text-ink-faint">
                · {parsed.totalLines} fila{parsed.totalLines === 1 ? "" : "s"} · {validRows} válida{validRows === 1 ? "" : "s"}
              </span>
            )}
          </div>
        )}

        {/* Errores de parseo */}
        {parsed && parsed.errors.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
              <AlertCircle size={13} />
              {parsed.errors.length} aviso{parsed.errors.length === 1 ? "" : "s"}
            </div>
            <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5 max-h-24 overflow-y-auto">
              {parsed.errors.slice(0, 8).map((e, i) => <li key={i}>· {e}</li>)}
              {parsed.errors.length > 8 && <li>· …y {parsed.errors.length - 8} más</li>}
            </ul>
          </div>
        )}

        {/* Preview */}
        {parsed && validRows > 0 && !result && (
          <div className="rounded-xl border border-surface-border overflow-hidden">
            <div className="px-3 py-2 bg-surface-subtle text-xs font-semibold text-ink-subtle uppercase tracking-wider">
              Vista previa (primeros 5)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-ink-subtle">
                  <tr className="border-b border-surface-divider">
                    <th className="text-left px-3 py-2 font-medium">Nombre</th>
                    <th className="text-left px-3 py-2 font-medium">Email</th>
                    <th className="text-left px-3 py-2 font-medium">Empresa</th>
                    <th className="text-left px-3 py-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-divider">
                  {parsed.rows.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 text-ink">{r.nombre}</td>
                      <td className="px-3 py-1.5 text-ink-soft">{r.email}</td>
                      <td className="px-3 py-1.5 text-ink-soft">{r.empresa ?? "—"}</td>
                      <td className="px-3 py-1.5 text-ink-soft">{r.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className={
            result.errors.length > 0
              ? "rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/20 px-3 py-2"
              : "rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-3 py-2"
          }>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={14} />
              {result.inserted} lead{result.inserted === 1 ? "" : "s"} importado{result.inserted === 1 ? "" : "s"}
            </div>
            {result.errors.length > 0 && (
              <ul className="text-xs text-rose-700 dark:text-rose-300 mt-1 space-y-0.5">
                {result.errors.map((e, i) => <li key={i}>· {e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

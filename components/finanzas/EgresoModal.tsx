"use client";

import * as React from "react";
import { useNodaris } from "@/lib/store";
import { X } from "lucide-react";

export function EgresoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addEgreso = useNodaris((s) => s.addEgreso);

  const [concepto, setConcepto] = React.useState("");
  const [monto, setMonto] = React.useState("");
  const [fecha, setFecha] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setConcepto("");
      setMonto("");
      setFecha(new Date().toISOString().split("T")[0]);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto || !monto) return;
    
    await addEgreso({
      concepto,
      monto: parseFloat(monto),
      fecha,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-pop w-full max-w-md overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold text-ink">Registrar Egreso (Compra)</h2>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink transition">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1.5">Concepto / Proveedor</label>
            <input 
              required 
              placeholder="Ej. Suscripción Vercel, Figma..." 
              value={concepto} 
              onChange={(e) => setConcepto(e.target.value)} 
              className="w-full h-9 px-3 text-sm rounded-lg border border-surface-border bg-surface text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Monto ($)</label>
              <input 
                required 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder="0.00" 
                value={monto} 
                onChange={(e) => setMonto(e.target.value)} 
                className="w-full h-9 px-3 text-sm rounded-lg border border-surface-border bg-surface text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Fecha</label>
              <input 
                required 
                type="date" 
                value={fecha} 
                onChange={(e) => setFecha(e.target.value)} 
                className="w-full h-9 px-3 text-sm rounded-lg border border-surface-border bg-surface text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-surface-border mt-4">
            <button type="button" onClick={onClose} className="h-9 px-4 text-sm font-medium rounded-lg text-ink-soft hover:bg-surface-page transition">Cancelar</button>
            <button type="submit" className="h-9 px-4 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition">Guardar egreso</button>
          </div>
        </form>
      </div>
    </div>
  );
}
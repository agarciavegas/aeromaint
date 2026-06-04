'use client';

import { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UpdateHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraftId: string | null;
  currentHours: number;
  currentCycles: number;
  registration: string;
  onUpdated: () => void;
}

export function UpdateHoursDialog({
  open,
  onOpenChange,
  aircraftId,
  currentHours,
  currentCycles,
  registration,
  onUpdated,
}: UpdateHoursDialogProps) {
  const [totalHours, setTotalHours] = useState(currentHours.toString());
  const [totalCycles, setTotalCycles] = useState(currentCycles.toString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update local state when props change
  useState(() => {
    setTotalHours(currentHours.toString());
    setTotalCycles(currentCycles.toString());
  });

  const handleSubmit = async () => {
    if (!aircraftId) return;

    const newHours = parseFloat(totalHours);
    const newCycles = parseInt(totalCycles);

    if (isNaN(newHours) || isNaN(newCycles)) {
      setError('Valores inválidos');
      return;
    }

    if (newHours < currentHours) {
      setError('Las horas totales no pueden ser menores que las actuales');
      return;
    }

    if (newCycles < currentCycles) {
      setError('Los ciclos totales no pueden ser menores que los actuales');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/aircraft/${aircraftId}/hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalHours: newHours, totalCycles: newCycles }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar horas');
      }

      onUpdated();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar horas');
    } finally {
      setSubmitting(false);
    }
  };

  const hoursDiff = parseFloat(totalHours || '0') - currentHours;
  const cyclesDiff = parseInt(totalCycles || '0') - currentCycles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-emerald-600" />
            Actualizar Horas y Ciclos
          </DialogTitle>
          <DialogDescription>
            Actualice las horas y ciclos totales de <span className="font-mono font-bold">{registration}</span>.
            Esto propagará los cambios a todas las partes y reglas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="update-hours">Horas Totales (TSN)</Label>
              <Input id="update-hours" type="number" step="0.1" value={totalHours} onChange={(e) => setTotalHours(e.target.value)} className="font-mono" />
              <p className="text-xs text-zinc-400">
                Actual: {currentHours.toLocaleString()}h
                {hoursDiff > 0 && <span className="text-emerald-600 ml-1">+{hoursDiff.toFixed(1)}h</span>}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-cycles">Ciclos Totales</Label>
              <Input id="update-cycles" type="number" value={totalCycles} onChange={(e) => setTotalCycles(e.target.value)} className="font-mono" />
              <p className="text-xs text-zinc-400">
                Actual: {currentCycles.toLocaleString()}
                {cyclesDiff > 0 && <span className="text-emerald-600 ml-1">+{cyclesDiff}</span>}
              </p>
            </div>
          </div>

          {(hoursDiff > 0 || cyclesDiff > 0) && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-sm text-amber-800">
                Se actualizarán todas las partes y reglas de la aeronave con el incremento de horas y ciclos.
                Los estados de cumplimiento se recalcularán automáticamente.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
            {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Actualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

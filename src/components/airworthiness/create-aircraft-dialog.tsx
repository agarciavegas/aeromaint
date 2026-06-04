'use client';

import { useState, useEffect } from 'react';
import { Plane, Loader2 } from 'lucide-react';
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

interface ModelOption {
  id: string;
  name: string;
  manufacturer: string;
}

interface CreateAircraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelId: string | null;
  onCreated: () => void;
}

export function CreateAircraftDialog({ open, onOpenChange, modelId, onCreated }: CreateAircraftDialogProps) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModelId, setSelectedModelId] = useState(modelId || '');
  const [registration, setRegistration] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [totalHours, setTotalHours] = useState('0');
  const [totalCycles, setTotalCycles] = useState('0');
  const [year, setYear] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetch('/api/models')
        .then(r => r.json())
        .then(data => setModels(data.map((m: any) => ({ id: m.id, name: m.name, manufacturer: m.manufacturer }))))
        .catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    if (modelId) setSelectedModelId(modelId);
  }, [modelId]);

  const handleSubmit = async () => {
    if (!selectedModelId || !registration.trim()) {
      setError('Matrícula y modelo son obligatorios');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/aircraft/create-from-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModelId,
          registration: registration.trim().toUpperCase(),
          serialNumber: serialNumber.trim() || null,
          totalHours: parseFloat(totalHours) || 0,
          totalCycles: parseInt(totalCycles) || 0,
          year: year ? parseInt(year) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear aeronave');
      }

      setRegistration('');
      setSerialNumber('');
      setTotalHours('0');
      setTotalCycles('0');
      setYear('');
      onCreated();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Error al crear aeronave');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-emerald-600" />
            Crear Aeronave desde Modelo
          </DialogTitle>
          <DialogDescription>
            Cree una nueva aeronave copiando todas las partes y reglas del modelo seleccionado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="model">Modelo *</Label>
            <select
              id="model"
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Seleccionar modelo...</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.manufacturer})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="registration">Matrícula *</Label>
              <Input id="registration" placeholder="EC-ABC" value={registration} onChange={(e) => setRegistration(e.target.value.toUpperCase())} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial">Número de Serie</Label>
              <Input id="serial" placeholder="172-72345" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hours">Horas TSN</Label>
              <Input id="hours" type="number" value={totalHours} onChange={(e) => setTotalHours(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycles">Ciclos</Label>
              <Input id="cycles" type="number" value={totalCycles} onChange={(e) => setTotalCycles(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Input id="year" type="number" placeholder="2020" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedModelId || !registration.trim()} className="bg-emerald-600 hover:bg-emerald-700">
            {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Crear Aeronave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

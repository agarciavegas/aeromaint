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
import { Textarea } from '@/components/ui/textarea';

interface CreateModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateModelDialog({ open, onOpenChange, onCreated }: CreateModelDialogProps) {
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [engineModel, setEngineModel] = useState('');
  const [propModel, setPropModel] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !manufacturer.trim() || !model.trim()) {
      setError('Nombre, fabricante y modelo son obligatorios');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          engineModel: engineModel.trim() || null,
          propModel: propModel.trim() || null,
          description: description.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear modelo');
      }

      setName('');
      setManufacturer('');
      setModel('');
      setEngineModel('');
      setPropModel('');
      setDescription('');
      onCreated();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Error al crear modelo');
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
            Nuevo Modelo de Aeronave
          </DialogTitle>
          <DialogDescription>
            Cree una nueva plantilla de modelo de aeronave
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="model-name">Nombre *</Label>
            <Input id="model-name" placeholder="Cessna 172 Skyhawk" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Fabricante *</Label>
              <Input id="manufacturer" placeholder="Cessna" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-code">Modelo *</Label>
              <Input id="model-code" placeholder="172" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="engine-model">Motor</Label>
              <Input id="engine-model" placeholder="Lycoming O-360" value={engineModel} onChange={(e) => setEngineModel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prop-model">Hélice</Label>
              <Input id="prop-model" placeholder="McCauley 1C160" value={propModel} onChange={(e) => setPropModel(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-desc">Descripción</Label>
            <Textarea id="model-desc" placeholder="Descripción del modelo..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim() || !manufacturer.trim() || !model.trim()} className="bg-emerald-600 hover:bg-emerald-700">
            {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Crear Modelo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

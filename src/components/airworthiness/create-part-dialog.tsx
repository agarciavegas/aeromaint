'use client';

import { useState, useEffect } from 'react';
import { Wrench, Loader2 } from 'lucide-react';
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

interface PartOption {
  id: string;
  name: string;
}

interface CreatePartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraftId: string | null;
  existingParts?: PartOption[];
  onCreated: () => void;
}

export function CreatePartDialog({ open, onOpenChange, aircraftId, existingParts = [], onCreated }: CreatePartDialogProps) {
  const [name, setName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [ataChapter, setAtaChapter] = useState('');
  const [parentId, setParentId] = useState('');
  const [hoursSinceNew, setHoursSinceNew] = useState('0');
  const [hoursSinceOvh, setHoursSinceOvh] = useState('0');
  const [cyclesSinceNew, setCyclesSinceNew] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !aircraftId) {
      setError('Nombre es obligatorio');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/aircraft/${aircraftId}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          partNumber: partNumber.trim() || null,
          serialNumber: serialNumber.trim() || null,
          ataChapter: ataChapter.trim() || null,
          parentId: parentId || null,
          hoursSinceNew: parseFloat(hoursSinceNew) || 0,
          hoursSinceOvh: parseFloat(hoursSinceOvh) || 0,
          cyclesSinceNew: parseInt(cyclesSinceNew) || 0,
          status: 'serviceable',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear parte');
      }

      setName('');
      setPartNumber('');
      setSerialNumber('');
      setAtaChapter('');
      setParentId('');
      setHoursSinceNew('0');
      setHoursSinceOvh('0');
      setCyclesSinceNew('0');
      onCreated();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Error al crear parte');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-emerald-600" />
            Agregar Parte
          </DialogTitle>
          <DialogDescription>
            Agregue una nueva parte al aircraft
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="part-name">Nombre *</Label>
            <Input id="part-name" placeholder="Motor Lycoming O-360" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="part-number">P/N</Label>
              <Input id="part-number" placeholder="O-360-A4M" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial-number">S/N</Label>
              <Input id="serial-number" placeholder="L-12345" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ata">Capítulo ATA</Label>
              <Input id="ata" placeholder="72" value={ataChapter} onChange={(e) => setAtaChapter(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-part">Parte Padre</Label>
              <select
                id="parent-part"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Ninguna (raíz)</option>
                {existingParts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tsn">TSN (horas)</Label>
              <Input id="tsn" type="number" value={hoursSinceNew} onChange={(e) => setHoursSinceNew(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tso">TSO (horas)</Label>
              <Input id="tso" type="number" value={hoursSinceOvh} onChange={(e) => setHoursSinceOvh(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="csn">CSN (ciclos)</Label>
              <Input id="csn" type="number" value={cyclesSinceNew} onChange={(e) => setCyclesSinceNew(e.target.value)} className="font-mono" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()} className="bg-emerald-600 hover:bg-emerald-700">
            {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Agregar Parte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { Shield, Loader2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PartOption {
  id: string;
  name: string;
}

interface CreateRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aircraftId: string | null;
  existingParts: PartOption[];
  onCreated: () => void;
}

export function CreateRuleDialog({ open, onOpenChange, aircraftId, existingParts, onCreated }: CreateRuleDialogProps) {
  const [partId, setPartId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ruleType, setRuleType] = useState('hard_time');
  const [intervalHours, setIntervalHours] = useState('');
  const [intervalMonths, setIntervalMonths] = useState('');
  const [intervalCycles, setIntervalCycles] = useState('');
  const [reference, setReference] = useState('');
  const [category, setCategory] = useState('mandatory');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !ruleType || !category || !partId || !aircraftId) {
      setError('Nombre, tipo, categoría y parte son obligatorios');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/aircraft/${aircraftId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId,
          name: name.trim(),
          description: description.trim() || null,
          ruleType,
          intervalHours: intervalHours ? parseInt(intervalHours) : null,
          intervalMonths: intervalMonths ? parseInt(intervalMonths) : null,
          intervalCycles: intervalCycles ? parseInt(intervalCycles) : null,
          reference: reference.trim() || null,
          category,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear regla');
      }

      setName('');
      setDescription('');
      setRuleType('hard_time');
      setIntervalHours('');
      setIntervalMonths('');
      setIntervalCycles('');
      setReference('');
      setCategory('mandatory');
      setPartId('');
      onCreated();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Error al crear regla');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            Agregar Regla de Mantenimiento
          </DialogTitle>
          <DialogDescription>
            Defina una nueva regla de mantenimiento para una parte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="rule-part">Parte *</Label>
            <select
              id="rule-part"
              value={partId}
              onChange={(e) => setPartId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Seleccionar parte...</option>
              {existingParts.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-name">Nombre *</Label>
            <Input id="rule-name" placeholder="Overhaul del Motor" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-desc">Descripción</Label>
            <Textarea id="rule-desc" placeholder="Descripción de la regla..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo de Regla</Label>
              <Select value={ruleType} onValueChange={setRuleType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hard_time">Tiempo Fijo</SelectItem>
                  <SelectItem value="on_condition">Condición</SelectItem>
                  <SelectItem value="inspection">Inspección</SelectItem>
                  <SelectItem value="ad">DA/CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mandatory">Obligatoria</SelectItem>
                  <SelectItem value="recommended">Recomendada</SelectItem>
                  <SelectItem value="ad">DA/CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="int-hours">Intervalo (horas)</Label>
              <Input id="int-hours" type="number" placeholder="2000" value={intervalHours} onChange={(e) => setIntervalHours(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="int-months">Intervalo (meses)</Label>
              <Input id="int-months" type="number" placeholder="12" value={intervalMonths} onChange={(e) => setIntervalMonths(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="int-cycles">Intervalo (ciclos)</Label>
              <Input id="int-cycles" type="number" placeholder="500" value={intervalCycles} onChange={(e) => setIntervalCycles(e.target.value)} className="font-mono" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-ref">Referencia</Label>
            <Input id="rule-ref" placeholder="FAR 91.409, Lycoming SB XXX" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim() || !partId} className="bg-emerald-600 hover:bg-emerald-700">
            {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Agregar Regla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

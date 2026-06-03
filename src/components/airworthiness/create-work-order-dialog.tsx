'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Loader2, Plus, X } from 'lucide-react';
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
import type { Aircraft } from './types';

interface CreateWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedRuleIds?: string[];
  preselectedAircraftId?: string;
  onCreated: () => void;
}

export function CreateWorkOrderDialog({
  open,
  onOpenChange,
  preselectedRuleIds = [],
  preselectedAircraftId,
  onCreated,
}: CreateWorkOrderDialogProps) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [aircraftId, setAircraftId] = useState(preselectedAircraftId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [type, setType] = useState('scheduled');
  const [assignedTo, setAssignedTo] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [ruleIds, setRuleIds] = useState<string[]>(preselectedRuleIds);
  const [manualItems, setManualItems] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAircraft();
  }, []);

  useEffect(() => {
    if (preselectedAircraftId) setAircraftId(preselectedAircraftId);
    if (preselectedRuleIds.length > 0) setRuleIds(preselectedRuleIds);
  }, [preselectedAircraftId, preselectedRuleIds]);

  const fetchAircraft = async () => {
    try {
      const res = await fetch('/api/aircraft');
      if (res.ok) {
        const data = await res.json();
        setAircraft(data);
      }
    } catch (err) {
      console.error('Error fetching aircraft:', err);
    }
  };

  const handleSubmit = async () => {
    if (!aircraftId || !title.trim()) {
      setError('Aeronave y título son obligatorios');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const validManualItems = manualItems.filter(i => i.trim());
      const res = await fetch('/api/workorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aircraftId,
          title: title.trim(),
          description: description.trim() || null,
          priority,
          type,
          assignedTo: assignedTo.trim() || null,
          scheduledDate: scheduledDate || null,
          ruleIds,
          manualItems: validManualItems,
        }),
      });

      if (res.ok) {
        setTitle('');
        setDescription('');
        setPriority('normal');
        setType('scheduled');
        setAssignedTo('');
        setScheduledDate('');
        setRuleIds([]);
        setManualItems(['']);
        onCreated();
        onOpenChange(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al crear orden de trabajo');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            Crear Orden de Trabajo
          </DialogTitle>
          <DialogDescription>
            {ruleIds.length > 0
              ? `Se incluirán ${ruleIds.length} regla(s) seleccionada(s) como items`
              : 'Cree una nueva orden de trabajo'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="wo-aircraft">Aeronave *</Label>
            <select
              id="wo-aircraft"
              value={aircraftId}
              onChange={(e) => setAircraftId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Seleccionar aeronave...</option>
              {aircraft.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.registration} — {a.model?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wo-title">Título *</Label>
            <Input
              id="wo-title"
              placeholder="Inspección Anual - EC-ABC"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wo-desc">Descripción</Label>
            <Textarea
              id="wo-desc"
              placeholder="Descripción de la orden de trabajo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programada</SelectItem>
                  <SelectItem value="unscheduled">No programada</SelectItem>
                  <SelectItem value="ad_compliance">DA/CAD</SelectItem>
                  <SelectItem value="inspection">Inspección</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wo-assigned">Asignado a</Label>
              <Input
                id="wo-assigned"
                placeholder="Taller Mantenimiento A"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wo-date">Fecha programada</Label>
              <Input
                id="wo-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
          </div>

          {ruleIds.length > 0 && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-sm font-medium text-emerald-800">
                {ruleIds.length} regla(s) seleccionada(s) se agregarán como items
              </p>
            </div>
          )}

          {/* Manual items */}
          <div className="space-y-2">
            <Label>Items Adicionales</Label>
            {manualItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder="Descripción del item..."
                  value={item}
                  onChange={(e) => {
                    const newItems = [...manualItems];
                    newItems[idx] = e.target.value;
                    setManualItems(newItems);
                  }}
                  className="text-sm"
                />
                {idx > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setManualItems(manualItems.filter((_, i) => i !== idx))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManualItems([...manualItems, ''])}
              className="w-full"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Agregar Item
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !aircraftId || !title.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Crear Orden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

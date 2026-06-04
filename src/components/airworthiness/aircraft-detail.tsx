'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Send, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from './rule-badge';
import { PartTree } from './part-tree';
import { useAppStore } from '@/store/app-store';

interface AircraftDetailData {
  id: string;
  registration: string;
  serialNumber: string | null;
  totalHours: number;
  totalCycles: number;
  year: number | null;
  status: string;
  model: {
    id: string;
    name: string;
    engineModel: string | null;
    propModel: string | null;
  };
  parts: any[];
}

interface AircraftDetailProps {
  aircraftId: string;
  onBack: () => void;
  onUpdateHours: () => void;
  onCreateWorkOrder: (ruleIds: string[], aircraftId: string) => void;
}

export function AircraftDetail({ aircraftId, onBack, onUpdateHours, onCreateWorkOrder }: AircraftDetailProps) {
  const [aircraft, setAircraft] = useState<AircraftDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedRuleIds, clearRuleSelection } = useAppStore();

  const fetchAircraft = useCallback(() => {
    setLoading(true);
    fetch(`/api/aircraft/${aircraftId}`)
      .then(r => r.json())
      .then(data => { setAircraft(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [aircraftId]);

  useEffect(() => {
    fetchAircraft();
    return () => { clearRuleSelection(); };
  }, [fetchAircraft, clearRuleSelection]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-zinc-400">Cargando...</div>
      </div>
    );
  }

  if (!aircraft) {
    return (
      <div className="p-6 text-center text-zinc-500">
        <p>Aeronave no encontrada</p>
        <Button variant="outline" onClick={onBack} className="mt-4">Volver</Button>
      </div>
    );
  }

  const countRules = (parts: any[]): { compliant: number; due_soon: number; overdue: number; total: number } => {
    let compliant = 0, due_soon = 0, overdue = 0, total = 0;
    const walk = (partsList: any[]) => {
      for (const p of partsList) {
        for (const r of p.rules || []) {
          total++;
          if (r.status === 'compliant') compliant++;
          else if (r.status === 'due_soon') due_soon++;
          else if (r.status === 'overdue') overdue++;
        }
        if (p.children) walk(p.children);
      }
    };
    walk(parts);
    return { compliant, due_soon, overdue, total };
  };

  const ruleCounts = countRules(aircraft.parts);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold font-mono">{aircraft.registration}</h1>
            <StatusBadge status={aircraft.status} type="aircraft" />
          </div>
          <p className="text-sm text-zinc-500">{aircraft.model.name} — S/N: <span className="font-mono">{aircraft.serialNumber || 'N/A'}</span></p>
        </div>
      </div>

      {/* Aircraft info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-zinc-500">Horas Totales</p>
            <p className="text-lg font-bold font-mono">{aircraft.totalHours.toLocaleString()}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-zinc-500">Ciclos Totales</p>
            <p className="text-lg font-bold font-mono">{aircraft.totalCycles.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-zinc-500">Año</p>
            <p className="text-lg font-bold font-mono">{aircraft.year || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-zinc-500">Motor</p>
            <p className="text-sm font-medium">{aircraft.model.engineModel || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={onUpdateHours}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Actualizar Horas/Ciclos
        </Button>
        {selectedRuleIds.length > 0 && (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onCreateWorkOrder(selectedRuleIds, aircraft.id)}>
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Crear Orden ({selectedRuleIds.length} regla{selectedRuleIds.length > 1 ? 's' : ''})
          </Button>
        )}
      </div>

      {/* Compliance summary */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-zinc-500">{ruleCounts.total} reglas totales:</span>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>{ruleCounts.compliant} conformes</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>{ruleCounts.due_soon} próximas</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>{ruleCounts.overdue} vencidas</span>
        </div>
      </div>

      {/* Part tree */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Árbol de Partes y Reglas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <PartTree parts={aircraft.parts} showPartNumbers showHours />
        </CardContent>
      </Card>
    </div>
  );
}

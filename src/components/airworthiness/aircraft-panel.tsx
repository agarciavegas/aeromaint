'use client';

import { useState } from 'react';
import { Plane, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge } from './rule-badge';
import { AircraftDetail } from './aircraft-detail';
import { getAircraftList } from '@/lib/local-db';
import type { Aircraft } from '@/lib/local-db';

interface AircraftPanelProps {
  onUpdateHours: (aircraftId: string) => void;
  onCreateWorkOrder: (ruleIds: string[], aircraftId: string) => void;
}

export function AircraftPanel({ onUpdateHours, onCreateWorkOrder }: AircraftPanelProps) {
  const [aircraft, setAircraft] = useState<Aircraft[]>(() => {
    try { return getAircraftList(); } catch { return []; }
  });
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refreshAircraft = () => {
    try { setAircraft(getAircraftList()); } catch {}
  };

  const filteredAircraft = aircraft.filter(
    (a) =>
      a.registration.toLowerCase().includes(search.toLowerCase()) ||
      a.model?.name.toLowerCase().includes(search.toLowerCase())
  );

  const getRuleStatuses = (a: Aircraft) => {
    let overdue = 0, dueSoon = 0;
    const walk = (parts: Aircraft['parts']) => {
      for (const p of parts) {
        for (const r of p.rules || []) {
          if (r.status === 'overdue') overdue++;
          if (r.status === 'due_soon') dueSoon++;
        }
        if (p.children) walk(p.children as Aircraft['parts']);
      }
    };
    walk(a.parts || []);
    return { overdue, dueSoon };
  };

  if (selectedId) {
    return (
      <AircraftDetail
        aircraftId={selectedId}
        onBack={() => { setSelectedId(null); refreshAircraft(); }}
        onUpdateHours={() => onUpdateHours(selectedId)}
        onCreateWorkOrder={onCreateWorkOrder}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Aeronaves</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestión de aeronaves y su estado de aeronavegabilidad</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Buscar por matrícula o modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredAircraft.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <Plane className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No se encontraron aeronaves</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAircraft.map((a) => {
            const statuses = getRuleStatuses(a);
            return (
              <Card
                key={a.id}
                className="cursor-pointer hover:shadow-md transition-shadow border border-zinc-200"
                onClick={() => setSelectedId(a.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold font-mono">{a.registration}</h3>
                      <p className="text-sm text-zinc-500">{a.model?.name}</p>
                    </div>
                    <StatusBadge status={a.status} type="aircraft" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-zinc-400 text-xs">Horas TSN</span>
                      <p className="font-mono font-medium">{a.totalHours.toLocaleString()}h</p>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-xs">Ciclos</span>
                      <p className="font-mono font-medium">{a.totalCycles.toLocaleString()}</p>
                    </div>
                  </div>
                  {(statuses.overdue > 0 || statuses.dueSoon > 0) && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-100">
                      {statuses.overdue > 0 && (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          {statuses.overdue} vencida{statuses.overdue > 1 ? 's' : ''}
                        </span>
                      )}
                      {statuses.dueSoon > 0 && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          {statuses.dueSoon} próxima{statuses.dueSoon > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

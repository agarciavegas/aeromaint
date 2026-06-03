'use client';

import { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, ChevronDown, Settings2, Wrench, CircleDot, Plane } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AircraftModel, PartTemplate, RuleTemplate } from './types';

interface ModelsPanelProps {
  onCreateAircraft: (modelId: string) => void;
}

export function ModelsPanel({ onCreateAircraft }: ModelsPanelProps) {
  const [models, setModels] = useState<AircraftModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models');
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (err) {
      console.error('Error fetching models:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Modelos de Aeronaves</h1>
        <p className="text-sm text-zinc-500 mt-1">Plantillas predefinidas para crear nuevas aeronaves</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No hay modelos disponibles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {models.map((model) => {
            const isExpanded = expandedModelId === model.id;
            return (
              <Card key={model.id} className="border border-zinc-200">
                <CardContent className="p-4">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setExpandedModelId(isExpanded ? null : model.id)}
                  >
                    <button className="h-6 w-6 flex items-center justify-center text-zinc-400 hover:text-zinc-700 shrink-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <Plane className="h-5 w-5 text-zinc-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900">{model.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                        {model.engineModel && <span>Motor: {model.engineModel}</span>}
                        {model.propModel && <span>Hélice: {model.propModel}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {model._count?.aircraft || 0} aeronave(s)
                    </Badge>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pl-9 space-y-3">
                      {model.description && (
                        <p className="text-sm text-zinc-500 italic">{model.description}</p>
                      )}

                      {/* Template parts tree */}
                      <div className="space-y-1">
                        {model.parts?.map((pt) => (
                          <TemplatePartNode key={pt.id} part={pt} level={0} />
                        ))}
                      </div>

                      <div className="pt-3 border-t border-zinc-100">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => onCreateAircraft(model.id)}
                        >
                          <Plane className="h-3.5 w-3.5 mr-1.5" />
                          Crear Aeronave desde este Modelo
                        </Button>
                      </div>
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

function TemplatePartNode({ part, level }: { part: PartTemplate; level: number }) {
  const [expanded, setExpanded] = useState(level < 1);
  const hasChildren = part.children && part.children.length > 0;
  const hasRules = part.rules && part.rules.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-zinc-50 cursor-pointer"
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        {(hasChildren || hasRules) ? (
          <div className="h-5 w-5 flex items-center justify-center text-zinc-400 shrink-0">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </div>
        ) : (
          <div className="h-5 w-5 flex items-center justify-center shrink-0">
            <CircleDot className="h-2.5 w-2.5 text-zinc-300" />
          </div>
        )}
        {level === 0 ? (
          <Settings2 className="h-4 w-4 text-zinc-500 shrink-0" />
        ) : (
          <Wrench className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        )}
        <span className="text-sm font-medium text-zinc-800 flex-1">{part.name}</span>
        {part.ataChapter && (
          <span className="text-[10px] text-zinc-400 font-mono bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">
            ATA {part.ataChapter}
          </span>
        )}
        {hasRules && (
          <span className="text-[10px] text-zinc-500 shrink-0">{part.rules.length} regla(s)</span>
        )}
      </div>

      {expanded && (
        <div>
          {hasRules && (
            <div style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }} className="space-y-0.5">
              {part.rules.map((rule) => (
                <div key={rule.id} className="flex items-center gap-2 py-1 px-2">
                  <span className="text-xs text-zinc-600 flex-1">{rule.name}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {rule.intervalHours && `${rule.intervalHours}h`}
                    {rule.intervalHours && rule.intervalMonths ? ' / ' : ''}
                    {rule.intervalMonths && `${rule.intervalMonths}m`}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {rule.ruleType === 'hard_time' ? 'Tiempo fijo' : rule.ruleType === 'on_condition' ? 'Condición' : 'Inspección'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          {hasChildren && (
            <div>
              {part.children.map((child) => (
                <TemplatePartNode key={child.id} part={child} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

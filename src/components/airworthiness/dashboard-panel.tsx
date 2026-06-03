'use client';

import { useEffect, useState } from 'react';
import { Plane, ClipboardList, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, PriorityBadge } from './rule-badge';
import { useAppStore } from '@/store/app-store';
import type { WorkOrder } from './types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DashboardStats {
  totalAircraft: number;
  activeWorkOrders: number;
  overdueRules: number;
  dueSoonRules: number;
  compliantRules: number;
  naRules: number;
  recentWorkOrders: WorkOrder[];
}

export function DashboardPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { setPanel, selectWorkOrder } = useAppStore();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const complianceData = [
    { name: 'Conformes', value: stats.compliantRules, color: '#10b981' },
    { name: 'Próximas a vencer', value: stats.dueSoonRules, color: '#f59e0b' },
    { name: 'Vencidas', value: stats.overdueRules, color: '#ef4444' },
    { name: 'N/A', value: stats.naRules, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const totalRules = stats.compliantRules + stats.dueSoonRules + stats.overdueRules + stats.naRules;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Panel Principal</h1>
        <p className="text-sm text-zinc-500 mt-1">Resumen de estado de aeronavegabilidad</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Aeronaves</p>
                <p className="text-2xl font-bold text-zinc-900">{stats.totalAircraft}</p>
              </div>
              <Plane className="h-8 w-8 text-emerald-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-sky-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Ordenes Activas</p>
                <p className="text-2xl font-bold text-zinc-900">{stats.activeWorkOrders}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-sky-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Reglas Vencidas</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdueRules}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">Próximas a Vencer</p>
                <p className="text-2xl font-bold text-amber-600">{stats.dueSoonRules}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and recent work orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance pie chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Estado de Cumplimiento</CardTitle>
            <CardDescription>
              {totalRules} reglas totales — {stats.compliantRules} conformes ({totalRules > 0 ? Math.round((stats.compliantRules / totalRules) * 100) : 0}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {complianceData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={complianceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {complianceData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value} reglas`, name]}
                    />
                    <Legend
                      formatter={(value: string) => <span className="text-xs text-zinc-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-zinc-400">
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
                  <p>Sin datos de cumplimiento</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent work orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ordenes de Trabajo Recientes</CardTitle>
            <CardDescription>Últimas órdenes creadas o actualizadas</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentWorkOrders.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">No hay órdenes de trabajo</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {stats.recentWorkOrders.map((wo) => (
                  <button
                    key={wo.id}
                    className="w-full text-left p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
                    onClick={() => {
                      setPanel('workorders');
                      selectWorkOrder(wo.id);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-zinc-500">{wo.number}</span>
                      <StatusBadge status={wo.status} type="workorder" />
                    </div>
                    <p className="text-sm font-medium text-zinc-900 truncate">{wo.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500">{wo.aircraft?.registration}</span>
                      <PriorityBadge priority={wo.priority} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

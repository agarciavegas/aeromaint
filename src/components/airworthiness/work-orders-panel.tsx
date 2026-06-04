'use client';

import { useState, useCallback } from 'react';
import { ArrowLeft, ClipboardList, Plus, CheckCircle2, Play, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge, PriorityBadge } from './rule-badge';
import { useAppStore } from '@/store/app-store';
import { getWorkOrders, getWorkOrder, updateWorkOrder as dbUpdateWorkOrder, deleteWorkOrder as dbDeleteWorkOrder, addWorkOrderItem as dbAddWorkOrderItem, updateWorkOrderItem as dbUpdateWorkOrderItem } from '@/lib/local-db';
import type { WorkOrder } from '@/lib/local-db';

interface WorkOrdersPanelProps {
  onCreateWorkOrder: () => void;
}

export function WorkOrdersPanel({ onCreateWorkOrder }: WorkOrdersPanelProps) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    try { return getWorkOrders(); } catch { return []; }
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { selectedWorkOrderId, selectWorkOrder } = useAppStore();

  // Handle incoming selection from dashboard
  if (selectedWorkOrderId && !selectedId) {
    setSelectedId(selectedWorkOrderId);
    selectWorkOrder(null);
  }

  const refreshWorkOrders = () => {
    try { setWorkOrders(getWorkOrders()); } catch {}
  };

  const filteredWorkOrders = workOrders.filter(
    (wo) => statusFilter === 'all' || wo.status === statusFilter
  );

  if (selectedId) {
    return (
      <WorkOrderDetail
        workOrderId={selectedId}
        onBack={() => { setSelectedId(null); refreshWorkOrders(); }}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Ordenes de Trabajo</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestión de órdenes de mantenimiento</p>
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onCreateWorkOrder}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nueva Orden
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filtrar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="open">Abierta</SelectItem>
            <SelectItem value="in_progress">En progreso</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-zinc-400">{filteredWorkOrders.length} orden(es)</span>
      </div>

      {filteredWorkOrders.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No hay órdenes de trabajo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWorkOrders.map((wo) => (
            <Card
              key={wo.id}
              className="cursor-pointer hover:shadow-md transition-shadow border border-zinc-200"
              onClick={() => setSelectedId(wo.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-zinc-500">{wo.number}</span>
                      <StatusBadge status={wo.status} type="workorder" />
                      <PriorityBadge priority={wo.priority} />
                    </div>
                    <h3 className="text-sm font-medium text-zinc-900">{wo.title}</h3>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono">{wo.aircraft?.registration}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>{wo.items?.length || 0} item(s)</span>
                  {wo.assignedTo && <span>Asignado: {wo.assignedTo}</span>}
                  {wo.scheduledDate && (
                    <span>Programada: {new Date(wo.scheduledDate).toLocaleDateString('es-ES')}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkOrderDetail({ workOrderId, onBack }: { workOrderId: string; onBack: () => void }) {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(() => {
    try { return getWorkOrder(workOrderId); } catch { return null; }
  });
  const [newItemDesc, setNewItemDesc] = useState('');

  const refreshWorkOrder = useCallback(() => {
    try { setWorkOrder(getWorkOrder(workOrderId)); } catch {}
  }, [workOrderId]);

  const handleUpdateStatus = (newStatus: string) => {
    try {
      dbUpdateWorkOrder(workOrderId, { status: newStatus });
      refreshWorkOrder();
    } catch (err) {
      console.error('Error updating work order:', err);
    }
  };

  const handleUpdateItemStatus = (itemId: string, newStatus: string) => {
    try {
      dbUpdateWorkOrderItem(itemId, { status: newStatus });
      refreshWorkOrder();
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleAddManualItem = () => {
    if (!newItemDesc.trim()) return;
    try {
      dbAddWorkOrderItem(workOrderId, newItemDesc.trim());
      setNewItemDesc('');
      refreshWorkOrder();
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const handleDelete = () => {
    if (confirm('¿Eliminar esta orden de trabajo?')) {
      try {
        dbDeleteWorkOrder(workOrderId);
        onBack();
      } catch (err) {
        console.error('Error deleting work order:', err);
      }
    }
  };

  if (!workOrder) {
    return (
      <div className="p-6 text-center text-zinc-500">
        <p>Orden de trabajo no encontrada</p>
        <Button variant="outline" onClick={onBack} className="mt-4">Volver</Button>
      </div>
    );
  }

  const completedItems = workOrder.items?.filter(i => i.status === 'completed').length || 0;
  const totalItems = workOrder.items?.length || 0;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm text-zinc-500">{workOrder.number}</span>
            <StatusBadge status={workOrder.status} type="workorder" />
            <PriorityBadge priority={workOrder.priority} />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mt-1">{workOrder.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-zinc-500">Aeronave</p>
            <p className="text-sm font-bold font-mono">{workOrder.aircraft?.registration}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-zinc-500">Tipo</p>
            <p className="text-sm font-medium capitalize">{workOrder.type === 'ad_compliance' ? 'DA/CAD' : workOrder.type}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-zinc-500">Asignado a</p>
            <p className="text-sm font-medium">{workOrder.assignedTo || 'Sin asignar'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-zinc-500">Progreso</p>
            <p className="text-sm font-bold">{completedItems}/{totalItems}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {workOrder.status === 'open' && (
          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus('in_progress')}>
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Iniciar
          </Button>
        )}
        {workOrder.status === 'in_progress' && (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateStatus('completed')}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Completar
          </Button>
        )}
        {(workOrder.status === 'open' || workOrder.status === 'in_progress') && (
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleUpdateStatus('cancelled')}>
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Cancelar
          </Button>
        )}
        <Button size="sm" variant="ghost" className="text-red-500" onClick={handleDelete}>
          Eliminar
        </Button>
      </div>

      {workOrder.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 mb-1">Descripción</p>
            <p className="text-sm text-zinc-700">{workOrder.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Items de Trabajo</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {workOrder.items?.length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-4">No hay items</p>
          )}
          {workOrder.items?.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 hover:bg-zinc-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-900">{item.description}</p>
                {item.rule && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Regla: {item.rule.name} — {item.rule.part?.name}
                  </p>
                )}
                {item.notes && (
                  <p className="text-xs text-zinc-400 mt-0.5">Notas: {item.notes}</p>
                )}
                {item.completedBy && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Completado por: {item.completedBy} — {item.completedDate ? new Date(item.completedDate).toLocaleDateString('es-ES') : ''}
                  </p>
                )}
              </div>
              <StatusBadge status={item.status} type="item" />
              {workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
                <div className="flex items-center gap-1">
                  {item.status === 'pending' && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleUpdateItemStatus(item.id, 'in_progress')}>
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  {(item.status === 'pending' || item.status === 'in_progress') && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600" onClick={() => handleUpdateItemStatus(item.id, 'completed')}>
                      <CheckCircle2 className="h-3 w-3" />
                    </Button>
                  )}
                  {item.status === 'pending' && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-600" onClick={() => handleUpdateItemStatus(item.id, 'deferred')}>
                      Diferir
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100">
              <Textarea
                placeholder="Descripción del nuevo item..."
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="text-sm min-h-[40px] h-10 resize-none"
                rows={1}
              />
              <Button size="sm" variant="outline" onClick={handleAddManualItem} disabled={!newItemDesc.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

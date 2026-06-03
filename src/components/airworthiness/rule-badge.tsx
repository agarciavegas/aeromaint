'use client';

export type RuleStatus = 'compliant' | 'due_soon' | 'overdue' | 'na';

import { Badge } from '@/components/ui/badge';

const statusConfig: Record<RuleStatus, { label: string; className: string }> = {
  compliant: {
    label: 'Conforme',
    className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200',
  },
  due_soon: {
    label: 'Próximo venc.',
    className: 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200',
  },
  overdue: {
    label: 'Vencida',
    className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
  },
  na: {
    label: 'N/A',
    className: 'bg-slate-100 text-slate-600 hover:bg-slate-100 border-slate-200',
  },
};

interface RuleBadgeProps {
  status: RuleStatus;
  size?: 'sm' | 'md';
}

export function RuleBadge({ status, size = 'sm' }: RuleBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={`${config.className} font-medium ${size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}
    >
      {config.label}
    </Badge>
  );
}

export function StatusBadge({ status, type = 'aircraft' }: { status: string; type?: 'aircraft' | 'workorder' | 'part' | 'item' }) {
  const configs: Record<string, { label: string; className: string }> = {
    // Aircraft statuses
    active: { label: 'Activo', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    grounded: { label: 'En tierra', className: 'bg-red-100 text-red-800 border-red-200' },
    maintenance: { label: 'En mantenimiento', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    // Work order statuses
    open: { label: 'Abierta', className: 'bg-sky-100 text-sky-800 border-sky-200' },
    in_progress: { label: 'En progreso', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    completed: { label: 'Completada', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    cancelled: { label: 'Cancelada', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    // Part statuses
    serviceable: { label: 'Servicio', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    unserviceable: { label: 'Fuera de servicio', className: 'bg-red-100 text-red-800 border-red-200' },
    overhaul_due: { label: 'Overhaul pend.', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    // Item statuses
    pending: { label: 'Pendiente', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    deferred: { label: 'Diferido', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  };

  const config = configs[status] || { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <Badge variant="outline" className={`${config.className} font-medium text-xs`}>
      {config.label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    low: { label: 'Baja', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    normal: { label: 'Normal', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    high: { label: 'Alta', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800 border-red-200' },
  };

  const config = configs[priority] || { label: priority, className: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <Badge variant="outline" className={`${config.className} font-medium text-xs`}>
      {config.label}
    </Badge>
  );
}

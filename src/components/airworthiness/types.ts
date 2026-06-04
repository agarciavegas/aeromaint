'use client';

// Re-export types from local-db for backward compatibility
export type {
  AircraftModel as AircraftModelTemplate,
  PartTemplate,
  RuleTemplate,
  Aircraft,
  Part,
  Rule,
  WorkOrder,
  WorkOrderItem,
} from '@/lib/local-db';

export type { RuleStatus } from './rule-badge';

'use client';

import { RuleStatus } from './rule-badge';

export type { RuleStatus };

export interface AircraftModel {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  engineModel: string | null;
  propModel: string | null;
  description: string | null;
  parts: PartTemplate[];
  _count?: { aircraft: number };
}

export interface PartTemplate {
  id: string;
  name: string;
  ataChapter: string | null;
  description: string | null;
  parentId: string | null;
  modelId: string;
  sortOrder: number;
  rules: RuleTemplate[];
  children: PartTemplate[];
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string | null;
  ruleType: string;
  intervalHours: number | null;
  intervalMonths: number | null;
  intervalCycles: number | null;
  reference: string | null;
  category: string;
  partTemplateId: string;
}

export interface Aircraft {
  id: string;
  registration: string;
  serialNumber: string | null;
  modelId: string;
  totalHours: number;
  totalCycles: number;
  year: number | null;
  description: string | null;
  status: string;
  model: AircraftModel;
  parts: Part[];
  workOrders: WorkOrder[];
}

export interface Part {
  id: string;
  name: string;
  serialNumber: string | null;
  parentId: string | null;
  aircraftId: string;
  templateId: string | null;
  hoursSinceNew: number;
  hoursSinceOvh: number;
  cyclesSinceNew: number;
  installDate: string | null;
  lastOverhaulDate: string | null;
  status: string;
  sortOrder: number;
  rules: Rule[];
  children: Part[];
}

export interface Rule {
  id: string;
  name: string;
  description: string | null;
  ruleType: string;
  intervalHours: number | null;
  intervalMonths: number | null;
  intervalCycles: number | null;
  reference: string | null;
  category: string;
  hoursSinceLast: number;
  cyclesSinceLast: number;
  dateLastCompleted: string | null;
  dueDate: string | null;
  status: RuleStatus;
  partId: string;
  templateId: string | null;
  part?: Part;
}

export interface WorkOrder {
  id: string;
  number: string;
  title: string;
  description: string | null;
  aircraftId: string;
  status: string;
  priority: string;
  type: string;
  assignedTo: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  aircraft: Aircraft;
  items: WorkOrderItem[];
}

export interface WorkOrderItem {
  id: string;
  workOrderId: string;
  ruleId: string | null;
  description: string;
  status: string;
  notes: string | null;
  completedBy: string | null;
  completedDate: string | null;
  sortOrder: number;
  rule?: Rule | null;
}

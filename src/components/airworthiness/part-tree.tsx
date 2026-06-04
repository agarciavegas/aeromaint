'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Wrench, Settings2, CircleDot } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RuleBadge } from './rule-badge';
import { useAppStore } from '@/store/app-store';
import type { Part, Rule } from './types';

interface PartTreeProps {
  parts: Part[];
  onRuleClick?: (rule: Rule) => void;
}

export function PartTree({ parts, onRuleClick }: PartTreeProps) {
  return (
    <div className="space-y-1">
      {parts.map((part) => (
        <PartNode key={part.id} part={part} level={0} onRuleClick={onRuleClick} />
      ))}
    </div>
  );
}

function PartNode({ part, level, onRuleClick }: { part: Part; level: number; onRuleClick?: (rule: Rule) => void }) {
  const [expanded, setExpanded] = useState(level < 1);
  const { selectedRuleIds, toggleRuleSelection } = useAppStore();
  const hasChildren = part.children && part.children.length > 0;
  const hasRules = part.rules && part.rules.length > 0;

  // Count rule statuses
  const ruleStatusCounts = {
    compliant: part.rules?.filter(r => r.status === 'compliant').length || 0,
    due_soon: part.rules?.filter(r => r.status === 'due_soon').length || 0,
    overdue: part.rules?.filter(r => r.status === 'overdue').length || 0,
  };

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-zinc-50 group cursor-pointer"
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {/* Expand/collapse */}
        {(hasChildren || hasRules) ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="h-5 w-5 flex items-center justify-center text-zinc-400 hover:text-zinc-700 shrink-0"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <div className="h-5 w-5 flex items-center justify-center shrink-0">
            <CircleDot className="h-2.5 w-2.5 text-zinc-300" />
          </div>
        )}

        {/* Part icon */}
        {level === 0 ? (
          <Settings2 className="h-4 w-4 text-zinc-500 shrink-0" />
        ) : (
          <Wrench className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        )}

        {/* Part name */}
        <span className="text-sm font-medium text-zinc-800 truncate flex-1">{part.name}</span>

        {/* ATA chapter */}
        {part.ataChapter && (
          <span className="text-[10px] text-zinc-400 font-mono bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">
            ATA {part.ataChapter}
          </span>
        )}

        {/* Status dots */}
        <div className="flex items-center gap-1 shrink-0">
          {ruleStatusCounts.overdue > 0 && (
            <span className="h-2 w-2 rounded-full bg-red-500" title={`${ruleStatusCounts.overdue} vencida(s)`} />
          )}
          {ruleStatusCounts.due_soon > 0 && (
            <span className="h-2 w-2 rounded-full bg-amber-500" title={`${ruleStatusCounts.due_soon} próxima(s)`} />
          )}
          {ruleStatusCounts.compliant > 0 && (
            <span className="h-2 w-2 rounded-full bg-emerald-500" title={`${ruleStatusCounts.compliant} conforme(s)`} />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div>
          {/* Rules */}
          {hasRules && (
            <div style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }} className="space-y-0.5">
              {part.rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-2 py-1 px-2 rounded hover:bg-zinc-50 cursor-pointer"
                  onClick={() => onRuleClick?.(rule)}
                >
                  <Checkbox
                    checked={selectedRuleIds.includes(rule.id)}
                    onCheckedChange={() => toggleRuleSelection(rule.id)}
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs text-zinc-600 flex-1 truncate">{rule.name}</span>
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                    {rule.intervalHours && `${rule.intervalHours}h`}
                    {rule.intervalHours && rule.intervalMonths ? ' / ' : ''}
                    {rule.intervalMonths && `${rule.intervalMonths}m`}
                  </span>
                  <RuleBadge status={rule.status as 'compliant' | 'due_soon' | 'overdue' | 'na'} />
                </div>
              ))}
            </div>
          )}

          {/* Children parts */}
          {hasChildren && (
            <div>
              {part.children.map((child) => (
                <PartNode key={child.id} part={child} level={level + 1} onRuleClick={onRuleClick} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

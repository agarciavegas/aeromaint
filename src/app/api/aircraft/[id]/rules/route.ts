import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function calculateRuleStatus(
  hoursSinceLast: number,
  cyclesSinceLast: number,
  dateLastCompleted: Date | null,
  intervalHours: number | null,
  intervalMonths: number | null,
  intervalCycles: number | null
): string {
  let maxRatio = 0;

  if (intervalHours && intervalHours > 0) {
    maxRatio = Math.max(maxRatio, hoursSinceLast / intervalHours);
  }
  if (intervalCycles && intervalCycles > 0) {
    maxRatio = Math.max(maxRatio, cyclesSinceLast / intervalCycles);
  }
  if (intervalMonths && intervalMonths > 0 && dateLastCompleted) {
    const monthsSinceLast =
      (Date.now() - dateLastCompleted.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    maxRatio = Math.max(maxRatio, monthsSinceLast / intervalMonths);
  }
  if (intervalMonths && intervalMonths > 0 && !dateLastCompleted) {
    maxRatio = 1.5;
  }

  if (!intervalHours && !intervalMonths && !intervalCycles) return 'na';
  if (maxRatio >= 1.0) return 'overdue';
  if (maxRatio >= 0.8) return 'due_soon';
  return 'compliant';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { partId, name, description, ruleType, intervalHours, intervalMonths, intervalCycles, reference, category, templateId } = body;

    if (!name || !ruleType || !category || !partId) {
      return NextResponse.json({ error: 'Name, ruleType, category, and partId are required' }, { status: 400 });
    }

    const status = calculateRuleStatus(0, 0, null, intervalHours, intervalMonths, intervalCycles);

    let dueDate: Date | null = null;
    if (intervalMonths) {
      dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + intervalMonths);
    }

    const rule = await db.rule.create({
      data: {
        name,
        description,
        ruleType,
        intervalHours,
        intervalMonths,
        intervalCycles,
        reference,
        category,
        hoursSinceLast: 0,
        cyclesSinceLast: 0,
        dateLastCompleted: null,
        dueDate,
        status,
        partId,
        templateId: templateId || null,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Create rule error:', error);
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }
}

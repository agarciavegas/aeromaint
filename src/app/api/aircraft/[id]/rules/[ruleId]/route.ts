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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    const body = await request.json();
    const { name, description, ruleType, intervalHours, intervalMonths, intervalCycles, reference, category, hoursSinceLast, cyclesSinceLast, dateLastCompleted, status } = body;

    const updated = await db.rule.update({
      where: { id: ruleId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(ruleType !== undefined && { ruleType }),
        ...(intervalHours !== undefined && { intervalHours }),
        ...(intervalMonths !== undefined && { intervalMonths }),
        ...(intervalCycles !== undefined && { intervalCycles }),
        ...(reference !== undefined && { reference }),
        ...(category !== undefined && { category }),
        ...(hoursSinceLast !== undefined && { hoursSinceLast }),
        ...(cyclesSinceLast !== undefined && { cyclesSinceLast }),
        ...(dateLastCompleted !== undefined && { dateLastCompleted: dateLastCompleted ? new Date(dateLastCompleted) : null }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update rule error:', error);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    await db.rule.delete({ where: { id: ruleId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete rule error:', error);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}

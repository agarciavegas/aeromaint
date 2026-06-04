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
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const { status, notes, completedBy } = body;

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (completedBy !== undefined) updateData.completedBy = completedBy;

    // If completing, set completedDate and reset the associated rule
    if (status === 'completed') {
      updateData.completedDate = new Date();
      if (completedBy) updateData.completedBy = completedBy;

      // Get the current item to check for linked rule
      const item = await db.workOrderItem.findUnique({
        where: { id: itemId },
        include: { rule: true },
      });

      if (item?.rule) {
        // Reset the rule: hoursSinceLast = 0, cyclesSinceLast = 0, dateLastCompleted = now, status = compliant
        const now = new Date();
        let dueDate: Date | null = null;
        if (item.rule.intervalMonths) {
          dueDate = new Date(now);
          dueDate.setMonth(dueDate.getMonth() + item.rule.intervalMonths);
        }

        const newStatus = calculateRuleStatus(
          0,
          0,
          now,
          item.rule.intervalHours,
          item.rule.intervalMonths,
          item.rule.intervalCycles
        );

        await db.rule.update({
          where: { id: item.rule.id },
          data: {
            hoursSinceLast: 0,
            cyclesSinceLast: 0,
            dateLastCompleted: now,
            dueDate,
            status: newStatus,
          },
        });
      }
    }

    const updated = await db.workOrderItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update work order item error:', error);
    return NextResponse.json({ error: 'Failed to update work order item' }, { status: 500 });
  }
}

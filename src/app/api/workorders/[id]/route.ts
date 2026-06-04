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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workOrder = await db.workOrder.findUnique({
      where: { id },
      include: {
        aircraft: { include: { model: { select: { name: true } } } },
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            rule: { include: { part: { select: { name: true } } } },
          },
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Get work order error:', error);
    return NextResponse.json({ error: 'Failed to fetch work order' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, status, priority, type, assignedTo, scheduledDate, completedDate } = body;

    const updated = await db.workOrder.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(type !== undefined && { type }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(scheduledDate !== undefined && { scheduledDate: scheduledDate ? new Date(scheduledDate) : null }),
        ...(completedDate !== undefined && { completedDate: completedDate ? new Date(completedDate) : null }),
      },
      include: {
        aircraft: { include: { model: { select: { name: true } } } },
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            rule: { include: { part: { select: { name: true } } } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update work order error:', error);
    return NextResponse.json({ error: 'Failed to update work order' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.workOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete work order error:', error);
    return NextResponse.json({ error: 'Failed to delete work order' }, { status: 500 });
  }
}

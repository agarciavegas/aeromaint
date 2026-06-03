import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { hoursSinceLast, cyclesSinceLast, dateLastCompleted, status, dueDate } = body;

    const updateData: Record<string, unknown> = {};
    if (hoursSinceLast !== undefined) updateData.hoursSinceLast = hoursSinceLast;
    if (cyclesSinceLast !== undefined) updateData.cyclesSinceLast = cyclesSinceLast;
    if (dateLastCompleted !== undefined) updateData.dateLastCompleted = dateLastCompleted ? new Date(dateLastCompleted) : null;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const rule = await db.rule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error updating rule:', error);
    return NextResponse.json({ error: 'Error al actualizar regla' }, { status: 500 });
  }
}

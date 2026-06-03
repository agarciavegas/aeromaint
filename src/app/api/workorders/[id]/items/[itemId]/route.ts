import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    if (status === 'completed') {
      updateData.completedDate = new Date();
      updateData.completedBy = completedBy || 'Sistema';
    }

    // If this item is linked to a rule and is being completed, reset the rule
    if (status === 'completed') {
      const item = await db.workOrderItem.findUnique({
        where: { id: itemId },
        include: { rule: true },
      });
      if (item?.rule) {
        await db.rule.update({
          where: { id: item.rule.id },
          data: {
            hoursSinceLast: 0,
            cyclesSinceLast: 0,
            dateLastCompleted: new Date(),
            status: 'compliant',
          },
        });
      }
    }

    const updated = await db.workOrderItem.update({
      where: { id: itemId },
      data: updateData,
      include: { rule: { include: { part: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating work order item:', error);
    return NextResponse.json({ error: 'Error al actualizar item' }, { status: 500 });
  }
}

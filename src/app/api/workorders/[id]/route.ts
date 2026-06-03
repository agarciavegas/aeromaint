import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wo = await db.workOrder.findUnique({
      where: { id },
      include: {
        aircraft: { include: { model: true } },
        items: { include: { rule: { include: { part: true } } }, orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!wo) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 });
    }

    return NextResponse.json(wo);
  } catch (error) {
    console.error('Error fetching work order:', error);
    return NextResponse.json({ error: 'Error al obtener orden de trabajo' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;

    if (body.status === 'completed') {
      updateData.completedDate = new Date();
    }

    const wo = await db.workOrder.update({
      where: { id },
      data: updateData,
      include: {
        aircraft: { include: { model: true } },
        items: { include: { rule: true } },
      },
    });

    return NextResponse.json(wo);
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json({ error: 'Error al actualizar orden de trabajo' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.workOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting work order:', error);
    return NextResponse.json({ error: 'Error al eliminar orden de trabajo' }, { status: 500 });
  }
}

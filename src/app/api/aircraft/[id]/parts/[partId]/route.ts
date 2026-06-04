import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  try {
    const { partId } = await params;
    const body = await request.json();
    const { name, partNumber, serialNumber, parentId, hoursSinceNew, hoursSinceOvh, cyclesSinceNew, installDate, lastOverhaulDate, status, sortOrder } = body;

    const updated = await db.part.update({
      where: { id: partId },
      data: {
        ...(name !== undefined && { name }),
        ...(partNumber !== undefined && { partNumber }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(hoursSinceNew !== undefined && { hoursSinceNew }),
        ...(hoursSinceOvh !== undefined && { hoursSinceOvh }),
        ...(cyclesSinceNew !== undefined && { cyclesSinceNew }),
        ...(installDate !== undefined && { installDate: installDate ? new Date(installDate) : null }),
        ...(lastOverhaulDate !== undefined && { lastOverhaulDate: lastOverhaulDate ? new Date(lastOverhaulDate) : null }),
        ...(status !== undefined && { status }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update part error:', error);
    return NextResponse.json({ error: 'Failed to update part' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  try {
    const { partId } = await params;
    await db.part.delete({ where: { id: partId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete part error:', error);
    return NextResponse.json({ error: 'Failed to delete part' }, { status: 500 });
  }
}

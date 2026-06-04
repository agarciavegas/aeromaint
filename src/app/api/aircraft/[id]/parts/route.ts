import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, partNumber, serialNumber, parentId, templateId, hoursSinceNew, hoursSinceOvh, cyclesSinceNew, installDate, lastOverhaulDate, status, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const part = await db.part.create({
      data: {
        name,
        partNumber,
        serialNumber,
        parentId: parentId || null,
        aircraftId: id,
        templateId: templateId || null,
        hoursSinceNew: hoursSinceNew ?? 0,
        hoursSinceOvh: hoursSinceOvh ?? 0,
        cyclesSinceNew: cyclesSinceNew ?? 0,
        installDate: installDate ? new Date(installDate) : null,
        lastOverhaulDate: lastOverhaulDate ? new Date(lastOverhaulDate) : null,
        status: status ?? 'serviceable',
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error('Create part error:', error);
    return NextResponse.json({ error: 'Failed to create part' }, { status: 500 });
  }
}

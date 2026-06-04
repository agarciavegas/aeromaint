import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    const body = await request.json();
    const { name, description, ruleType, intervalHours, intervalMonths, intervalCycles, reference, category } = body;

    const updated = await db.ruleTemplate.update({
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
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update rule template error:', error);
    return NextResponse.json({ error: 'Failed to update rule template' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  try {
    const { ruleId } = await params;
    await db.ruleTemplate.delete({ where: { id: ruleId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete rule template error:', error);
    return NextResponse.json({ error: 'Failed to delete rule template' }, { status: 500 });
  }
}

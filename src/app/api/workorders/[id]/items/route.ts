import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { ruleId, description, sortOrder } = body;

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const item = await db.workOrderItem.create({
      data: {
        workOrderId: id,
        ruleId: ruleId || null,
        description,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Create work order item error:', error);
    return NextResponse.json({ error: 'Failed to create work order item' }, { status: 500 });
  }
}

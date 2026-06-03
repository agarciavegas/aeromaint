import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { description, ruleId } = body;

    const existingItems = await db.workOrderItem.count({ where: { workOrderId: id } });

    const item = await db.workOrderItem.create({
      data: {
        workOrderId: id,
        description,
        ruleId: ruleId || null,
        status: 'pending',
        sortOrder: existingItems + 1,
      },
      include: { rule: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error adding work order item:', error);
    return NextResponse.json({ error: 'Error al agregar item' }, { status: 500 });
  }
}

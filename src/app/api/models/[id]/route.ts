import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const model = await db.aircraftModelTemplate.findUnique({
      where: { id },
      include: {
        _count: { select: { aircraft: true } },
        parts: {
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              orderBy: { sortOrder: 'asc' },
              include: {
                children: {
                  orderBy: { sortOrder: 'asc' },
                  include: { rules: { orderBy: { name: 'asc' } } },
                },
                rules: { orderBy: { name: 'asc' } },
              },
            },
            rules: { orderBy: { name: 'asc' } },
          },
        },
      },
    });

    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    return NextResponse.json(model);
  } catch (error) {
    console.error('Get model error:', error);
    return NextResponse.json({ error: 'Failed to fetch model' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, manufacturer, model, engineModel, propModel, description } = body;

    const updated = await db.aircraftModelTemplate.update({
      where: { id },
      data: { name, manufacturer, model, engineModel, propModel, description },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update model error:', error);
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.aircraftModelTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete model error:', error);
    return NextResponse.json({ error: 'Failed to delete model' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const aircraft = await db.aircraft.findUnique({
      where: { id },
      include: {
        model: true,
        parts: {
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              orderBy: { sortOrder: 'asc' },
              include: {
                children: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    rules: { orderBy: { name: 'asc' } },
                    children: {
                      orderBy: { sortOrder: 'asc' },
                      include: { rules: true },
                    },
                  },
                },
                rules: { orderBy: { name: 'asc' } },
              },
            },
            rules: { orderBy: { name: 'asc' } },
          },
        },
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { _count: { select: { items: true } } },
        },
      },
    });

    if (!aircraft) {
      return NextResponse.json({ error: 'Aircraft not found' }, { status: 404 });
    }

    return NextResponse.json(aircraft);
  } catch (error) {
    console.error('Get aircraft error:', error);
    return NextResponse.json({ error: 'Failed to fetch aircraft' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { registration, serialNumber, modelId, year, description, status } = body;

    const updated = await db.aircraft.update({
      where: { id },
      data: {
        ...(registration !== undefined && { registration }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(modelId !== undefined && { modelId }),
        ...(year !== undefined && { year }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update aircraft error:', error);
    return NextResponse.json({ error: 'Failed to update aircraft' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.aircraft.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete aircraft error:', error);
    return NextResponse.json({ error: 'Failed to delete aircraft' }, { status: 500 });
  }
}

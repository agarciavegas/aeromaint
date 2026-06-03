import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const aircraft = await db.aircraft.findUnique({
      where: { id },
      include: {
        model: true,
        parts: {
          include: {
            rules: true,
            children: {
              include: {
                rules: true,
                children: {
                  include: {
                    rules: true,
                    children: {
                      include: {
                        rules: true,
                      },
                    },
                  },
                },
              },
            },
          },
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
        },
        workOrders: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!aircraft) {
      return NextResponse.json({ error: 'Aeronave no encontrada' }, { status: 404 });
    }

    return NextResponse.json(aircraft);
  } catch (error) {
    console.error('Error fetching aircraft:', error);
    return NextResponse.json({ error: 'Error al obtener aeronave' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const aircraft = await db.aircraft.update({
      where: { id },
      data: body,
      include: { model: true },
    });

    return NextResponse.json(aircraft);
  } catch (error) {
    console.error('Error updating aircraft:', error);
    return NextResponse.json({ error: 'Error al actualizar aeronave' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.aircraft.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting aircraft:', error);
    return NextResponse.json({ error: 'Error al eliminar aeronave' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const model = await db.aircraftModelTemplate.findUnique({
      where: { id },
      include: {
        parts: {
          include: {
            rules: true,
            children: {
              include: {
                rules: true,
                children: {
                  include: { rules: true },
                },
              },
            },
          },
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!model) {
      return NextResponse.json({ error: 'Modelo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(model);
  } catch (error) {
    console.error('Error fetching model:', error);
    return NextResponse.json({ error: 'Error al obtener modelo' }, { status: 500 });
  }
}

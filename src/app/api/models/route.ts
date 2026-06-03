import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const models = await db.aircraftModelTemplate.findMany({
      include: {
        parts: {
          include: { rules: true, children: { include: { rules: true } } },
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { aircraft: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Error al obtener modelos' }, { status: 500 });
  }
}

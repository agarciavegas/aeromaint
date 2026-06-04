import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const models = await db.aircraftModelTemplate.findMany({
      orderBy: { name: 'asc' },
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
    return NextResponse.json(models);
  } catch (error) {
    console.error('Models list error:', error);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, manufacturer, model, engineModel, propModel, description } = body;

    if (!name || !manufacturer || !model) {
      return NextResponse.json({ error: 'Name, manufacturer, and model are required' }, { status: 400 });
    }

    const newModel = await db.aircraftModelTemplate.create({
      data: { name, manufacturer, model, engineModel, propModel, description },
    });

    return NextResponse.json(newModel, { status: 201 });
  } catch (error) {
    console.error('Create model error:', error);
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 });
  }
}

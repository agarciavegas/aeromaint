import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const aircraft = await db.aircraft.findMany({
      orderBy: { registration: 'asc' },
      include: {
        model: {
          select: { name: true, manufacturer: true, engineModel: true },
        },
        parts: {
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              orderBy: { sortOrder: 'asc' },
              include: {
                children: {
                  orderBy: { sortOrder: 'asc' },
                  include: { rules: true },
                },
                rules: true,
              },
            },
            rules: true,
          },
        },
        _count: { select: { workOrders: true } },
      },
    });
    return NextResponse.json(aircraft);
  } catch (error) {
    console.error('Aircraft list error:', error);
    return NextResponse.json({ error: 'Failed to fetch aircraft' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { registration, serialNumber, modelId, totalHours, totalCycles, year, description, status } = body;

    if (!registration || !modelId) {
      return NextResponse.json({ error: 'Registration and modelId are required' }, { status: 400 });
    }

    // Check unique registration
    const existing = await db.aircraft.findUnique({ where: { registration } });
    if (existing) {
      return NextResponse.json({ error: 'Registration already exists' }, { status: 400 });
    }

    const aircraft = await db.aircraft.create({
      data: {
        registration,
        serialNumber,
        modelId,
        totalHours: totalHours ?? 0,
        totalCycles: totalCycles ?? 0,
        year,
        description,
        status: status ?? 'active',
      },
    });

    return NextResponse.json(aircraft, { status: 201 });
  } catch (error) {
    console.error('Create aircraft error:', error);
    return NextResponse.json({ error: 'Failed to create aircraft' }, { status: 500 });
  }
}

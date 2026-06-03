import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const aircraft = await db.aircraft.findMany({
      include: {
        model: true,
        parts: {
          include: { rules: true },
        },
        workOrders: { where: { status: { in: ['open', 'in_progress'] } } },
      },
      orderBy: { registration: 'asc' },
    });
    return NextResponse.json(aircraft);
  } catch (error) {
    console.error('Error fetching aircraft:', error);
    return NextResponse.json({ error: 'Error al obtener aeronaves' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { registration, serialNumber, modelId, totalHours, totalCycles, year, description, status } = body;

    const existing = await db.aircraft.findUnique({ where: { registration } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una aeronave con esa matrícula' }, { status: 400 });
    }

    const aircraft = await db.aircraft.create({
      data: {
        registration,
        serialNumber: serialNumber || null,
        modelId,
        totalHours: totalHours || 0,
        totalCycles: totalCycles || 0,
        year: year || null,
        description: description || null,
        status: status || 'active',
      },
      include: { model: true },
    });

    return NextResponse.json(aircraft, { status: 201 });
  } catch (error) {
    console.error('Error creating aircraft:', error);
    return NextResponse.json({ error: 'Error al crear aeronave' }, { status: 500 });
  }
}

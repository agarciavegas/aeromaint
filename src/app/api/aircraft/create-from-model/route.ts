import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modelId, registration, serialNumber, totalHours, totalCycles, year } = body;

    const existing = await db.aircraft.findUnique({ where: { registration } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una aeronave con esa matrícula' }, { status: 400 });
    }

    const model = await db.aircraftModelTemplate.findUnique({
      where: { id: modelId },
      include: {
        parts: {
          include: { rules: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!model) {
      return NextResponse.json({ error: 'Modelo no encontrado' }, { status: 404 });
    }

    const hours = totalHours || 0;
    const cycles = totalCycles || 0;

    // Create aircraft
    const aircraft = await db.aircraft.create({
      data: {
        registration,
        serialNumber: serialNumber || null,
        modelId,
        totalHours: hours,
        totalCycles: cycles,
        year: year || null,
        status: 'active',
      },
    });

    // Clone all parts and rules from template
    const templateIdToPartId: Record<string, string> = {};

    // First pass: create top-level parts (no parent)
    const topLevelTemplates = model.parts.filter(p => !p.parentId);
    for (const pt of topLevelTemplates) {
      const part = await db.part.create({
        data: {
          name: pt.name,
          aircraftId: aircraft.id,
          templateId: pt.id,
          hoursSinceNew: hours,
          hoursSinceOvh: 0,
          cyclesSinceNew: cycles,
          status: 'serviceable',
          sortOrder: pt.sortOrder,
        },
      });
      templateIdToPartId[pt.id] = part.id;

      // Create rules for this part
      for (const rt of pt.rules) {
        await db.rule.create({
          data: {
            name: rt.name,
            description: rt.description,
            ruleType: rt.ruleType,
            intervalHours: rt.intervalHours,
            intervalMonths: rt.intervalMonths,
            intervalCycles: rt.intervalCycles,
            reference: rt.reference,
            category: rt.category,
            hoursSinceLast: 0,
            cyclesSinceLast: 0,
            dateLastCompleted: new Date(),
            status: 'compliant',
            partId: part.id,
            templateId: rt.id,
          },
        });
      }
    }

    // Second pass: create child parts
    const childTemplates = model.parts.filter(p => p.parentId);
    for (const pt of childTemplates) {
      const part = await db.part.create({
        data: {
          name: pt.name,
          parentId: templateIdToPartId[pt.parentId!] || null,
          aircraftId: aircraft.id,
          templateId: pt.id,
          hoursSinceNew: hours,
          hoursSinceOvh: 0,
          cyclesSinceNew: cycles,
          status: 'serviceable',
          sortOrder: pt.sortOrder,
        },
      });
      templateIdToPartId[pt.id] = part.id;

      for (const rt of pt.rules) {
        await db.rule.create({
          data: {
            name: rt.name,
            description: rt.description,
            ruleType: rt.ruleType,
            intervalHours: rt.intervalHours,
            intervalMonths: rt.intervalMonths,
            intervalCycles: rt.intervalCycles,
            reference: rt.reference,
            category: rt.category,
            hoursSinceLast: 0,
            cyclesSinceLast: 0,
            dateLastCompleted: new Date(),
            status: 'compliant',
            partId: part.id,
            templateId: rt.id,
          },
        });
      }
    }

    const result = await db.aircraft.findUnique({
      where: { id: aircraft.id },
      include: { model: true },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating aircraft from model:', error);
    return NextResponse.json({ error: 'Error al crear aeronave desde modelo' }, { status: 500 });
  }
}

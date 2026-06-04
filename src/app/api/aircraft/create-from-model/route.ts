import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function calculateRuleStatus(
  hoursSinceLast: number,
  cyclesSinceLast: number,
  dateLastCompleted: Date | null,
  intervalHours: number | null,
  intervalMonths: number | null,
  intervalCycles: number | null
): string {
  let maxRatio = 0;

  if (intervalHours && intervalHours > 0) {
    maxRatio = Math.max(maxRatio, hoursSinceLast / intervalHours);
  }
  if (intervalCycles && intervalCycles > 0) {
    maxRatio = Math.max(maxRatio, cyclesSinceLast / intervalCycles);
  }
  if (intervalMonths && intervalMonths > 0 && dateLastCompleted) {
    const monthsSinceLast =
      (Date.now() - dateLastCompleted.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    maxRatio = Math.max(maxRatio, monthsSinceLast / intervalMonths);
  }
  if (intervalMonths && intervalMonths > 0 && !dateLastCompleted) {
    maxRatio = 1.5;
  }

  if (!intervalHours && !intervalMonths && !intervalCycles) return 'na';
  if (maxRatio >= 1.0) return 'overdue';
  if (maxRatio >= 0.8) return 'due_soon';
  return 'compliant';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modelId, registration, serialNumber, totalHours, totalCycles, year, description } = body;

    if (!modelId || !registration) {
      return NextResponse.json({ error: 'modelId and registration are required' }, { status: 400 });
    }

    // Check unique registration
    const existing = await db.aircraft.findUnique({ where: { registration } });
    if (existing) {
      return NextResponse.json({ error: 'Registration already exists' }, { status: 400 });
    }

    // Get template with all parts and rules
    const template = await db.aircraftModelTemplate.findUnique({
      where: { id: modelId },
      include: {
        parts: {
          orderBy: { sortOrder: 'asc' },
          include: { rules: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Model template not found' }, { status: 404 });
    }

    const hrs = totalHours ?? 0;
    const cyc = totalCycles ?? 0;

    // Create aircraft
    const aircraft = await db.aircraft.create({
      data: {
        registration,
        serialNumber,
        modelId,
        totalHours: hrs,
        totalCycles: cyc,
        year,
        description,
        status: 'active',
      },
    });

    // Clone parts from template (handle hierarchy)
    const templateIdToPartId: Record<string, string> = {};

    // First pass: create top-level parts (no parent)
    const rootParts = template.parts.filter(p => !p.parentId);
    for (const pt of rootParts) {
      const part = await db.part.create({
        data: {
          name: pt.name,
          partNumber: pt.partNumber,
          aircraftId: aircraft.id,
          templateId: pt.id,
          hoursSinceNew: hrs,
          hoursSinceOvh: 0,
          cyclesSinceNew: cyc,
          status: 'serviceable',
          sortOrder: pt.sortOrder,
        },
      });
      templateIdToPartId[pt.id] = part.id;
    }

    // Second pass: create child parts
    const childParts = template.parts.filter(p => p.parentId);
    let maxIterations = 10;
    while (childParts.length > 0 && maxIterations > 0) {
      for (let i = childParts.length - 1; i >= 0; i--) {
        const pt = childParts[i];
        if (pt.parentId && templateIdToPartId[pt.parentId]) {
          const part = await db.part.create({
            data: {
              name: pt.name,
              partNumber: pt.partNumber,
              parentId: templateIdToPartId[pt.parentId],
              aircraftId: aircraft.id,
              templateId: pt.id,
              hoursSinceNew: hrs,
              hoursSinceOvh: 0,
              cyclesSinceNew: cyc,
              status: 'serviceable',
              sortOrder: pt.sortOrder,
            },
          });
          templateIdToPartId[pt.id] = part.id;
          childParts.splice(i, 1);
        }
      }
      maxIterations--;
    }

    // Clone rules for each part
    for (const pt of template.parts) {
      const partId = templateIdToPartId[pt.id];
      if (!partId) continue;

      for (const rt of pt.rules) {
        const status = calculateRuleStatus(0, 0, null, rt.intervalHours, rt.intervalMonths, rt.intervalCycles);

        let dueDate: Date | null = null;
        if (rt.intervalMonths) {
          dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + rt.intervalMonths);
        }

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
            dateLastCompleted: null,
            dueDate,
            status,
            partId,
            templateId: rt.id,
          },
        });
      }
    }

    // Return the created aircraft with full details
    const result = await db.aircraft.findUnique({
      where: { id: aircraft.id },
      include: {
        model: true,
        parts: {
          where: { parentId: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              orderBy: { sortOrder: 'asc' },
              include: {
                rules: true,
                children: { include: { rules: true } },
              },
            },
            rules: true,
          },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Create aircraft from model error:', error);
    return NextResponse.json({ error: 'Failed to create aircraft from model' }, { status: 500 });
  }
}

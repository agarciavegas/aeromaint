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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { totalHours, totalCycles } = body;

    if (totalHours === undefined || totalCycles === undefined) {
      return NextResponse.json({ error: 'totalHours and totalCycles are required' }, { status: 400 });
    }

    const aircraft = await db.aircraft.findUnique({ where: { id } });
    if (!aircraft) {
      return NextResponse.json({ error: 'Aircraft not found' }, { status: 404 });
    }

    const hoursDiff = totalHours - aircraft.totalHours;
    const cyclesDiff = totalCycles - aircraft.totalCycles;

    if (hoursDiff < 0 || cyclesDiff < 0) {
      return NextResponse.json({ error: 'New values cannot be less than current' }, { status: 400 });
    }

    // Update aircraft hours/cycles
    await db.aircraft.update({
      where: { id },
      data: { totalHours, totalCycles },
    });

    // Get all parts and rules for this aircraft
    const parts = await db.part.findMany({
      where: { aircraftId: id },
      include: { rules: true },
    });

    // Update all parts
    for (const part of parts) {
      await db.part.update({
        where: { id: part.id },
        data: {
          hoursSinceNew: part.hoursSinceNew + hoursDiff,
          hoursSinceOvh: part.hoursSinceOvh + hoursDiff,
          cyclesSinceNew: part.cyclesSinceNew + cyclesDiff,
        },
      });

      // Update all rules for this part
      for (const rule of part.rules) {
        const newHoursSinceLast = rule.hoursSinceLast + hoursDiff;
        const newCyclesSinceLast = rule.cyclesSinceLast + cyclesDiff;

        const newStatus = calculateRuleStatus(
          newHoursSinceLast,
          newCyclesSinceLast,
          rule.dateLastCompleted,
          rule.intervalHours,
          rule.intervalMonths,
          rule.intervalCycles
        );

        await db.rule.update({
          where: { id: rule.id },
          data: {
            hoursSinceLast: newHoursSinceLast,
            cyclesSinceLast: newCyclesSinceLast,
            status: newStatus,
          },
        });
      }
    }

    return NextResponse.json({ success: true, hoursDiff, cyclesDiff });
  } catch (error) {
    console.error('Update hours error:', error);
    return NextResponse.json({ error: 'Failed to update hours' }, { status: 500 });
  }
}

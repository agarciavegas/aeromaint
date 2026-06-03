import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { totalHours, totalCycles } = body;

    const aircraft = await db.aircraft.findUnique({ where: { id } });
    if (!aircraft) {
      return NextResponse.json({ error: 'Aeronave no encontrada' }, { status: 404 });
    }

    const hoursDiff = (totalHours || 0) - aircraft.totalHours;
    const cyclesDiff = (totalCycles || 0) - aircraft.totalCycles;

    // Update aircraft
    await db.aircraft.update({
      where: { id },
      data: {
        totalHours: totalHours ?? aircraft.totalHours,
        totalCycles: totalCycles ?? aircraft.totalCycles,
      },
    });

    // Update all parts hours/cycles
    const parts = await db.part.findMany({ where: { aircraftId: id } });
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
      const rules = await db.rule.findMany({ where: { partId: part.id } });
      for (const rule of rules) {
        const newHoursSinceLast = rule.hoursSinceLast + hoursDiff;
        const newCyclesSinceLast = rule.cyclesSinceLast + cyclesDiff;

        // Recalculate status
        let newStatus = rule.status;
        if (rule.status !== 'na') {
          const hoursRatio = rule.intervalHours ? newHoursSinceLast / rule.intervalHours : 0;
          const cyclesRatio = rule.intervalCycles ? newCyclesSinceLast / rule.intervalCycles : 0;
          const maxRatio = Math.max(hoursRatio, cyclesRatio);

          if (maxRatio >= 1) {
            newStatus = 'overdue';
          } else if (maxRatio >= 0.8) {
            newStatus = 'due_soon';
          } else {
            newStatus = 'compliant';
          }
        }

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating aircraft hours:', error);
    return NextResponse.json({ error: 'Error al actualizar horas de aeronave' }, { status: 500 });
  }
}

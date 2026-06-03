import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const totalAircraft = await db.aircraft.count();
    const activeWorkOrders = await db.workOrder.count({
      where: { status: { in: ['open', 'in_progress'] } },
    });
    const overdueRules = await db.rule.count({ where: { status: 'overdue' } });
    const dueSoonRules = await db.rule.count({ where: { status: 'due_soon' } });
    const compliantRules = await db.rule.count({ where: { status: 'compliant' } });
    const naRules = await db.rule.count({ where: { status: 'na' } });

    const recentWorkOrders = await db.workOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        aircraft: { include: { model: true } },
        items: true,
      },
    });

    return NextResponse.json({
      totalAircraft,
      activeWorkOrders,
      overdueRules,
      dueSoonRules,
      compliantRules,
      naRules,
      recentWorkOrders,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}

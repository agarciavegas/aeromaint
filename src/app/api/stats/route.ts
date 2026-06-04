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
      include: { aircraft: { select: { registration: true } } },
    });

    const overdueRulesList = await db.rule.findMany({
      where: { status: 'overdue' },
      take: 10,
      include: {
        part: {
          select: { name: true, aircraft: { select: { registration: true } } },
        },
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
      overdueRulesList,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

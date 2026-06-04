import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const workOrders = await db.workOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        aircraft: { select: { registration: true, model: { select: { name: true } } } },
        _count: { select: { items: true } },
      },
    });
    return NextResponse.json(workOrders);
  } catch (error) {
    console.error('Work orders list error:', error);
    return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { number, title, description, aircraftId, priority, type, assignedTo, scheduledDate, ruleIds, manualItems } = body;

    if (!title || !aircraftId) {
      return NextResponse.json({ error: 'Title and aircraftId are required' }, { status: 400 });
    }

    // Generate WO number if not provided
    const woNumber = number || `WO-${new Date().getFullYear()}-${String(await db.workOrder.count() + 1).padStart(3, '0')}`;

    // Check unique number
    const existing = await db.workOrder.findUnique({ where: { number: woNumber } });
    if (existing) {
      return NextResponse.json({ error: 'Work order number already exists' }, { status: 400 });
    }

    const workOrder = await db.workOrder.create({
      data: {
        number: woNumber,
        title,
        description,
        aircraftId,
        priority: priority ?? 'normal',
        type: type ?? 'scheduled',
        assignedTo,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      },
    });

    // Add items from rules
    if (ruleIds && ruleIds.length > 0) {
      for (let i = 0; i < ruleIds.length; i++) {
        const rule = await db.rule.findUnique({
          where: { id: ruleIds[i] },
          include: { part: { select: { name: true } } },
        });
        if (rule) {
          await db.workOrderItem.create({
            data: {
              workOrderId: workOrder.id,
              ruleId: rule.id,
              description: `${rule.name} — ${rule.part.name}`,
              sortOrder: i,
            },
          });
        }
      }
    }

    // Add manual items
    if (manualItems && manualItems.length > 0) {
      const startOrder = (ruleIds?.length || 0);
      for (let i = 0; i < manualItems.length; i++) {
        if (manualItems[i].trim()) {
          await db.workOrderItem.create({
            data: {
              workOrderId: workOrder.id,
              description: manualItems[i].trim(),
              sortOrder: startOrder + i,
            },
          });
        }
      }
    }

    const result = await db.workOrder.findUnique({
      where: { id: workOrder.id },
      include: {
        aircraft: true,
        items: { include: { rule: { include: { part: { select: { name: true } } } } }, orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Create work order error:', error);
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
  }
}

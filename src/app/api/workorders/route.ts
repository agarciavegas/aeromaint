import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const workOrders = await db.workOrder.findMany({
      include: {
        aircraft: { include: { model: true } },
        items: { include: { rule: true }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(workOrders);
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json({ error: 'Error al obtener órdenes de trabajo' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, aircraftId, priority, type, assignedTo, scheduledDate, ruleIds, manualItems } = body;

    // Generate work order number
    const count = await db.workOrder.count();
    const number = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const wo = await db.workOrder.create({
      data: {
        number,
        title,
        description: description || null,
        aircraftId,
        priority: priority || 'normal',
        type: type || 'scheduled',
        assignedTo: assignedTo || null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      },
    });

    // Add items from rules
    if (ruleIds && ruleIds.length > 0) {
      for (let i = 0; i < ruleIds.length; i++) {
        const rule = await db.rule.findUnique({
          where: { id: ruleIds[i] },
          include: { part: true },
        });
        if (rule) {
          await db.workOrderItem.create({
            data: {
              workOrderId: wo.id,
              ruleId: rule.id,
              description: `${rule.name} - ${rule.part.name}`,
              status: 'pending',
              sortOrder: i + 1,
            },
          });
        }
      }
    }

    // Add manual items
    if (manualItems && manualItems.length > 0) {
      const offset = (ruleIds?.length || 0) + 1;
      for (let i = 0; i < manualItems.length; i++) {
        await db.workOrderItem.create({
          data: {
            workOrderId: wo.id,
            description: manualItems[i],
            status: 'pending',
            sortOrder: offset + i,
          },
        });
      }
    }

    const result = await db.workOrder.findUnique({
      where: { id: wo.id },
      include: {
        aircraft: { include: { model: true } },
        items: { include: { rule: true } },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json({ error: 'Error al crear orden de trabajo' }, { status: 500 });
  }
}

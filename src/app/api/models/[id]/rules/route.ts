import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { partTemplateId, name, description, ruleType, intervalHours, intervalMonths, intervalCycles, reference, category } = body;

    if (!name || !ruleType || !category) {
      return NextResponse.json({ error: 'Name, ruleType, and category are required' }, { status: 400 });
    }

    if (!partTemplateId) {
      return NextResponse.json({ error: 'partTemplateId is required' }, { status: 400 });
    }

    // Verify the part template belongs to this model
    const partTemplate = await db.partTemplate.findFirst({
      where: { id: partTemplateId, modelId: id },
    });

    if (!partTemplate) {
      return NextResponse.json({ error: 'Part template not found in this model' }, { status: 404 });
    }

    const rule = await db.ruleTemplate.create({
      data: {
        name,
        description,
        ruleType,
        intervalHours,
        intervalMonths,
        intervalCycles,
        reference,
        category,
        partTemplateId,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Create rule template error:', error);
    return NextResponse.json({ error: 'Failed to create rule template' }, { status: 500 });
  }
}

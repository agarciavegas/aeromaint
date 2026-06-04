import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, partNumber, ataChapter, description, parentId, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const part = await db.partTemplate.create({
      data: {
        name,
        partNumber,
        ataChapter,
        description,
        parentId: parentId || null,
        modelId: id,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error('Create part template error:', error);
    return NextResponse.json({ error: 'Failed to create part template' }, { status: 500 });
  }
}

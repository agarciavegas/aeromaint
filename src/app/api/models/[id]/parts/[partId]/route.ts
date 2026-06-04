import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  try {
    const { partId } = await params;
    const body = await request.json();
    const { name, partNumber, ataChapter, description, parentId, sortOrder } = body;

    const updated = await db.partTemplate.update({
      where: { id: partId },
      data: {
        ...(name !== undefined && { name }),
        ...(partNumber !== undefined && { partNumber }),
        ...(ataChapter !== undefined && { ataChapter }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update part template error:', error);
    return NextResponse.json({ error: 'Failed to update part template' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; partId: string }> }
) {
  try {
    const { partId } = await params;
    await db.partTemplate.delete({ where: { id: partId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete part template error:', error);
    return NextResponse.json({ error: 'Failed to delete part template' }, { status: 500 });
  }
}

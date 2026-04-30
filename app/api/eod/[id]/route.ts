import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { EodEntry } from '@/models/EodEntry';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    await EodEntry.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete EOD entry' }, { status: 500 });
  }
}

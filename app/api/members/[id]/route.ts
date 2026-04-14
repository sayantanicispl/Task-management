import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Member } from '@/models/Member';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    await Member.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (body.clientIds !== undefined) update.clientIds = body.clientIds;
    if (body.photo !== undefined) update.photo = body.photo;
    const member = await Member.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    return NextResponse.json(member);
  } catch {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

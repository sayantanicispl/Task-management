import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Client } from '@/models/Client';
import { Member } from '@/models/Member';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();
    const fields: Record<string, string> = {};
    if (body.plan !== undefined) fields.plan = body.plan ?? '';
    if (body.name !== undefined) fields.name = body.name.trim();
    const updated = await Client.findByIdAndUpdate(
      id,
      { $set: fields },
      { new: true }
    ).lean();
    if (!updated) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    await Promise.all([
      Client.findByIdAndDelete(id),
      Member.updateMany({ clientIds: id }, { $pull: { clientIds: id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}

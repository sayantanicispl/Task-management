import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Member } from '@/models/Member';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const member = await Member.findById(id).lean();
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    return NextResponse.json(member);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 });
  }
}

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
    const allowed = ['clientIds', 'photo', 'name', 'role', 'email', 'contact', 'experience', 'telegram', 'skills'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    const member = await Member.findByIdAndUpdate(id, { $set: update }, { new: true, strict: false }).lean();
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    return NextResponse.json(member);
  } catch {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

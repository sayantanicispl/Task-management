import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Member } from '@/models/Member';

export async function GET() {
  try {
    await dbConnect();
    const members = await Member.find({}).sort({ createdAt: 1 }).lean();
    return NextResponse.json(members);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { name, role } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const member = await Member.create({
      name: name.trim(),
      role: role?.trim() ?? '',
    });
    return NextResponse.json(member, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}

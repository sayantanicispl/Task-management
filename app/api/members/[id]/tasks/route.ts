import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Member } from '@/models/Member';
import { Task } from '@/models/Task';
import { Client } from '@/models/Client';

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

    const clientIds = (member as { clientIds?: unknown[] }).clientIds ?? [];

    const [tasks, clients] = await Promise.all([
      Task.find({ clientId: { $in: clientIds } }).sort({ createdAt: -1 }).lean(),
      Client.find({ _id: { $in: clientIds } }).lean(),
    ]);

    const clientMap = new Map(
  clients.map((c: any) => [String(c._id), c.name])
);

    const result = tasks.map((t: any) => ({
      _id: t._id,
      name: t.name,
      status: t.status ?? '',
      timeSpent: t.timeSpent ?? 0,
      done: t.done ?? false,
      clientId: t.clientId ? String(t.clientId) : null,
clientName: t.clientId ? (clientMap.get(String(t.clientId)) ?? null) : null,
      createdAt: (t as { createdAt?: Date }).createdAt?.toISOString() ?? new Date().toISOString(),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Task } from '@/models/Task';
import { Client } from '@/models/Client';
import { EodEntry } from '@/models/EodEntry';

export async function GET() {
  try {
    await dbConnect();
    const tasks = await Task.find({}).sort({ createdAt: 1 }).lean();
    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { name, clientId } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const duplicate = await Task.findOne({
      name: { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      clientId: clientId || null,
    }).lean();
    if (duplicate) {
      return NextResponse.json({ error: 'A task with this name already exists for this client' }, { status: 409 });
    }

    const task = await Task.create({ name: name.trim(), clientId: clientId || null });

    // Resolve client name for EOD
    let clientName = '';
    if (clientId) {
      const client = await Client.findById(clientId).lean() as any;
      clientName = client?.name ?? '';
    }

    // Create EOD entry (append-only — never deleted even if task is deleted)
    await EodEntry.create({
      taskId:     task._id,
      taskName:   task.name,
      clientId:   clientId || null,
      clientName,
      date:       task.createdAt,
      timeSpent:  0,
      status:     '',
    });

    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

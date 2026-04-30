import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Task } from '@/models/Task';
import { EodEntry } from '@/models/EodEntry';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    await Task.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
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
    // Explicit $set ensures Mongoose strict mode never silently drops fields
    const task = await Task.findByIdAndUpdate(id, { $set: body }, { new: true, strict: false }).lean() as any;
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Keep EOD entry in sync (upsert — preserves history even if task is later deleted)
    const eodUpdate: Record<string, unknown> = { taskName: task.name };
    if (body.timeSpent !== undefined) eodUpdate.timeSpent = task.timeSpent;
    if (body.status    !== undefined) eodUpdate.status    = task.status;
    await EodEntry.findOneAndUpdate(
      { taskId: id },
      { $set: eodUpdate },
      { upsert: false }
    );

    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

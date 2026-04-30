import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { EodEntry } from '@/models/EodEntry';
import { Task } from '@/models/Task';
import { Client } from '@/models/Client';

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const month    = searchParams.get('month');
    const year     = searchParams.get('year');

    // ── Deduplicate synced entries only (skip manual entries) ──
    const dupes = await EodEntry.aggregate([
      { $match: { isManual: { $ne: true } } },
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: { taskName: '$taskName', clientId: { $ifNull: ['$clientId', null] } },
          keepId: { $first: '$_id' },
          allIds: { $push: '$_id' },
          count:  { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);
    if (dupes.length > 0) {
      const toDelete: unknown[] = [];
      for (const d of dupes) {
        const keepStr = String(d.keepId);
        toDelete.push(...d.allIds.filter((id: any) => String(id) !== keepStr));
      }
      if (toDelete.length > 0) {
        await EodEntry.deleteMany({ _id: { $in: toDelete } });
      }
    }

    // ── Lazy backfill: upsert EodEntry for every task that isn't tracked yet ──
    const allTasks = await Task.collection.find({}).toArray();
    if (allTasks.length > 0) {
      const cIds = [...new Set(allTasks.map(t => t.clientId).filter(Boolean))];
      const clients = await Client.find({ _id: { $in: cIds } }).lean() as any[];
      const cMap = new Map(clients.map(c => [String(c._id), c.name as string]));

      await EodEntry.bulkWrite(
        allTasks.map(t => ({
          updateOne: {
            filter: { taskId: t._id },
            update: {
              $setOnInsert: {
                taskId:     t._id,
                taskName:   t.name,
                clientId:   t.clientId ?? null,
                clientName: t.clientId ? (cMap.get(String(t.clientId)) ?? '') : '',
                date:       t.createdAt ?? new Date(),
                timeSpent:  t.timeSpent ?? 0,
                status:     t.status ?? '',
                isManual:   false,
              },
            },
            upsert: true,
          },
        })),
        { ordered: false }
      );
    }

    // ── Build filter and return ──
    const filter: Record<string, unknown> = {};
    if (clientId && clientId !== 'all') filter.clientId = clientId;
    if (month && year) {
      const m = parseInt(month) - 1, y = parseInt(year);
      filter.date = { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) };
    } else if (year) {
      const y = parseInt(year);
      filter.date = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
    }

    const entries = await EodEntry.find(filter).sort({ date: -1 }).lean();
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch EOD entries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { taskName, clientId, clientName, date, timeSpent, status } = await request.json();

    if (!taskName?.trim()) {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 });
    }

    // Use noon UTC to avoid display shifting across timezones
    const dateObj = date ? new Date(`${date}T12:00:00.000Z`) : new Date();

    const entry = await EodEntry.create({
      taskId:     new Types.ObjectId(),  // unique ID — manual entries aren't linked to any Task
      taskName:   taskName.trim(),
      clientId:   clientId || null,
      clientName: clientName || '',
      date:       dateObj,
      timeSpent:  parseFloat(timeSpent) || 0,
      status:     status || '',
      isManual:   true,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to create EOD entry' }, { status: 500 });
  }
}

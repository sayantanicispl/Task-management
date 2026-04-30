import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Member } from '@/models/Member';
import { Task } from '@/models/Task';
import { Client } from '@/models/Client';

const STATUS_EMOJI: Record<string, string> = {
  'Completed':             '✅',
  'In Progress':           '🔄',
  'Hold':                  '⏸',
  'Partially Update Sent': '📤',
  'In the Queue':          '🔶',
  'Update Sent':           '📨',
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const member = await Member.findById(id).lean() as any;
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (!member.telegramChatId) return NextResponse.json({ error: 'No Telegram Chat ID set for this member' }, { status: 400 });

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });

    const tasks = await Task.collection.find({ assignedTo: id }).sort({ createdAt: -1 }).toArray();
    const clientIds = [...new Set(tasks.map((t: any) => t.clientId).filter(Boolean))];
    const clients = await Client.find({ _id: { $in: clientIds } }).lean();

    const clientMap = new Map((clients as any[]).map(c => [String(c._id), c.name]));
    const teamName = process.env.NEXT_PUBLIC_TEAM_NAME ?? "Sayantani's Team";
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    const completed = (tasks as any[]).filter(t => t.status === 'Completed').length;
    const inProgress = (tasks as any[]).filter(t => t.status === 'In Progress').length;

    const taskLines = (tasks as any[]).map(t => {
      const emoji = STATUS_EMOJI[t.status] ?? '⬜';
      const client = t.clientId ? (clientMap.get(String(t.clientId)) ?? '') : '';
      const time = t.timeSpent ? ` · ${t.timeSpent}hr` : '';
      const clientStr = client ? ` <i>${client}</i>` : '';
      return `${emoji} ${t.name}${clientStr}${time}`;
    }).join('\n');

    const message = [
      `<b>${teamName}</b>`,
      `📋 <b>Task List — ${today}</b>`,
      ``,
      `Hi <b>${member.name}</b>, here are your current tasks:`,
      ``,
      tasks.length > 0 ? taskLines : 'No tasks assigned currently.',
      ``,
      `<b>Total:</b> ${tasks.length}  ·  <b>Completed:</b> ${completed}  ·  <b>In Progress:</b> ${inProgress}`,
    ].join('\n');

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: member.telegramChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const result = await res.json();
    if (!result.ok) {
      return NextResponse.json({ error: result.description ?? 'Telegram API error' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to send Telegram message' }, { status: 500 });
  }
}

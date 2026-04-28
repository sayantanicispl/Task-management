import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import dbConnect from '@/lib/mongodb';
import { Member } from '@/models/Member';
import { Task } from '@/models/Task';
import { Client } from '@/models/Client';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const STATUS_EMOJI: Record<string, string> = {
  'Completed':             '✅',
  'In Progress':           '🔄',
  'Hold':                  '⏸️',
  'Partially Update Sent': '📤',
  'In the Queue':          '🔶',
  'Update Sent':           '📨',
};

const STATUS_COLOR: Record<string, string> = {
  'Completed':             '#27500A',
  'In Progress':           '#0C447C',
  'Hold':                  '#633806',
  'Partially Update Sent': '#3C3489',
  'In the Queue':          '#712B13',
  'Update Sent':           '#085041',
};

const STATUS_BG: Record<string, string> = {
  'Completed':             '#EAF3DE',
  'In Progress':           '#E6F1FB',
  'Hold':                  '#FAEEDA',
  'Partially Update Sent': '#EEEDFE',
  'In the Queue':          '#FAECE7',
  'Update Sent':           '#E1F5EE',
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
    if (!member.email) return NextResponse.json({ error: 'Member has no email address set' }, { status: 400 });

    const clientIds = member.clientIds ?? [];
    const [tasks, clients] = await Promise.all([
      Task.find({ clientId: { $in: clientIds } }).sort({ createdAt: -1 }).lean(),
      Client.find({ _id: { $in: clientIds } }).lean(),
    ]);

    const clientMap = new Map((clients as any[]).map(c => [String(c._id), c.name]));
    const teamName = process.env.NEXT_PUBLIC_TEAM_NAME ?? "Sayantani's Team";
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    const taskRows = (tasks as any[]).map(t => {
      const status = t.status || '';
      const clientName = t.clientId ? (clientMap.get(String(t.clientId)) ?? '') : '';
      const emoji = STATUS_EMOJI[status] ?? '⬜';
      const bg = STATUS_BG[status] ?? '#f5f5f3';
      const color = STATUS_COLOR[status] ?? '#6b6b68';
      const timeStr = t.timeSpent ? `${t.timeSpent} hr${t.timeSpent !== 1 ? 's' : ''}` : '—';

      return `
        <tr style="border-bottom: 1px solid #ebebea;">
          <td style="padding: 12px 16px; font-size: 14px; color: #1a1a18;">${t.name}</td>
          <td style="padding: 12px 16px; font-size: 13px; color: #6b6b68;">${clientName}</td>
          <td style="padding: 12px 16px;">
            <span style="background:${bg}; color:${color}; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; white-space: nowrap;">
              ${emoji} ${status || 'No status'}
            </span>
          </td>
          <td style="padding: 12px 16px; font-size: 13px; color: #6b6b68; text-align: right;">${timeStr}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="margin:0; padding:0; background:#f5f5f3; font-family: system-ui, -apple-system, sans-serif;">
        <div style="max-width: 640px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #ebebea;">

          <div style="background: #1a1a18; padding: 28px 32px;">
            <p style="margin:0; font-size: 11px; font-weight: 600; color: #999994; letter-spacing: 0.08em; text-transform: uppercase;">${teamName}</p>
            <h1 style="margin: 6px 0 0; font-size: 22px; font-weight: 700; color: #f0ede8;">Your Task List</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #a8a8a3;">${today}</p>
          </div>

          <div style="padding: 24px 32px 0;">
            <p style="margin: 0; font-size: 15px; color: #1a1a18;">Hi <strong>${member.name}</strong>,</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #6b6b68;">Here is your current task list with status updates.</p>
          </div>

          <div style="padding: 16px 32px;">
            <div style="background: #f5f5f3; border-radius: 8px; padding: 8px 16px; font-size: 13px; color: #6b6b68; display: inline-block;">
              Total: <strong style="color: #1a1a18;">${tasks.length}</strong>
              &nbsp;·&nbsp;
              Completed: <strong style="color: #27500A;">${(tasks as any[]).filter(t => t.status === 'Completed').length}</strong>
              &nbsp;·&nbsp;
              In Progress: <strong style="color: #0C447C;">${(tasks as any[]).filter(t => t.status === 'In Progress').length}</strong>
            </div>
          </div>

          ${tasks.length > 0 ? `
          <div style="padding: 0 32px 24px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ebebea; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f5f5f3;">
                  <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #999994; text-transform: uppercase; letter-spacing: 0.05em;">Task</th>
                  <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #999994; text-transform: uppercase; letter-spacing: 0.05em;">Client</th>
                  <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #999994; text-transform: uppercase; letter-spacing: 0.05em;">Status</th>
                  <th style="padding: 10px 16px; text-align: right; font-size: 11px; font-weight: 600; color: #999994; text-transform: uppercase; letter-spacing: 0.05em;">Time</th>
                </tr>
              </thead>
              <tbody>${taskRows}</tbody>
            </table>
          </div>
          ` : `<div style="padding: 0 32px 24px; color: #999994; font-size: 14px;">No tasks assigned currently.</div>`}

          <div style="background: #f5f5f3; padding: 16px 32px; border-top: 1px solid #ebebea;">
            <p style="margin: 0; font-size: 12px; color: #999994;">Sent from ${teamName} · Task Manager</p>
          </div>

        </div>
      </body>
      </html>
    `;

    console.log('[send-tasks] Sending to:', member.email, '| GMAIL_USER:', process.env.GMAIL_USER);
    const info = await transporter.sendMail({
      from: `"${teamName}" <${process.env.GMAIL_USER}>`,
      to: member.email,
      subject: `Your Task List — ${today}`,
      html,
    });
    console.log('[send-tasks] Accepted:', info.accepted, '| MessageId:', info.messageId);

    return NextResponse.json({ success: true, sentTo: member.email });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to send email' }, { status: 500 });
  }
}

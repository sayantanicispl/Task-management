import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import dbConnect from '@/lib/mongodb';
import { EodEntry } from '@/models/EodEntry';

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
  'completed':    '✅',
  'in-progress':  '🔄',
  'hold':         '⏸️',
  'partial':      '📤',
  'queue':        '🔶',
  'update sent':  '📨',
};

const STATUS_BG: Record<string, string> = {
  'completed':    '#EAF3DE',
  'in-progress':  '#E6F1FB',
  'hold':         '#FAEEDA',
  'partial':      '#EEEDFE',
  'queue':        '#FAECE7',
  'update sent':  '#E1F5EE',
};

const STATUS_COLOR: Record<string, string> = {
  'completed':    '#27500A',
  'in-progress':  '#0C447C',
  'hold':         '#633806',
  'partial':      '#3C3489',
  'queue':        '#712B13',
  'update sent':  '#085041',
};

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { subject, recipients, clientId, month, year } = await request.json();

    if (!subject?.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }
    if (!recipients?.trim()) {
      return NextResponse.json({ error: 'Recipient email is required' }, { status: 400 });
    }

    const filter: Record<string, unknown> = {};
    if (clientId && clientId !== 'all') filter.clientId = clientId;
    if (month && year && month !== 'all' && year !== 'all') {
      const m = parseInt(month) - 1;
      const y = parseInt(year);
      filter.date = { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) };
    } else if (year && year !== 'all') {
      const y = parseInt(year);
      filter.date = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
    }

    const entries = await EodEntry.find(filter).sort({ clientName: 1, date: -1 }).lean() as any[];

    if (entries.length === 0) {
      return NextResponse.json({ error: 'No EOD entries to send for the selected filters' }, { status: 400 });
    }

    // Group by client
    const grouped = entries.reduce<Record<string, { name: string; entries: typeof entries }>>((acc, e) => {
      const key = e.clientId ? String(e.clientId) : 'no-client';
      const label = e.clientName || 'No client';
      if (!acc[key]) acc[key] = { name: label, entries: [] };
      acc[key].entries.push(e);
      return acc;
    }, {});

    const totalHours = entries.reduce((s: number, e: any) => s + (e.timeSpent || 0), 0);
    const teamName = process.env.NEXT_PUBLIC_TEAM_NAME ?? "Sayantani's Team";
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    const clientSections = Object.values(grouped).map(group => {
      const rows = group.entries.map((e: any) => {
        const key = (e.status || '').toLowerCase();
        const emoji = STATUS_EMOJI[key] ?? '⬜';
        const bg = STATUS_BG[key] ?? '#f5f5f3';
        const color = STATUS_COLOR[key] ?? '#6b6b68';
        const timeStr = e.timeSpent ? `${e.timeSpent}h` : '—';
        const dateStr = new Date(e.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

        return `
          <tr style="border-bottom: 1px solid #ebebea;">
            <td style="padding: 11px 14px; font-size: 13px; color: #1a1a18;">${e.taskName}</td>
            <td style="padding: 11px 14px;">
              <span style="background:${bg};color:${color};padding:2px 9px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap;">${emoji} ${e.status || '—'}</span>
            </td>
            <td style="padding: 11px 14px; font-size: 12px; color: #6b6b68; text-align:right;">${timeStr}</td>
            <td style="padding: 11px 14px; font-size: 12px; color: #6b6b68; text-align:right; white-space:nowrap;">${dateStr}</td>
          </tr>
        `;
      }).join('');

      return `
        <div style="margin-bottom: 28px;">
          <div style="background:#1a1a18; padding: 10px 16px; border-radius: 8px 8px 0 0;">
            <span style="font-size: 13px; font-weight: 700; color: #f0ede8;">${group.name}</span>
            <span style="font-size: 11px; color: #a8a8a3; margin-left: 8px;">${group.entries.length} task${group.entries.length !== 1 ? 's' : ''}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #ebebea;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">
            <thead>
              <tr style="background:#f5f5f3;">
                <th style="padding:8px 14px;text-align:left;font-size:10px;font-weight:600;color:#999994;text-transform:uppercase;letter-spacing:.05em;">Task</th>
                <th style="padding:8px 14px;text-align:left;font-size:10px;font-weight:600;color:#999994;text-transform:uppercase;letter-spacing:.05em;">Status</th>
                <th style="padding:8px 14px;text-align:right;font-size:10px;font-weight:600;color:#999994;text-transform:uppercase;letter-spacing:.05em;">Time</th>
                <th style="padding:8px 14px;text-align:right;font-size:10px;font-weight:600;color:#999994;text-transform:uppercase;letter-spacing:.05em;">Date</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="margin:0;padding:0;background:#f5f5f3;font-family:system-ui,-apple-system,sans-serif;">
        <div style="max-width:680px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ebebea;">

          <div style="background:#1a1a18;padding:28px 32px;">
            <p style="margin:0;font-size:11px;font-weight:600;color:#999994;letter-spacing:.08em;text-transform:uppercase;">${teamName}</p>
            <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#f0ede8;">EOD Report</h1>
            <p style="margin:6px 0 0;font-size:13px;color:#a8a8a3;">${today}</p>
          </div>

          <div style="padding:20px 32px 8px;">
            <div style="background:#f5f5f3;border-radius:8px;padding:10px 16px;font-size:13px;color:#6b6b68;display:inline-flex;gap:16px;">
              <span>Total tasks: <strong style="color:#1a1a18;">${entries.length}</strong></span>
              ${totalHours > 0 ? `<span>Total hours: <strong style="color:#1a1a18;">${totalHours}h</strong></span>` : ''}
              <span>Clients: <strong style="color:#1a1a18;">${Object.keys(grouped).length}</strong></span>
            </div>
          </div>

          <div style="padding:16px 32px 28px;">
            ${clientSections}
          </div>

          <div style="background:#f5f5f3;padding:16px 32px;border-top:1px solid #ebebea;">
            <p style="margin:0;font-size:12px;color:#999994;">Sent from ${teamName} · Task Manager</p>
          </div>

        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"${teamName}" <${process.env.GMAIL_USER}>`,
      to: recipients.trim(),
      subject: subject.trim(),
      html,
    });

    return NextResponse.json({ success: true, sentTo: info.accepted });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to send EOD report' }, { status: 500 });
  }
}

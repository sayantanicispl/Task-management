import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 });

  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100&allowed_updates=message`);
  const data = await res.json();

  if (!data.ok) return NextResponse.json({ error: data.description }, { status: 400 });

  const users = data.result
    .map((u: any) => u.message?.from)
    .filter(Boolean)
    .filter((v: any, i: number, arr: any[]) => arr.findIndex(x => x.id === v.id) === i)
    .map((u: any) => ({
      chatId: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(' '),
      username: u.username ? `@${u.username}` : '—',
    }));

  return NextResponse.json(users);
}

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Client } from '@/models/Client';

export async function GET() {
  try {
    await dbConnect();
    const clients = await Client.find({}).sort({ createdAt: 1 }).lean();
    return NextResponse.json(clients);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { name, project, plan } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const client = await Client.create({
      name: name.trim(),
      project: project?.trim() ?? '',
      plan: plan?.trim() ?? '',
    });
    return NextResponse.json(client, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}

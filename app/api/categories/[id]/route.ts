import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Category } from '@/models/Category';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const body = await request.json();

    // Add a template
    if (body.addTemplate !== undefined) {
      const { name, description = '' } = body.addTemplate;
      if (!name?.trim()) {
        return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
      }
      const updated = await Category.findByIdAndUpdate(
        id,
        { $push: { templates: { name: name.trim(), description: description.trim() } } },
        { new: true }
      ).lean();
      if (!updated) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      return NextResponse.json(updated);
    }

    // Remove a template
    if (body.removeTemplate !== undefined) {
      const updated = await Category.findByIdAndUpdate(
        id,
        { $pull: { templates: { _id: body.removeTemplate } } },
        { new: true }
      ).lean();
      if (!updated) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      return NextResponse.json(updated);
    }

    // Edit a template
    if (body.editTemplate !== undefined) {
      const { id: tmplId, name, description = '' } = body.editTemplate;
      if (!name?.trim()) {
        return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
      }
      const updated = await Category.findOneAndUpdate(
        { _id: id, 'templates._id': tmplId },
        {
          $set: {
            'templates.$.name': name.trim(),
            'templates.$.description': description.trim(),
          },
        },
        { new: true }
      ).lean();
      if (!updated) return NextResponse.json({ error: 'Category or template not found' }, { status: 404 });
      return NextResponse.json(updated);
    }

    // Rename category
    if (body.name !== undefined) {
      const updated = await Category.findByIdAndUpdate(
        id,
        { $set: { name: body.name.trim() } },
        { new: true }
      ).lean();
      if (!updated) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'No valid operation provided' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    await Category.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

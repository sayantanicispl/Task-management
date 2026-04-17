'use client';

import { useState } from 'react';
import type { ICategory } from '@/types';
import { cc } from '@/lib/utils';

interface Props {
  categories: ICategory[];
  onAddCategory: (name: string) => Promise<void>;
  onUpdateCategory: (id: string, name: string) => Promise<void>;
  onRemoveCategory: (id: string) => Promise<void>;
  onAddTemplate: (catId: string, name: string, description: string) => Promise<void>;
  onUpdateTemplate: (catId: string, tmplId: string, name: string, description: string) => Promise<void>;
  onRemoveTemplate: (catId: string, tmplId: string) => Promise<void>;
}

export default function TemplatesTab({
  categories,
  onAddCategory,
  onUpdateCategory,
  onRemoveCategory,
  onAddTemplate,
  onUpdateTemplate,
  onRemoveTemplate,
}: Props) {
  // Category add
  const [addCatName, setAddCatName] = useState('');
  const [addCatLoading, setAddCatLoading] = useState(false);

  // Category edit
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatLoading, setEditCatLoading] = useState(false);

  // Template add (keyed by categoryId)
  const [tmplInputs, setTmplInputs] = useState<Record<string, { name: string; desc: string }>>({});
  const [tmplLoading, setTmplLoading] = useState<string | null>(null);

  // Template edit
  const [editTmpl, setEditTmpl] = useState<{ catId: string; tmplId: string } | null>(null);
  const [editTmplName, setEditTmplName] = useState('');
  const [editTmplDesc, setEditTmplDesc] = useState('');
  const [editTmplLoading, setEditTmplLoading] = useState(false);

  /* ── Category handlers ── */
  const handleAddCategory = async () => {
    if (!addCatName.trim()) return;
    setAddCatLoading(true);
    await onAddCategory(addCatName.trim());
    setAddCatName('');
    setAddCatLoading(false);
  };

  const startEditCat = (id: string, name: string) => {
    setEditCatId(id);
    setEditCatName(name);
  };

  const handleSaveCat = async () => {
    if (!editCatId || !editCatName.trim()) return;
    setEditCatLoading(true);
    await onUpdateCategory(editCatId, editCatName.trim());
    setEditCatLoading(false);
    setEditCatId(null);
  };

  /* ── Template handlers ── */
  const getTmplInput = (catId: string) => tmplInputs[catId] ?? { name: '', desc: '' };

  const setTmplField = (catId: string, field: 'name' | 'desc', value: string) => {
    setTmplInputs(prev => ({
      ...prev,
      [catId]: { ...getTmplInput(catId), [field]: value },
    }));
  };

  const handleAddTemplate = async (catId: string) => {
    const { name, desc } = getTmplInput(catId);
    if (!name.trim()) return;
    setTmplLoading(catId);
    await onAddTemplate(catId, name.trim(), desc.trim());
    setTmplInputs(prev => ({ ...prev, [catId]: { name: '', desc: '' } }));
    setTmplLoading(null);
  };

  const startEditTmpl = (catId: string, tmplId: string, name: string, desc: string) => {
    setEditTmpl({ catId, tmplId });
    setEditTmplName(name);
    setEditTmplDesc(desc);
  };

  const handleSaveTmpl = async () => {
    if (!editTmpl || !editTmplName.trim()) return;
    setEditTmplLoading(true);
    await onUpdateTemplate(editTmpl.catId, editTmpl.tmplId, editTmplName.trim(), editTmplDesc.trim());
    setEditTmplLoading(false);
    setEditTmpl(null);
  };

  return (
    <div>
      <div className="section-title">Templates1</div>

      {/* Add category form */}
      <div className="card">
        <div className="row">
          <input
            value={addCatName}
            onChange={e => setAddCatName(e.target.value)}
            placeholder="New category name (e.g. Fitness, Budget…)"
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
          />
          <button className="primary" onClick={handleAddCategory} disabled={addCatLoading}>
            + Add Category
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="empty">No categories yet. Add one above.</div>
      ) : (
        categories.map((cat, ci) => {
          const col = cc(ci);
          const isEditingCat = editCatId === cat._id;
          const input = getTmplInput(cat._id);

          return (
            <div key={cat._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>

              {/* Category header */}
              <div className="tmpl-cat-header">
                {isEditingCat ? (
                  <>
                    <input
                      value={editCatName}
                      onChange={e => setEditCatName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveCat()}
                      autoFocus
                      style={{ flex: 1, minWidth: 120 }}
                    />
                    <button className="primary" onClick={handleSaveCat} disabled={editCatLoading}>Save</button>
                    <button onClick={() => setEditCatId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span
                      className="chip"
                      style={{ background: col.bg, color: col.color, fontSize: 13, fontWeight: 600 }}
                    >
                      {cat.name}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                      {cat.templates.length} template{cat.templates.length !== 1 ? 's' : ''}
                    </span>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => startEditCat(cat._id, cat.name)}>Edit</button>
                    <button className="danger" onClick={() => onRemoveCategory(cat._id)}>Delete</button>
                  </>
                )}
              </div>

              {/* Template list */}
              {cat.templates.length === 0 ? (
                <div style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text3)' }}>
                  No templates yet — add one below.
                </div>
              ) : (
                cat.templates.map(tmpl => {
                  const isEditingTmpl =
                    editTmpl?.catId === cat._id && editTmpl?.tmplId === tmpl._id;

                  return (
                    <div key={tmpl._id} className="tmpl-row">
                      {isEditingTmpl ? (
                        <>
                          <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <input
                              value={editTmplName}
                              onChange={e => setEditTmplName(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSaveTmpl()}
                              placeholder="Template name"
                              autoFocus
                              style={{ flex: 1, minWidth: 120 }}
                            />
                            <input
                              value={editTmplDesc}
                              onChange={e => setEditTmplDesc(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSaveTmpl()}
                              placeholder="Description (optional)"
                              style={{ flex: 2, minWidth: 160 }}
                            />
                          </div>
                          <button className="primary" onClick={handleSaveTmpl} disabled={editTmplLoading}>Save</button>
                          <button onClick={() => setEditTmpl(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <div className="meta">
                            <div className="meta-name">{tmpl.name}</div>
                            {tmpl.description && (
                              <div className="meta-sub">{tmpl.description}</div>
                            )}
                          </div>
                          <button onClick={() => startEditTmpl(cat._id, tmpl._id, tmpl.name, tmpl.description)}>
                            Edit
                          </button>
                          <button className="danger" onClick={() => onRemoveTemplate(cat._id, tmpl._id)}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  );
                })
              )}

              {/* Add template form */}
              <div className="tmpl-add-row">
                <input
                  value={input.name}
                  onChange={e => setTmplField(cat._id, 'name', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTemplate(cat._id)}
                  placeholder="Template name"
                  style={{ flex: 1, minWidth: 120 }}
                />
                <input
                  value={input.desc}
                  onChange={e => setTmplField(cat._id, 'desc', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTemplate(cat._id)}
                  placeholder="Description (optional)"
                  style={{ flex: 2, minWidth: 160 }}
                />
                <button
                  onClick={() => handleAddTemplate(cat._id)}
                  disabled={tmplLoading === cat._id}
                >
                  + Add
                </button>
              </div>

            </div>
          );
        })
      )}
    </div>
  );
}

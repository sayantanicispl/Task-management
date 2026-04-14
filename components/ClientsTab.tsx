'use client';

import { useState } from 'react';
import type { IClient, IMember } from '@/types';
import { cc, initials } from '@/lib/utils';
import Avatar from './Avatar';

const PLAN_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  'full-time':   { bg: 'var(--blue-bg)',   color: 'var(--blue-text)',  label: 'Full Time' },
  'part-time':   { bg: 'var(--teal-bg)',   color: 'var(--teal-text)',  label: 'Part Time' },
  'maintenance': { bg: 'var(--amber-bg)',  color: 'var(--amber-text)', label: 'Maintenance' },
};

interface Props {
  clients: IClient[];
  members: IMember[];
  onAdd: (name: string, plan: string) => Promise<void>;
  onUpdate: (id: string, name: string, plan: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export default function ClientsTab({ clients, members, onAdd, onUpdate, onRemove }: Props) {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onAdd(name.trim(), plan);
    setName('');
    setPlan('');
    setLoading(false);
  };

  const startEdit = (c: IClient) => {
    setEditId(c._id);
    setEditName(c.name);
    setEditPlan(c.plan ?? '');
  };

  const handleSave = async () => {
    if (!editId || !editName.trim()) return;
    setSaving(true);
    await onUpdate(editId, editName.trim(), editPlan);
    setSaving(false);
    setEditId(null);
  };

  const getOwner = (clientId: string) => {
    const owner = members.find(m => m.clientIds.includes(clientId));
    if (!owner) return null;
    return { member: owner, index: members.indexOf(owner) };
  };

  return (
    <div>
      <div className="section-title">Clients</div>
      <div className="card">
        <div className="row">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Client name"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <select
            value={plan}
            onChange={e => setPlan(e.target.value)}
            style={{ flex: 'none', width: 'auto' }}
          >
            <option value="">No plan</option>
            {Object.entries(PLAN_STYLES).map(([val, s]) => (
              <option key={val} value={val}>{s.label}</option>
            ))}
          </select>
          <button className="primary" onClick={handleAdd} disabled={loading}>
            + Add
          </button>
        </div>
      </div>

      {!clients.length ? (
        <div className="empty">No clients yet. Add one above.</div>
      ) : (
        clients.map((c, i) => {
          const col = cc(i);
          const ownerInfo = getOwner(c._id);
          const isEditing = editId === c._id;

          return (
            <div key={c._id} className="card list-item" style={{ flexWrap: isEditing ? 'wrap' : undefined }}>
              <div className="avatar" style={{ background: col.bg, color: col.color }}>
                {initials(isEditing ? editName || c.name : c.name)}
              </div>

              {isEditing ? (
                <>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    style={{ flex: 1, minWidth: 120 }}
                    autoFocus
                  />
                  <select
                    value={editPlan}
                    onChange={e => setEditPlan(e.target.value)}
                    style={{ flex: 'none', width: 'auto' }}
                  >
                    <option value="">No plan</option>
                    {Object.entries(PLAN_STYLES).map(([val, s]) => (
                      <option key={val} value={val}>{s.label}</option>
                    ))}
                  </select>
                  <button className="primary" onClick={handleSave} disabled={saving}>
                    Save
                  </button>
                  <button onClick={() => setEditId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <div className="meta">
                    <div className="meta-name">{c.name}</div>
                  </div>
                  {c.plan && PLAN_STYLES[c.plan] && (
                    <span className="chip" style={{ background: PLAN_STYLES[c.plan].bg, color: PLAN_STYLES[c.plan].color }}>
                      {PLAN_STYLES[c.plan].label}
                    </span>
                  )}
                  {ownerInfo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Avatar member={ownerInfo.member} index={ownerInfo.index} size={22} fontSize={9} />
                      <span className="chip" style={{ background: col.bg, color: col.color }}>
                        {ownerInfo.member.name}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>Unassigned</span>
                  )}
                  <button onClick={() => startEdit(c)}>Edit</button>
                  <button className="danger" onClick={() => onRemove(c._id)}>Remove</button>
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

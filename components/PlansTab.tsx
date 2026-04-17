'use client';

import { useState, useRef } from 'react';
import type { IClient, ClientPlan, TaskVolume } from '@/types';
import { cc, initials } from '@/lib/utils';

const PLANS: { value: ClientPlan; label: string; bg: string; color: string }[] = [
  { value: 'full-time',   label: 'Full Time',   bg: 'var(--blue-bg)',  color: 'var(--blue-text)' },
  { value: 'part-time',   label: 'Part Time',   bg: 'var(--teal-bg)',  color: 'var(--teal-text)' },
  { value: 'maintenance', label: 'Maintenance', bg: 'var(--amber-bg)', color: 'var(--amber-text)' },
];

const VOLUMES: { value: TaskVolume; label: string; bg: string; color: string }[] = [
  { value: 'low',    label: 'Low Volume Task',    bg: 'var(--green-bg)',  color: 'var(--green-text)' },
  { value: 'medium', label: 'Medium Volume Task', bg: 'var(--amber-bg)', color: 'var(--amber-text)' },
  { value: 'high',   label: 'High Volume Task',   bg: 'var(--coral-bg)', color: 'var(--coral-text)' },
];

interface Props {
  clients: IClient[];
  onUpdatePlan: (id: string, plan: ClientPlan) => Promise<void>;
  onUpdateTaskVolume: (id: string, taskVolume: TaskVolume) => Promise<void>;
}

type EditTarget = { clientId: string; field: 'plan' | 'volume' };

export default function PlansTab({ clients, onUpdatePlan, onUpdateTaskVolume }: Props) {
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  const openEdit = (clientId: string, field: 'plan' | 'volume') => {
    setEditing({ clientId, field });
    setTimeout(() => selectRef.current?.focus(), 0);
  };

  const closeEdit = () => setEditing(null);

  const isEditing = (clientId: string, field: 'plan' | 'volume') =>
    editing?.clientId === clientId && editing?.field === field;

  return (
    <div>
      <div className="section-title">Client Plans</div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {PLANS.map(p => {
          const count = clients.filter(c => c.plan === p.value).length;
          return (
            <span key={p.value} className="chip" style={{ background: p.bg, color: p.color, fontSize: 13 }}>
              {p.label}: {count}
            </span>
          );
        })}
        <span className="chip" style={{ background: 'var(--bg3)', color: 'var(--text2)', fontSize: 13 }}>
          Unassigned: {clients.filter(c => !c.plan).length}
        </span>
      </div>

      {!clients.length ? (
        <div className="empty">No clients yet. Add clients from the Clients tab.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {clients.map((c, i) => {
            const col = cc(i);
            const planInfo  = PLANS.find(p => p.value === c.plan);
            const volInfo   = VOLUMES.find(v => v.value === c.taskVolume);

            return (
              <div key={c._id} className="list-item" style={{ padding: '10px 16px' }}>
                <div className="avatar" style={{ background: col.bg, color: col.color, flexShrink: 0 }}>
                  {initials(c.name)}
                </div>

                <div className="meta">
                  <div className="meta-name">{c.name}</div>
                  {c.project && <div className="meta-sub">{c.project}</div>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

                  {/* ── Plan ── */}
                  {isEditing(c._id, 'plan') ? (
                    <select
                      ref={selectRef}
                      autoFocus
                      value={c.plan ?? ''}
                      onChange={async e => {
                        await onUpdatePlan(c._id, e.target.value as ClientPlan);
                        closeEdit();
                      }}
                      onBlur={closeEdit}
                      style={{ flex: 'none', minWidth: 0, width: 'auto', fontSize: 13, padding: '4px 8px' }}
                    >
                      <option value="">No plan</option>
                      {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  ) : (
                    <span
                      className="chip plan-badge-edit"
                      title="Click to change"
                      style={{
                        background: planInfo?.bg  ?? 'var(--bg3)',
                        color:      planInfo?.color ?? 'var(--text3)',
                        cursor: 'pointer',
                      }}
                      onClick={() => openEdit(c._id, 'plan')}
                    >
                      {planInfo?.label ?? 'No plan'} ✎
                    </span>
                  )}

                  {/* ── Task Volume ── */}
                  {isEditing(c._id, 'volume') ? (
                    <select
                      autoFocus
                      value={c.taskVolume ?? ''}
                      onChange={async e => {
                        await onUpdateTaskVolume(c._id, e.target.value as TaskVolume);
                        closeEdit();
                      }}
                      onBlur={closeEdit}
                      style={{ flex: 'none', minWidth: 0, width: 'auto', fontSize: 13, padding: '4px 8px' }}
                    >
                      <option value="">No volume</option>
                      {VOLUMES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                  ) : (
                    <span
                      className="chip plan-badge-edit"
                      title="Click to change"
                      style={{
                        background: volInfo?.bg  ?? 'var(--bg3)',
                        color:      volInfo?.color ?? 'var(--text3)',
                        cursor: 'pointer',
                      }}
                      onClick={() => openEdit(c._id, 'volume')}
                    >
                      {volInfo?.label ?? 'Task Volume'} ✎
                    </span>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grouped view */}
      {clients.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 28 }}>Grouped by Plan</div>
          {[...PLANS, { value: '' as ClientPlan, label: 'Unassigned', bg: 'var(--bg3)', color: 'var(--text2)' }].map(p => {
            const group = clients.filter(c => (c.plan ?? '') === p.value);
            if (!group.length) return null;
            return (
              <div key={p.value || 'none'} style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: p.color,
                  background: p.bg, display: 'inline-block',
                  padding: '3px 10px', borderRadius: 20, marginBottom: 8,
                }}>
                  {p.label} ({group.length})
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {group.map(c => {
                    const col    = cc(clients.indexOf(c));
                    const volInfo = VOLUMES.find(v => v.value === c.taskVolume);
                    return (
                      <div key={c._id} className="list-item" style={{ padding: '8px 16px' }}>
                        <div className="avatar" style={{ background: col.bg, color: col.color, width: 28, height: 28, fontSize: 11 }}>
                          {initials(c.name)}
                        </div>
                        <div className="meta">
                          <div className="meta-name" style={{ fontSize: 13 }}>{c.name}</div>
                          {c.project && <div className="meta-sub">{c.project}</div>}
                        </div>
                        <span className="chip" style={{
                          background: volInfo?.bg  ?? 'var(--bg3)',
                          color:      volInfo?.color ?? 'var(--text3)',
                          fontSize: 11,
                        }}>
                          {volInfo?.label ?? 'No volume'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

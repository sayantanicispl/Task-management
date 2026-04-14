'use client';

import type { IClient, ClientPlan } from '@/types';
import { cc, initials } from '@/lib/utils';

const PLANS: { value: ClientPlan; label: string; bg: string; color: string }[] = [
  { value: 'full-time',    label: 'Full Time',    bg: 'var(--blue-bg)',   color: 'var(--blue-text)' },
  { value: 'part-time',    label: 'Part Time',    bg: 'var(--teal-bg)',   color: 'var(--teal-text)' },
  { value: 'maintenance',  label: 'Maintenance',  bg: 'var(--amber-bg)',  color: 'var(--amber-text)' },
];

interface Props {
  clients: IClient[];
  onUpdatePlan: (id: string, plan: ClientPlan) => Promise<void>;
}

export default function PlansTab({ clients, onUpdatePlan }: Props) {
  return (
    <div>
      <div className="section-title">Client Plans</div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {PLANS.map(p => {
          const count = clients.filter(c => c.plan === p.value).length;
          return (
            <span
              key={p.value}
              className="chip"
              style={{ background: p.bg, color: p.color, fontSize: 13 }}
            >
              {p.label}: {count}
            </span>
          );
        })}
        <span
          className="chip"
          style={{ background: 'var(--bg3)', color: 'var(--text2)', fontSize: 13 }}
        >
          Unassigned: {clients.filter(c => !c.plan).length}
        </span>
      </div>

      {!clients.length ? (
        <div className="empty">No clients yet. Add clients from the Clients tab.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {clients.map((c, i) => {
            const col = cc(i);
            const planInfo = PLANS.find(p => p.value === c.plan);
            return (
              <div key={c._id} className="list-item" style={{ padding: '10px 16px' }}>
                <div
                  className="avatar"
                  style={{ background: col.bg, color: col.color, flexShrink: 0 }}
                >
                  {initials(c.name)}
                </div>
                <div className="meta">
                  <div className="meta-name">{c.name}</div>
                  {c.project && <div className="meta-sub">{c.project}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {planInfo && (
                    <span
                      className="chip"
                      style={{ background: planInfo.bg, color: planInfo.color }}
                    >
                      {planInfo.label}
                    </span>
                  )}
                  <select
                    value={c.plan ?? ''}
                    onChange={e => onUpdatePlan(c._id, e.target.value as ClientPlan)}
                    style={{ flex: 'none', minWidth: 0, width: 'auto', fontSize: 13, padding: '5px 8px' }}
                  >
                    <option value="">No plan</option>
                    {PLANS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
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
                  {group.map((c) => {
                    const col = cc(clients.indexOf(c));
                    return (
                      <div key={c._id} className="list-item" style={{ padding: '8px 16px' }}>
                        <div
                          className="avatar"
                          style={{ background: col.bg, color: col.color, width: 28, height: 28, fontSize: 11 }}
                        >
                          {initials(c.name)}
                        </div>
                        <div className="meta">
                          <div className="meta-name" style={{ fontSize: 13 }}>{c.name}</div>
                          {c.project && <div className="meta-sub">{c.project}</div>}
                        </div>
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

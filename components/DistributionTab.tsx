'use client';

import { useState } from 'react';
import type { IClient, IMember, ITask } from '@/types';
import Avatar from './Avatar';

interface Props {
  clients: IClient[];
  members: IMember[];
  tasks: ITask[];
}

interface DistTask {
  id: string;
  name: string;
  clientId: string | null;
}

type DistMap = Record<string, DistTask[]>;

export default function DistributionTab({ clients, members, tasks }: Props) {
  const [distMap, setDistMap] = useState<DistMap | null>(null);
  const [removedTaskIds, setRemovedTaskIds] = useState<Set<string>>(new Set());
  const [manualInputs, setManualInputs] = useState<
    Record<string, { name: string; clientId: string }>
  >({});
  const [saving, setSaving] = useState(false);
  const [distributing, setDistributing] = useState(false);

  const pendingCount = tasks.filter(t => !t.done).length;

  const distribute = async () => {
    if (!members.length) { setDistMap({}); return; }
    setDistributing(true);

    // Always fetch fresh tasks so assignedTo values are current
    const res = await fetch('/api/tasks');
    const latestTasks: ITask[] = await res.json();

    const activeMembers = members.filter(m => !m.isNightShift);

    const map: DistMap = {};
    activeMembers.forEach(m => { map[m._id] = []; });

    const pending = latestTasks.filter(t => !t.done);

    // 1. Pre-populate tasks already assigned to a member
    pending.forEach(t => {
      if (t.assignedTo && map[t.assignedTo] !== undefined) {
        map[t.assignedTo].push({ id: t._id, name: t.name, clientId: t.clientId });
      }
    });

    // 2. Auto-distribute only tasks that were NEVER assigned (undefined)
    //    Skip tasks explicitly set to null (user removed them — respect that choice)
    const toDistribute = pending.filter(t => t.assignedTo === undefined);
    const byClient: Record<string, DistTask[]> = {};
    const noClient: DistTask[] = [];

    toDistribute.forEach(t => {
      const dt: DistTask = { id: t._id, name: t.name, clientId: t.clientId };
      if (t.clientId) {
        (byClient[t.clientId] ??= []).push(dt);
      } else {
        noClient.push(dt);
      }
    });

    const getLeast = () =>
      activeMembers.reduce((a, b) => (map[a._id].length <= map[b._id].length ? a : b));

    Object.entries(byClient).forEach(([cid, clientTasks]) => {
      const assignees = activeMembers.filter(m => m.clientIds.includes(cid));
      if (!assignees.length) {
        clientTasks.forEach(t => { map[getLeast()._id].push(t); });
      } else {
        clientTasks.forEach((t, i) => { map[assignees[i % assignees.length]._id].push(t); });
      }
    });

    noClient.forEach(t => { map[getLeast()._id].push(t); });

    setDistMap(map);
    setRemovedTaskIds(new Set());
    setDistributing(false);
  };

  const removeDistTask = (memberId: string, taskId: string) => {
    setDistMap(prev =>
      prev ? { ...prev, [memberId]: prev[memberId].filter(t => t.id !== taskId) } : prev
    );
    if (!taskId.startsWith('manual-')) {
      setRemovedTaskIds(prev => new Set(prev).add(taskId));
    }
  };

  const saveDistribution = async () => {
    if (!distMap) return;
    setSaving(true);
    const patches: Promise<any>[] = [];

    // Assign tasks in the current map
    Object.entries(distMap).forEach(([memberId, memberTasks]) => {
      memberTasks.forEach(t => {
        if (t.id.startsWith('manual-')) {
          patches.push(
            fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: t.name, clientId: t.clientId || null }),
            })
              .then(r => r.json())
              .then(created => fetch(`/api/tasks/${created._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedTo: memberId }),
              }))
          );
        } else {
          patches.push(
            fetch(`/api/tasks/${t.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ assignedTo: memberId }),
            })
          );
        }
      });
    });

    // Unassign tasks that were removed
    removedTaskIds.forEach(taskId => {
      patches.push(
        fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedTo: null }),
        })
      );
    });

    await Promise.all(patches);
    setRemovedTaskIds(new Set());
    setSaving(false);
    alert('Distribution saved! Work Status pages are now updated.');
  };

  const addManualTask = (memberId: string) => {
    const inp = manualInputs[memberId];
    if (!inp?.name.trim()) return;
    const newTask: DistTask = {
      id: `manual-${Date.now()}`,
      name: inp.name.trim(),
      clientId: inp.clientId || null,
    };
    setDistMap(prev =>
      prev ? { ...prev, [memberId]: [...prev[memberId], newTask] } : prev
    );
    setManualInputs(prev => ({ ...prev, [memberId]: { name: '', clientId: '' } }));
  };

  return (
    <div>
      <div className="section-title">Task distribution</div>

      <div className="summary-grid">
        <div className="metric">
          <div className="metric-val">{clients.length}</div>
          <div className="metric-label">Clients</div>
        </div>
        <div className="metric">
          <div className="metric-val">{members.length}</div>
          <div className="metric-label">Members</div>
        </div>
        <div className="metric">
          <div className="metric-val">{pendingCount}</div>
          <div className="metric-label">Pending tasks</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        <button
          className="primary"
          style={{ flex: 1, padding: 10 }}
          onClick={distribute}
          disabled={distributing}
        >
          {distributing ? 'Loading…' : 'Distribute tasks now'}
        </button>
        {distMap !== null && Object.values(distMap).some(t => t.length > 0) && (
          <button
            className="primary"
            style={{ flex: 1, padding: 10, background: 'var(--teal-text)', borderColor: 'var(--teal-text)' }}
            onClick={saveDistribution}
            disabled={saving}
          >
            {saving ? 'Saving…' : '💾 Save Distribution'}
          </button>
        )}
      </div>

      {distMap !== null && members.some(m => m.isNightShift) && (
        <div style={{ marginBottom: '1rem', padding: '10px 14px', background: 'var(--amber-bg)', borderRadius: 8, fontSize: 13, color: 'var(--amber-text, #633806)' }}>
          🌙 Night shift members are excluded from distribution: <strong>{members.filter(m => m.isNightShift).map(m => m.name).join(', ')}</strong>
        </div>
      )}

      {distMap !== null && (
        !members.length ? (
          <div className="empty">Add team members first.</div>
        ) : !pendingCount ? (
          <div className="empty">No pending tasks to distribute.</div>
        ) : (
          members.filter(m => !m.isNightShift).map((m, i) => {
            const mt = distMap[m._id] ?? [];
            const inp = manualInputs[m._id] ?? { name: '', clientId: '' };
            return (
              <div key={m._id} className="dist-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Avatar member={m} index={i} size={28} fontSize={11} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text2)' }}>
                    {mt.length} task{mt.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ paddingLeft: 36, marginBottom: 8 }}>
                  {mt.length ? (
                    mt.map(t => {
                      const client = t.clientId
                        ? clients.find(c => c._id === t.clientId)
                        : null;
                      return (
                        <div
                          key={t.id}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}
                        >
                          <span style={{ fontSize: 13, flex: 1 }}>
                            {t.name}
                            {client && (
                              <span style={{ color: 'var(--text2)' }}> — {client.name}</span>
                            )}
                          </span>
                          <button
                            className="danger"
                            style={{ padding: '2px 8px', fontSize: 11 }}
                            onClick={() => removeDistTask(m._id, t.id)}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>No tasks assigned</div>
                  )}
                </div>

                <div style={{ paddingLeft: 36, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <input
                    placeholder="Add a task manually..."
                    style={{ flex: 1, minWidth: 120, fontSize: 13, padding: '5px 8px' }}
                    value={inp.name}
                    onChange={e =>
                      setManualInputs(prev => ({
                        ...prev,
                        [m._id]: { ...inp, name: e.target.value },
                      }))
                    }
                    onKeyDown={e => e.key === 'Enter' && addManualTask(m._id)}
                  />
                  <select
                    style={{ fontSize: 13, padding: '5px 8px', flex: 'none', maxWidth: 140 }}
                    value={inp.clientId}
                    onChange={e =>
                      setManualInputs(prev => ({
                        ...prev,
                        [m._id]: { ...inp, clientId: e.target.value },
                      }))
                    }
                  >
                    <option value="">No client</option>
                    {clients.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    style={{ fontSize: 12, padding: '5px 10px' }}
                    onClick={() => addManualTask(m._id)}
                  >
                    + Add
                  </button>
                </div>
              </div>
            );
          })
        )
      )}
    </div>
  );
}

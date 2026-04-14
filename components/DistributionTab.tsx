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
  const [manualInputs, setManualInputs] = useState<
    Record<string, { name: string; clientId: string }>
  >({});

  const pendingCount = tasks.filter(t => !t.done).length;

  const distribute = () => {
    if (!members.length || !pendingCount) {
      setDistMap({});
      return;
    }

    const map: DistMap = {};
    members.forEach(m => { map[m._id] = []; });

    const pending = tasks.filter(t => !t.done);
    const byClient: Record<string, DistTask[]> = {};
    const noClient: DistTask[] = [];

    pending.forEach(t => {
      const dt: DistTask = { id: t._id, name: t.name, clientId: t.clientId };
      if (t.clientId) {
        (byClient[t.clientId] ??= []).push(dt);
      } else {
        noClient.push(dt);
      }
    });

    const getLeast = () =>
      members.reduce((a, b) => (map[a._id].length <= map[b._id].length ? a : b));

    Object.entries(byClient).forEach(([cid, clientTasks]) => {
      const assignees = members.filter(m => m.clientIds.includes(cid));
      if (!assignees.length) {
        clientTasks.forEach(t => { map[getLeast()._id].push(t); });
      } else {
        clientTasks.forEach((t, i) => { map[assignees[i % assignees.length]._id].push(t); });
      }
    });

    noClient.forEach(t => { map[getLeast()._id].push(t); });

    setDistMap(map);
  };

  const removeDistTask = (memberId: string, taskId: string) => {
    setDistMap(prev =>
      prev ? { ...prev, [memberId]: prev[memberId].filter(t => t.id !== taskId) } : prev
    );
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

      <button
        className="primary"
        style={{ width: '100%', padding: 10, marginBottom: '1rem' }}
        onClick={distribute}
      >
        Distribute tasks now
      </button>

      {distMap !== null && (
        !members.length ? (
          <div className="empty">Add team members first.</div>
        ) : !pendingCount ? (
          <div className="empty">No pending tasks to distribute.</div>
        ) : (
          members.map((m, i) => {
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

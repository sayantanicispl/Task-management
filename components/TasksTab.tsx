'use client';

import { useState } from 'react';
import type { IClient, ITask } from '@/types';
import { cc } from '@/lib/utils';

interface Props {
  tasks: ITask[];
  clients: IClient[];
  onAdd: (name: string, clientId: string | null) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
}

export default function TasksTab({ tasks, clients, onAdd, onRemove, onToggle }: Props) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onAdd(name.trim(), clientId || null);
    setName('');
    setLoading(false);
  };

  return (
    <div>
      <div className="section-title">Daily tasks</div>
      <div className="card">
        <div className="row">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Task description"
            style={{ flex: 2 }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <select value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">-- Client (optional) --</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="primary" onClick={handleAdd} disabled={loading}>
            + Add
          </button>
        </div>
      </div>

      {!tasks.length ? (
        <div className="empty">No tasks yet. Add one above.</div>
      ) : (
        <div className="card">
          {tasks.map(t => {
            const ci = t.clientId ? clients.findIndex(c => c._id === t.clientId) : -1;
            const client = ci >= 0 ? clients[ci] : null;
            const col = client ? cc(ci) : null;
            return (
              <div key={t._id} className="task-row">
                <input
                  type="checkbox"
                  className="cb"
                  checked={t.done}
                  onChange={() => onToggle(t._id)}
                />
                <div className="meta">
                  <div className={`meta-name${t.done ? ' done' : ''}`}>{t.name}</div>
                  {client && <div className="meta-sub">{client.name}</div>}
                </div>
                {client && col && (
                  <span className="chip" style={{ background: col.bg, color: col.color }}>
                    {client.name}
                  </span>
                )}
                <button className="danger" onClick={() => onRemove(t._id)}>
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import type { IClient, ITask } from '@/types';
import { cc } from '@/lib/utils';

const PRESET_TIMES = ['0.5', '1', '2', '3'];

const STATUS_OPTIONS = [
  'In the Queue',
  'In Progress',
  'Partially Update Sent',
  'Update Sent',
  'Completed',
  'Hold',
];

const STATUS_SLUG: Record<string, string> = {
  'Completed':             's-completed',
  'In Progress':           's-in-progress',
  'Hold':                  's-hold',
  'Partially Update Sent': 's-partial',
  'In the Queue':          's-queue',
  'Update Sent':           's-update-sent',
};

function toDateKey(iso: string) {
  return iso.split('T')[0];
}

function dateLabel(key: string) {
  const today     = toDateKey(new Date().toISOString());
  const yesterday = toDateKey(new Date(Date.now() - 86400000).toISOString());
  const d = new Date(key + 'T12:00:00Z');
  const formatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  if (key === today)     return { primary: 'Today',     sub: formatted };
  if (key === yesterday) return { primary: 'Yesterday', sub: formatted };
  return { primary: formatted, sub: '' };
}

interface Props {
  tasks: ITask[];
  clients: IClient[];
  onAdd: (name: string, clientId: string | null) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onUpdateTime: (id: string, hours: number) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

export default function TasksTab({
  tasks, clients, onAdd, onRemove, onUpdateTime, onUpdateStatus,
}: Props) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [localTimes, setLocalTimes] = useState<Record<string, number>>({});
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      await onAdd(name.trim(), clientId || null);
      setName('');
    } catch (e: any) {
      setAddError(e.message ?? 'Failed to add task');
    } finally {
      setAdding(false);
    }
  };

  const handleTimeSelect = async (taskId: string, value: string) => {
    if (value === 'custom') {
      setCustomInputs(prev => ({ ...prev, [taskId]: '' }));
      return;
    }
    const hours = parseFloat(value) || 0;
    setLocalTimes(prev => ({ ...prev, [taskId]: hours }));
    await onUpdateTime(taskId, hours);
  };

  const handleCustomSubmit = async (taskId: string) => {
    const raw = customInputs[taskId];
    if (raw === undefined) return;
    setCustomInputs(prev => { const n = { ...prev }; delete n[taskId]; return n; });
    const val = parseFloat(raw);
    if (!isNaN(val) && val > 0) {
      setLocalTimes(prev => ({ ...prev, [taskId]: val }));
      await onUpdateTime(taskId, val);
    }
  };

  const handleStatusSelect = async (taskId: string, value: string) => {
    setLocalStatuses(prev => ({ ...prev, [taskId]: value }));
    await onUpdateStatus(taskId, value);
  };

  // Group tasks by date (newest group first, tasks within group in added order)
  const groups = useMemo(() => {
    const map: Record<string, ITask[]> = {};
    for (const t of tasks) {
      const key = t.createdAt ? toDateKey(t.createdAt) : 'unknown';
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [tasks]);

  const totalTime = tasks.reduce((sum, t) =>
    sum + (localTimes[t._id] !== undefined ? localTimes[t._id] : (t.timeSpent || 0)), 0);
  const fmtTime = (h: number) =>
    h === 0 ? '—' : `${h % 1 === 0 ? h : h.toFixed(1)} hr${h !== 1 ? 's' : ''}`;
  const totalDone = tasks.filter(t => t.done).length;

  const renderRow = (t: ITask) => {
    const ci     = t.clientId ? clients.findIndex(c => c._id === t.clientId) : -1;
    const client = ci >= 0 ? clients[ci] : null;
    const col    = client ? cc(ci) : null;

    const isCustom    = customInputs[t._id] !== undefined;
    const displayTime = localTimes[t._id] !== undefined ? localTimes[t._id] : (t.timeSpent || 0);
    const hasCustomTime = displayTime > 0 && !PRESET_TIMES.includes(String(displayTime));
    const timeVal = isCustom ? 'custom' : displayTime ? String(displayTime) : '';

    const displayStatus = localStatuses[t._id] !== undefined ? localStatuses[t._id] : (t.status ?? '');
    const statusCls = displayStatus ? STATUS_SLUG[displayStatus] ?? '' : '';

    return (
      <div key={t._id} className={`tasks-row${t.done ? ' tasks-row--done' : ''}`}>
        <div className="t-name">
          <span>{t.name}</span>
          {client && col && (
            <span className="t-chip" style={{ background: col.bg, color: col.color }}>
              {client.name}
            </span>
          )}
        </div>

        <div className="t-time-cell">
          {isCustom ? (
            <input
              type="number"
              className="t-ctrl t-ctrl--custom"
              min="0.5"
              step="0.5"
              placeholder="e.g. 1.5"
              value={customInputs[t._id]}
              onChange={e => setCustomInputs(prev => ({ ...prev, [t._id]: e.target.value }))}
              onBlur={() => handleCustomSubmit(t._id)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCustomSubmit(t._id); } }}
              autoFocus
            />
          ) : (
            <select
              className="t-ctrl t-ctrl--time"
              value={timeVal}
              onChange={e => handleTimeSelect(t._id, e.target.value)}
            >
              <option value="">—</option>
              <option value="0.5">0.5 hr</option>
              <option value="1">1 hr</option>
              <option value="2">2 hr</option>
              <option value="3">3 hr</option>
              {hasCustomTime && <option value={String(displayTime)}>{displayTime} hr</option>}
              <option value="custom">Custom…</option>
            </select>
          )}
        </div>

        <select
          className={`t-ctrl t-ctrl--status${statusCls ? ` ${statusCls}` : ''}`}
          value={displayStatus}
          onChange={e => handleStatusSelect(t._id, e.target.value)}
        >
          <option value="">— Status —</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <button className="t-del" onClick={() => onRemove(t._id)} title="Remove task">×</button>
      </div>
    );
  };

  return (
    <div className="tasks-wrap">

      {/* ── Add task bar ── */}
      <div className="tasks-add-bar">
        <span className="tasks-add-icon">+</span>
        <input
          className="tasks-add-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Add a task…"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          disabled={adding}
        />
        <select
          className="tasks-add-client"
          value={clientId}
          onChange={e => setClientId(e.target.value)}
        >
          <option value="">No client</option>
          {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <button
          className="tasks-add-btn"
          onClick={handleAdd}
          disabled={adding || !name.trim()}
        >
          Add task
        </button>
      </div>

      {addError && <p className="tasks-add-error">{addError}</p>}

      {/* ── Date-grouped task history ── */}
      {tasks.length === 0 ? (
        <div className="empty">No tasks yet. Type above and press Enter to add one.</div>
      ) : (
        <>
          {groups.map(([dateKey, groupTasks]) => {
            const label = dateLabel(dateKey);
            const groupTime = groupTasks.reduce((s, t) =>
              s + (localTimes[t._id] !== undefined ? localTimes[t._id] : (t.timeSpent || 0)), 0);

            return (
              <div key={dateKey} className="tasks-date-section">
                {/* Date header */}
                <div className="tasks-date-header">
                  <div className="tasks-date-header-left">
                    <span className="tasks-date-primary">{label.primary}</span>
                    {label.sub && <span className="tasks-date-sub">{label.sub}</span>}
                  </div>
                  <div className="tasks-date-header-right">
                    <span className="tasks-date-meta">{groupTasks.length} task{groupTasks.length !== 1 ? 's' : ''}</span>
                    {groupTime > 0 && (
                      <span className="tasks-date-meta tasks-date-time">{fmtTime(groupTime)}</span>
                    )}
                  </div>
                </div>

                {/* Task rows */}
                <div className="tasks-table">
                  <div className="tasks-head">
                    <span>Task</span>
                    <span>Time</span>
                    <span>Status</span>
                    <span />
                  </div>
                  {groupTasks.map(renderRow)}
                </div>
              </div>
            );
          })}

          {/* Global footer */}
          <div className="tasks-history-foot">
            <span>{tasks.length} total task{tasks.length !== 1 ? 's' : ''}</span>
            <span className="tasks-foot-sep" />
            <span>{totalDone} completed</span>
            <span className="tasks-foot-sep" />
            <span>Total time: <strong>{fmtTime(totalTime)}</strong></span>
          </div>
        </>
      )}
    </div>
  );
}

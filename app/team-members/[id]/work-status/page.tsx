'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface WorkTask {
  _id: string;
  name: string;
  clientName: string | null;
  status: string;
  timeSpent: number;
  done: boolean;
  createdAt: string;
}

interface DayGroup {
  label: string;
  isoDate: string;
  tasks: WorkTask[];
}

const STATUS_OPTIONS = [
  '',
  'Completed',
  'In Progress',
  'Hold',
  'Partially Update Sent',
  'In the Queue',
  'Update Sent',
] as const;

const STATUS_CLASS: Record<string, string> = {
  'Completed':             's-completed',
  'In Progress':           's-in-progress',
  'Hold':                  's-hold',
  'Partially Update Sent': 's-partial',
  'In the Queue':          's-queue',
  'Update Sent':           's-update-sent',
};

function toDateKey(iso: string) { return iso.slice(0, 10); }

function formatDateLabel(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function groupByDate(tasks: WorkTask[], statuses: Record<string, string>): DayGroup[] {
  const map = new Map<string, WorkTask[]>();
  for (const t of tasks) {
    const key = toDateKey(t.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([isoDate, tasks]) => ({ isoDate, label: formatDateLabel(isoDate), tasks }));
}

export default function WorkStatusPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    const [memberRes, tasksRes] = await Promise.all([
      fetch(`/api/members/${id}`),
      fetch(`/api/members/${id}/tasks`),
    ]);
    if (memberRes.ok) {
      const m = await memberRes.json();
      setMemberName(m.name ?? '');
      setMemberEmail(m.email ?? '');
    }
    if (tasksRes.ok) {
      const t: WorkTask[] = await tasksRes.json();
      const list = Array.isArray(t) ? t : [];
      setTasks(list);
      setStatuses(Object.fromEntries(list.map(task => [task._id, task.status ?? ''])));
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (taskId: string, newStatus: string) => {
    setStatuses(prev => ({ ...prev, [taskId]: newStatus }));
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  if (loading) return <div className="wrap"><div className="empty">Loading…</div></div>;

  const groups = groupByDate(tasks, statuses);

  return (
    <div className="wrap">
      <button className="mp-back" onClick={() => router.back()}>← Back</button>

      <div className="ws-page-header">
        <div>
          <h2 className="ws-page-title">{memberName}</h2>
          <p className="ws-page-sub">Work Status</p>
        </div>
        <div className="ws-summary">
          <span className="ws-summary-chip">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
          <span className="ws-summary-chip">{groups.length} day{groups.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="empty">No tasks found. Assign clients to this member to see their work status.</div>
      ) : (
        <div className="ws-timeline">
          {groups.map(group => (
            <div key={group.isoDate} className="ws-day-block">
              <div className="ws-day-header">
                <span className="ws-day-dot" />
                <span className="ws-day-date">{group.label}</span>
                <span className="ws-day-count">{group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="ws-task-list">
                {group.tasks.map(task => {
                  const currentStatus = statuses[task._id] ?? '';
                  const chipClass = STATUS_CLASS[currentStatus] ?? '';
                  return (
                    <div key={task._id} className="ws-task-row">
                      <div className="ws-task-left">
                        <span className="ws-task-name">{task.name}</span>
                        {task.clientName && (
                          <span className="ws-task-client">{task.clientName}</span>
                        )}
                      </div>
                      <div className="ws-task-right">
                        {task.timeSpent > 0 && (
                          <span className="ws-time">{task.timeSpent} hr{task.timeSpent !== 1 ? 's' : ''}</span>
                        )}
                        <select
                          className={`ws-status-select ${chipClass}`}
                          value={currentStatus}
                          onChange={e => updateStatus(task._id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s || '— Set status —'}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { IClient, IEodEntry } from '@/types';

interface Props {
  clients: IClient[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_OPTIONS = [
  'In the Queue',
  'In Progress',
  'Partially Update Sent',
  'Update Sent',
  'Completed',
  'Hold',
];

const STATUS_CLASS: Record<string, string> = {
  'completed':             's-completed',
  'in progress':           's-in-progress',
  'hold':                  's-hold',
  'partially update sent': 's-partial',
  'in the queue':          's-queue',
  'update sent':           's-update-sent',
};

function statusClass(s: string) {
  return STATUS_CLASS[(s ?? '').toLowerCase()] ?? '';
}

function fmtDate(iso: string) {
  const d = iso.includes('T') ? new Date(iso) : new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

type GroupedClient = { name: string; entries: IEodEntry[] };

const EMPTY_FORM = {
  taskName: '',
  clientId: '',
  date: new Date().toISOString().split('T')[0],
  timeSpent: '',
  status: '',
};

export default function EodTab({ clients }: Props) {
  const now = new Date();
  const [clientId, setClientId] = useState('all');
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [entries, setEntries] = useState<IEodEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Send form
  const [subject, setSubject] = useState('');
  const [recipients, setRecipients] = useState('');
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const years = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - i));

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (clientId !== 'all') params.set('clientId', clientId);
      if (month !== 'all') params.set('month', month);
      if (year !== 'all') params.set('year', year);
      const res = await fetch(`/api/eod?${params}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [clientId, month, year]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    const monthLabel = month !== 'all' ? MONTHS[parseInt(month) - 1] : 'All months';
    const yearLabel  = year !== 'all' ? year : '';
    setSubject(`EOD Report — ${monthLabel}${yearLabel ? ' ' + yearLabel : ''}`);
  }, [month, year]);

  // Group by client
  const grouped = entries.reduce<Record<string, GroupedClient>>((acc, e) => {
    const key   = e.clientId ?? 'no-client';
    const label = e.clientName || 'No client';
    if (!acc[key]) acc[key] = { name: label, entries: [] };
    acc[key].entries.push(e);
    return acc;
  }, {});

  const totalHours = entries.reduce((s, e) => s + (e.timeSpent || 0), 0);

  const handleAdd = async () => {
    if (!form.taskName.trim()) { setAddError('Task name is required'); return; }
    setAdding(true);
    setAddError('');
    try {
      const selectedClient = clients.find(c => c._id === form.clientId);
      const res = await fetch('/api/eod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskName:   form.taskName.trim(),
          clientId:   form.clientId || null,
          clientName: selectedClient?.name || '',
          date:       form.date,
          timeSpent:  form.timeSpent,
          status:     form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? 'Failed to add'); return; }
      setEntries(prev => [data, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/eod/${id}`, { method: 'DELETE' });
    setEntries(prev => prev.filter(e => e._id !== id));
  };

  const handleSend = async () => {
    if (!subject.trim() || !recipients.trim()) return;
    setSending(true);
    setSendMsg(null);
    try {
      const res = await fetch('/api/eod/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, recipients, clientId, month, year }),
      });
      const data = await res.json();
      setSendMsg(res.ok
        ? { ok: true,  text: `Sent to ${data.sentTo?.join(', ') ?? recipients}` }
        : { ok: false, text: data.error ?? 'Failed to send' }
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="eod-wrap">

      {/* ── Filters + Add button ── */}
      <div className="eod-top-bar">
        <div className="eod-filters">
          <select className="eod-select" value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="all">All clients</option>
            {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="eod-select" value={month} onChange={e => setMonth(e.target.value)}>
            <option value="all">All months</option>
            {MONTHS.map((m, i) => <option key={i + 1} value={String(i + 1)}>{m}</option>)}
          </select>
          <select className="eod-select" value={year} onChange={e => setYear(e.target.value)}>
            <option value="all">All years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button className="eod-add-btn" onClick={() => { setShowForm(v => !v); setAddError(''); }}>
          {showForm ? '✕ Cancel' : '+ Add Entry'}
        </button>
      </div>

      {/* ── Manual add form ── */}
      {showForm && (
        <div className="eod-form-card">
          <p className="eod-form-title">Add EOD Entry</p>
          <div className="eod-form-grid">
            <div className="eod-form-field eod-form-field--wide">
              <label>Task name</label>
              <input
                className="eod-finput"
                placeholder="Task name"
                value={form.taskName}
                onChange={e => setForm(f => ({ ...f, taskName: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="eod-form-field">
              <label>Client</label>
              <select className="eod-finput" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                <option value="">No client</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="eod-form-field">
              <label>Date</label>
              <input
                type="date"
                className="eod-finput"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="eod-form-field">
              <label>Time (hrs)</label>
              <input
                type="number"
                className="eod-finput"
                placeholder="e.g. 2"
                min="0"
                step="0.5"
                value={form.timeSpent}
                onChange={e => setForm(f => ({ ...f, timeSpent: e.target.value }))}
              />
            </div>
            <div className="eod-form-field">
              <label>Status</label>
              <select className="eod-finput" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="">— Status —</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {addError && <p className="eod-form-error">{addError}</p>}
          <div className="eod-form-actions">
            <button className="eod-form-save" onClick={handleAdd} disabled={adding}>
              {adding ? 'Adding…' : 'Add Entry'}
            </button>
            <button className="eod-form-cancel" onClick={() => { setShowForm(false); setAddError(''); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="eod-summary-row">
        <div className="eod-stat-card">
          <span className="eod-stat-value">{entries.length}</span>
          <span className="eod-stat-label">Total tasks</span>
        </div>
        <div className="eod-stat-card">
          <span className="eod-stat-value">{totalHours > 0 ? `${totalHours}h` : '—'}</span>
          <span className="eod-stat-label">Total hours</span>
        </div>
        <div className="eod-stat-card">
          <span className="eod-stat-value">{Object.keys(grouped).length}</span>
          <span className="eod-stat-label">Clients</span>
        </div>
      </div>

      {/* ── Send EOD Report ── */}
      <div className="eod-send-box">
        <p className="eod-send-title">Send EOD Report via Email</p>
        <div className="eod-send-row">
          <input className="eod-input" placeholder="Mail subject" value={subject} onChange={e => setSubject(e.target.value)} />
          <input className="eod-input" placeholder="Recipient email(s), comma-separated" value={recipients} onChange={e => setRecipients(e.target.value)} />
          <button
            className="eod-send-btn"
            onClick={handleSend}
            disabled={sending || !subject.trim() || !recipients.trim() || entries.length === 0}
          >
            {sending ? 'Sending…' : '✉ Send Report'}
          </button>
        </div>
        {sendMsg && <p className={`eod-send-msg ${sendMsg.ok ? 'ok' : 'err'}`}>{sendMsg.text}</p>}
      </div>

      {/* ── Client-grouped entries ── */}
      {loading ? (
        <div className="empty">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="empty">No EOD entries found for the selected filters.</div>
      ) : (
        <div className="eod-groups">
          {Object.entries(grouped).map(([key, group]) => (
            <div key={key} className="eod-client-group">
              <div className="eod-client-header">
                <span className="eod-client-name">{group.name}</span>
                <span className="eod-client-count">{group.entries.length} task{group.entries.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="eod-table-wrap">
                <table className="eod-table">
                  <thead>
                    <tr>
                      <th>Task name</th>
                      <th>Status</th>
                      <th>Time</th>
                      <th>Date</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {group.entries.map(e => (
                      <tr key={e._id}>
                        <td className="eod-td-task">
                          {e.taskName}
                          {e.isManual && <span className="eod-manual-badge">manual</span>}
                        </td>
                        <td>
                          {e.status
                            ? <span className={`eod-status-badge ${statusClass(e.status)}`}>{e.status}</span>
                            : <span className="eod-no-val">—</span>}
                        </td>
                        <td className="eod-td-time">{e.timeSpent ? `${e.timeSpent}h` : '—'}</td>
                        <td className="eod-td-date">{fmtDate(e.date)}</td>
                        <td className="eod-td-del">
                          <button
                            className="eod-del-btn"
                            onClick={() => handleDelete(e._id)}
                            title="Delete this entry"
                          >×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

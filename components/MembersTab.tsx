'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { IClient, IMember } from '@/types';
import Avatar from './Avatar';

interface Props {
  members: IMember[];
  clients: IClient[];
  onAdd: (name: string, role: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onUpdateClients: (memberId: string, clientIds: string[]) => Promise<void>;
  onUpdatePhoto: (memberId: string, photo: string) => Promise<void>;
}

export default function MembersTab({
  members,
  clients,
  onAdd,
  onRemove,
  onUpdateClients,
  onUpdatePhoto,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const handleSendTasks = async (memberId: string, memberName: string, email?: string) => {
    if (!email) {
      alert(`${memberName} has no email address. Please add one in their profile first.`);
      return;
    }
    setSending(memberId);
    const res = await fetch(`/api/members/${memberId}/send-tasks`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      alert(`Task list sent to ${data.sentTo} ✓`);
    } else {
      alert('Failed to send: ' + data.error);
    }
    setSending(null);
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onAdd(name.trim(), role.trim());
    setName('');
    setRole('');
    setLoading(false);
  };

  const handlePhotoUpload = (memberId: string) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.addEventListener('change', () => {
      const file = inp.files?.[0];
      if (!file) { document.body.removeChild(inp); return; }
      const reader = new FileReader();
      reader.onload = ev => {
        const result = ev.target?.result as string;
        if (result) onUpdatePhoto(memberId, result);
        document.body.removeChild(inp);
      };
      reader.readAsDataURL(file);
    });
    inp.click();
  };

  const toggleClientAssign = async (
    memberId: string,
    currentIds: string[],
    clientId: string,
    checked: boolean
  ) => {
    const newIds = checked
      ? [...currentIds, clientId]
      : currentIds.filter(id => id !== clientId);
    await onUpdateClients(memberId, newIds);
  };

  const toggleAllClients = async (memberId: string, checked: boolean) => {
    await onUpdateClients(memberId, checked ? clients.map(c => c._id) : []);
  };

  return (
    <div>
      <div className="section-title">Team members</div>
      <div className="card">
        <div className="row">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Member name"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="Role (optional)"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button className="primary" onClick={handleAdd} disabled={loading}>
            + Add
          </button>
        </div>
      </div>

      {!members.length ? (
        <div className="empty">No team members yet. Add one above.</div>
      ) : (
        members.map((m, i) => {
          const allChecked =
            clients.length > 0 && clients.every(c => m.clientIds.includes(c._id));
          return (
            <div key={m._id} className="card">
              <div
                className="list-item"
                style={{
                  padding: `0 0 ${clients.length ? '10px' : '0'} 0`,
                  borderBottom: clients.length ? '0.5px solid var(--border)' : 'none',
                }}
              >
                <Avatar
                  member={m}
                  index={i}
                  onClick={() => handlePhotoUpload(m._id)}
                />
                <div className="meta">
                  <div className="meta-name">{m.name}</div>
                  {m.role && <div className="meta-sub">{m.role}</div>}
                </div>
                <button onClick={() => router.push(`/team-members/${m._id}`)}>
                  View Profile
                </button>
                <button onClick={() => router.push(`/team-members/${m._id}/work-status`)}>
                  Work Status
                </button>
                <button
                  className="send-tasks-btn"
                  onClick={() => handleSendTasks(m._id, m.name, m.email)}
                  disabled={sending === m._id}
                  title={m.email ? `Send tasks to ${m.email}` : 'No email set — add in profile'}
                >
                  {sending === m._id ? 'Sending…' : '✉ Send Tasks'}
                </button>
                <button className="danger" onClick={() => onRemove(m._id)}>
                  Remove
                </button>
              </div>

              {clients.length > 0 && (
                <div className="ac-section">
                  <div className="ac-section-header">Assigned clients</div>

                  {/* Select all — full width, above the grid */}
                  <label className="ac-item ac-item--all">
                    <input
                      type="checkbox"
                      className="ac-cb"
                      checked={allChecked}
                      onChange={e => toggleAllClients(m._id, e.target.checked)}
                    />
                    <span>All clients</span>
                  </label>

                  {/* 2-column grid of individual clients */}
                  <div className="ac-grid">
                    {clients.map(c => (
                      <label key={c._id} className="ac-item">
                        <input
                          type="checkbox"
                          className="ac-cb"
                          checked={m.clientIds.includes(c._id)}
                          onChange={e =>
                            toggleClientAssign(m._id, m.clientIds, c._id, e.target.checked)
                          }
                        />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

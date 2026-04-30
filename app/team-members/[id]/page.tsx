'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { IMember } from '@/types';
import { cc, initials } from '@/lib/utils';

const BASIC_FIELDS: { label: string; key: keyof IMember; placeholder: string }[] = [
  { label: 'Email',            key: 'email',          placeholder: 'email@example.com' },
  { label: 'Contact',          key: 'contact',        placeholder: '10-digit number' },
  { label: 'Experience',       key: 'experience',     placeholder: 'e.g. 3 years' },
  { label: 'Telegram ID',      key: 'telegram',       placeholder: '@username' },
  { label: 'Telegram Chat ID', key: 'telegramChatId', placeholder: 'Numeric ID — get from @userinfobot' },
];

const SKILL_OPTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue.js', 'Angular',
  'Node.js', 'Express', 'Python', 'Django', 'PHP', 'Laravel',
  'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'GraphQL', 'REST API',
  'HTML/CSS', 'Tailwind CSS', 'Bootstrap', 'Flutter', 'React Native',
  'Swift', 'Kotlin', 'Java', 'C#', '.NET', 'Docker', 'AWS', 'Git',
  'DevOps', 'CI/CD', 'WordPress', 'Shopify', 'SEO', 'UI/UX Design',
  'Figma', 'Project Management', 'Digital Marketing',
];

type FormState = { name: string; role: string; email: string; contact: string; experience: string; telegram: string; telegramChatId: string; };

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [member, setMember] = useState<IMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({ name: '', role: '', email: '', contact: '', experience: '', telegram: '', telegramChatId: '' });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillSelect, setSkillSelect] = useState('');
  const [skillCustom, setSkillCustom] = useState('');

  const toForm = (m: IMember): FormState => ({
    name: m.name || '', role: m.role || '',
    email: m.email || '', contact: m.contact || '',
    experience: m.experience || '', telegram: m.telegram || '',
    telegramChatId: m.telegramChatId || '',
  });

  const fetchMember = useCallback(async () => {
    const res = await fetch(`/api/members/${id}`);
    if (res.ok) {
      const data: IMember = await res.json();
      setMember(data);
      setForm(toForm(data));
      setSkills(data.skills ?? []);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchMember(); }, [fetchMember]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, skills }),
      });
      if (res.ok) {
        const updated: IMember = await res.json();
        setMember(updated);
        setForm(toForm(updated));
        setSkills(updated.skills ?? []);
        setEditing(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Save failed: ' + (err.error ?? res.status));
      }
    } catch (e) {
      alert('Save failed: ' + e);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    if (member) { setForm(toForm(member)); setSkills(member.skills ?? []); }
    setEditing(false);
  };

  const handlePhoto = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
    document.body.appendChild(inp);
    inp.addEventListener('change', () => {
      const file = inp.files?.[0];
      if (!file) { document.body.removeChild(inp); return; }
      const reader = new FileReader();
      reader.onload = async ev => {
        const photo = ev.target?.result as string;
        if (photo) {
          await fetch(`/api/members/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo }),
          });
          fetchMember();
        }
        document.body.removeChild(inp);
      };
      reader.readAsDataURL(file);
    });
    inp.click();
  };

  const addFromSelect = () => {
    if (!skillSelect || skills.includes(skillSelect)) return;
    setSkills(prev => [...prev, skillSelect]);
    setSkillSelect('');
  };

  const addCustomSkill = () => {
    const s = skillCustom.trim();
    if (!s || skills.includes(s)) { setSkillCustom(''); return; }
    setSkills(prev => [...prev, s]);
    setSkillCustom('');
  };

  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s));

  if (loading) return <div className="wrap"><div className="empty">Loading…</div></div>;
  if (!member)  return <div className="wrap"><div className="empty">Member not found.</div></div>;

  const col = cc(0);

  return (
    <div className="wrap">

      <div className="mp-top-nav">
        <button className="mp-back" onClick={() => router.back()}>← Back</button>
        <button className="mp-back" onClick={() => router.push(`/team-members/${id}/work-status`)}>Work Status →</button>
      </div>

      <div className="mp-card">

        {/* ── Header ── */}
        <div className="mp-header">
          <div className="mp-avatar-wrap" onClick={handlePhoto} title="Click to change photo">
            {member.photo
              ? <img src={member.photo} alt={member.name} className="mp-avatar-img" />
              : <div className="mp-avatar-initials" style={{ background: col.bg, color: col.color }}>{initials(member.name)}</div>
            }
            <div className="mp-avatar-overlay">📷</div>
          </div>

          <div className="mp-header-info">
            {editing
              ? <>
                  <input className="mp-name-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                  <input className="mp-role-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Designation / Role" />
                </>
              : <>
                  <h2 className="mp-name">{member.name}</h2>
                  <p className="mp-role">{member.role || <span className="mp-dash">No designation set</span>}</p>
                </>
            }
          </div>

          <div className="mp-header-actions">
            {editing
              ? <>
                  <button className="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                  <button onClick={handleCancel}>Cancel</button>
                </>
              : <button onClick={() => setEditing(true)}>Edit Profile</button>
            }
          </div>
        </div>

        {/* ── Basic Info ── */}
        <div className="mp-section">
          <div className="mp-section-title">Basic Information</div>
          <div className="mp-fields-grid">
            {BASIC_FIELDS.map(({ label, key, placeholder }) => (
              <div key={key} className="mp-field">
                <span className="mp-field-label">{label}</span>
                {editing
                  ? <input
                      className="mp-field-input"
                      value={form[key as keyof FormState] ?? ''}
                      onChange={e => {
                        let val = e.target.value;
                        if (key === 'contact') val = val.replace(/\D/g, '').slice(0, 10);
                        setForm(f => ({ ...f, [key]: val }));
                      }}
                      placeholder={placeholder}
                      inputMode={key === 'contact' ? 'numeric' : undefined}
                    />
                  : <span className="mp-field-value">
                      {(member[key] as string) || <span className="mp-dash">—</span>}
                    </span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* ── Skills ── */}
        <div className="mp-section">
          <div className="mp-section-title">Skills</div>

          {skills.length > 0 && (
            <div className="mp-skills-list">
              {skills.map(s => (
                <span key={s} className="mp-skill-chip">
                  {s}
                  {editing && <button className="mp-skill-remove" onClick={() => removeSkill(s)}>×</button>}
                </span>
              ))}
            </div>
          )}

          {editing && (
            <div className="mp-skills-inputs">
              <div className="mp-skills-add">
                <select
                  className="mp-skill-select"
                  value={skillSelect}
                  onChange={e => setSkillSelect(e.target.value)}
                >
                  <option value="">— Select a skill —</option>
                  {SKILL_OPTIONS.filter(s => !skills.includes(s)).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button onClick={addFromSelect} disabled={!skillSelect}>+ Add</button>
              </div>
              <div className="mp-skills-add">
                <input
                  className="mp-skill-custom-input"
                  value={skillCustom}
                  onChange={e => setSkillCustom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomSkill()}
                  placeholder="Custom skill (e.g. Blender, AutoCAD…)"
                />
                <button onClick={addCustomSkill}>+ Add</button>
              </div>
            </div>
          )}

          {!editing && skills.length === 0 && (
            <p className="mp-dash" style={{ fontSize: 13 }}>No skills added. Click "Edit Profile" to add skills.</p>
          )}
        </div>

      </div>
    </div>
  );
}

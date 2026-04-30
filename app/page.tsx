'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ClientsTab from '@/components/ClientsTab';
import MembersTab from '@/components/MembersTab';
import TasksTab from '@/components/TasksTab';
import DistributionTab from '@/components/DistributionTab';
import PlansTab from '@/components/PlansTab';
import TemplatesTab from '@/components/TemplatesTab';
import EodTab from '@/components/EodTab';
import type { IClient, IMember, ITask, ICategory, ClientPlan, TaskVolume } from '@/types';

type TabName = 'clients' | 'members' | 'tasks' | 'distribute' | 'plans' | 'templates' | 'eod';

const TABS: { id: TabName; label: string }[] = [
  { id: 'clients', label: 'Clients' },
  { id: 'members', label: 'Team members' },
  { id: 'tasks', label: 'Daily tasks' },
  { id: 'distribute', label: 'Distribution' },
  { id: 'plans', label: 'Plans' },
  { id: 'templates', label: 'Templates' },
  { id: 'eod', label: "Client's EOD" },
];

const TAB_IDS = TABS.map(t => t.id);

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabName>('clients');
  const [isDark, setIsDark] = useState(false);
  const [clients, setClients] = useState<IClient[]>([]);
  const [members, setMembers] = useState<IMember[]>([]);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('activeTab') as TabName | null;
    if (saved && TAB_IDS.includes(saved)) setActiveTab(saved);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(saved ? saved === 'dark' : systemDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const fetchAll = useCallback(async () => {
    try {
      const [c, m, t, cats] = await Promise.all([
        fetch('/api/clients').then(r => r.json()),
        fetch('/api/members').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
      ]);
      setClients(Array.isArray(c) ? c : []);
      setMembers(Array.isArray(m) ? m : []);
      setTasks(Array.isArray(t) ? t : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch {
      setError('Failed to load data. Is the server running and MONGODB_URI set?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ---- Clients ---- */
  const addClient = async (name: string, plan: string) => {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, plan }),
    });
    const client = await res.json();
    setClients(prev => [...prev, client]);
  };

  const updateClient = async (id: string, name: string, plan: string) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, plan }),
    });
    const updated = await res.json();
    setClients(prev => prev.map(c => (c._id === id ? updated : c)));
  };

  const removeClient = async (id: string) => {
    await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    setClients(prev => prev.filter(c => c._id !== id));
    setMembers(prev =>
      prev.map(m => ({ ...m, clientIds: m.clientIds.filter(cid => cid !== id) }))
    );
  };

  const updateClientPlan = async (id: string, plan: ClientPlan) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const updated = await res.json();
    setClients(prev => prev.map(c => (c._id === id ? updated : c)));
  };

  const updateTaskVolume = async (id: string, taskVolume: TaskVolume) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskVolume }),
    });
    const updated = await res.json();
    setClients(prev => prev.map(c => (c._id === id ? updated : c)));
  };

  const updateClientNotes = async (id: string, notes: string) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    const updated = await res.json();
    setClients(prev => prev.map(c => (c._id === id ? updated : c)));
  };

  /* ---- Members ---- */
  const addMember = async (name: string, role: string) => {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role }),
    });
    const member = await res.json();
    setMembers(prev => [...prev, member]);
  };

  const removeMember = async (id: string) => {
    await fetch(`/api/members/${id}`, { method: 'DELETE' });
    setMembers(prev => prev.filter(m => m._id !== id));
  };

  const updateMemberClients = async (memberId: string, clientIds: string[]) => {
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientIds }),
    });
    const updated = await res.json();
    setMembers(prev => prev.map(m => (m._id === memberId ? updated : m)));
  };

  const updateMemberPhoto = async (memberId: string, photo: string) => {
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo }),
    });
    const updated = await res.json();
    setMembers(prev => prev.map(m => (m._id === memberId ? updated : m)));
  };

  const updateMemberShift = async (memberId: string, isNightShift: boolean) => {
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isNightShift }),
    });
    const updated = await res.json();
    setMembers(prev => prev.map(m => (m._id === memberId ? updated : m)));
  };

  /* ---- Tasks ---- */
  const addTask = async (name: string, clientId: string | null) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, clientId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to create task');
    setTasks(prev => [...prev, data]);
  };

  const removeTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t._id !== id));
  };


  const updateTaskTime = async (id: string, hours: number) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeSpent: hours }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setTasks(prev => prev.map(t => (t._id === id ? updated : t)));
  };

  const updateTaskStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setTasks(prev => prev.map(t => (t._id === id ? updated : t)));
  };

  /* ---- Auth ---- */
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  /* ---- Categories & Templates ---- */
  const addCategory = async (name: string) => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const cat = await res.json();
    setCategories(prev => [...prev, cat]);
  };

  const updateCategory = async (id: string, name: string) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const updated = await res.json();
    setCategories(prev => prev.map(c => (c._id === id ? updated : c)));
  };

  const removeCategory = async (id: string) => {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    setCategories(prev => prev.filter(c => c._id !== id));
  };

  const addTemplate = async (catId: string, name: string, description: string) => {
    const res = await fetch(`/api/categories/${catId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addTemplate: { name, description } }),
    });
    const updated = await res.json();
    setCategories(prev => prev.map(c => (c._id === catId ? updated : c)));
  };

  const updateTemplate = async (catId: string, tmplId: string, name: string, description: string) => {
    const res = await fetch(`/api/categories/${catId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editTemplate: { id: tmplId, name, description } }),
    });
    const updated = await res.json();
    setCategories(prev => prev.map(c => (c._id === catId ? updated : c)));
  };

  const removeTemplate = async (catId: string, tmplId: string) => {
    const res = await fetch(`/api/categories/${catId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeTemplate: tmplId }),
    });
    const updated = await res.json();
    setCategories(prev => prev.map(c => (c._id === catId ? updated : c)));
  };

  if (loading) {
    return (
      <div className="wrap">
        <div className="empty">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrap">
        <div className="empty" style={{ color: 'var(--danger-text)' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="dash-header">
        <div style={{ margin: 0 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{process.env.NEXT_PUBLIC_TEAM_NAME ?? "Sayantani's Team"}</h1>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Task Manager</span>
        </div>
        <div className="dash-header-right">
          <button className="theme-toggle" onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDark ? '🌞' : '🌙'}
          </button>
          <button onClick={handleLogout} className="logout-btn">Sign out</button>
        </div>
      </div>
      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => { setActiveTab(tab.id); localStorage.setItem('activeTab', tab.id); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'clients' && (
        <ClientsTab
          clients={clients}
          members={members}
          onAdd={addClient}
          onUpdate={updateClient}
          onRemove={removeClient}
        />
      )}
      {activeTab === 'members' && (
        <MembersTab
          members={members}
          clients={clients}
          onAdd={addMember}
          onRemove={removeMember}
          onUpdateClients={updateMemberClients}
          onUpdatePhoto={updateMemberPhoto}
          onUpdateShift={updateMemberShift}
        />
      )}
      {activeTab === 'tasks' && (
        <TasksTab
          tasks={tasks}
          clients={clients}
          onAdd={addTask}
          onRemove={removeTask}
          onUpdateTime={updateTaskTime}
          onUpdateStatus={updateTaskStatus}
        />
      )}
      {activeTab === 'distribute' && (
        <DistributionTab clients={clients} members={members} tasks={tasks} />
      )}
      {activeTab === 'plans' && (
        <PlansTab clients={clients} onUpdatePlan={updateClientPlan} onUpdateTaskVolume={updateTaskVolume} onUpdateNotes={updateClientNotes} />
      )}
      {activeTab === 'templates' && (
        <TemplatesTab
          categories={categories}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onRemoveCategory={removeCategory}
          onAddTemplate={addTemplate}
          onUpdateTemplate={updateTemplate}
          onRemoveTemplate={removeTemplate}
        />
      )}
      {activeTab === 'eod' && (
        <EodTab clients={clients} />
      )}
    </div>
  );
}

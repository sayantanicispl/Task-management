export type ClientPlan = 'part-time' | 'full-time' | 'maintenance' | '';
export type TaskVolume = 'low' | 'medium' | 'high' | '';

export interface IClient {
  _id: string;
  name: string;
  project: string;
  plan: ClientPlan;
  taskVolume: TaskVolume;
  notes?: string;
}

export interface IMember {
  _id: string;
  name: string;
  role: string;
  clientIds: string[];
  photo: string | null;
  email?: string;
  contact?: string;
  experience?: string;
  telegram?: string;
  telegramChatId?: string;
  skills?: string[];
  isNightShift?: boolean;
}

export interface ITask {
  _id: string;
  name: string;
  clientId: string | null;
  done: boolean;
  timeSpent: number;
  status: string;
  assignedTo?: string | null;
  createdAt?: string;
}

export interface IEodEntry {
  _id: string;
  taskId: string;
  taskName: string;
  clientId: string | null;
  clientName: string;
  date: string;
  timeSpent: number;
  status: string;
  isManual?: boolean;
}

export interface ITemplate {
  _id: string;
  name: string;
  description: string;
}

export interface ICategory {
  _id: string;
  name: string;
  templates: ITemplate[];
}

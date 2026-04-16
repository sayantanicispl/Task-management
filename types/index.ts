export type ClientPlan = 'part-time' | 'full-time' | 'maintenance' | '';

export interface IClient {
  _id: string;
  name: string;
  project: string;
  plan: ClientPlan;
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
  skills?: string[];
}

export interface ITask {
  _id: string;
  name: string;
  clientId: string | null;
  done: boolean;
  timeSpent: number;
  status: string;
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

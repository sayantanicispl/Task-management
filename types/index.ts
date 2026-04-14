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
}

export interface ITask {
  _id: string;
  name: string;
  clientId: string | null;
  done: boolean;
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

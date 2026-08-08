import Dexie, { type Table } from 'dexie';

export type Importance = "low" | "medium" | "high";

export interface Task {
  id?: number; // Local auto-increment
  local_id: string; // NanoID/UUID for Supabase matching
  date: string;
  title: string;
  time: string | null;
  completed: boolean;
  importance: Importance;
  updated_at: number;
  deleted_at: number | null;
}

export interface Doodle {
  id?: number;
  local_id: string;
  date: string;
  iconId: string;
  label: string;
  updated_at: number;
  deleted_at: number | null;
}

export interface DayMeta {
  id?: number;
  date: string;
  mood: number;
  shadeId: string;
  updated_at: number;
}

export class DoMEDatabase extends Dexie {
  tasks!: Table<Task, number>;
  doodles!: Table<Doodle, number>;
  days!: Table<DayMeta, number>;

  constructor() {
    super('DoMEDB');
    this.version(1).stores({
      // Primary key is ++id. We index local_id and updated_at for syncing.
      tasks: '++id, local_id, date, updated_at',
      doodles: '++id, local_id, date, updated_at',
      days: '++id, date, updated_at'
    });
  }
}

export const db = new DoMEDatabase();
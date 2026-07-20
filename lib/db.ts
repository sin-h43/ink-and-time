import Dexie, { Table } from "dexie";

export type Importance = "low" | "medium" | "high";

export interface Task {
  id?: number;
  uid: string; // stable id for future Supabase sync (survives local id changes)
  date: string; // YYYY-MM-DD
  title: string;
  time: string | null; // "HH:MM" 24h, or null for an untimed to-do item
  completed: boolean;
  importance: Importance;
  updatedAt: number;
  synced: boolean; // flips true once pushed to Supabase — see lib/supabaseSync.ts
}

export interface Doodle {
  id?: number;
  uid: string;
  date: string; // YYYY-MM-DD
  iconId: string;
  label: string;
}

export class AppDB extends Dexie {
  tasks!: Table<Task, number>;
  doodles!: Table<Doodle, number>;

  constructor() {
    super("dome-db");
    this.version(1).stores({
      tasks: "++id, uid, date, completed, synced",
      doodles: "++id, uid, date",
    });
  }
}

// Single shared instance — Dexie handles connection reuse internally.
export const db = new AppDB();

import Dexie, { Table } from "dexie";

export type Importance = "low" | "medium" | "high";

export interface Task {
  id?: number;
  uid: string; // stable id for Supabase sync
  date: string; // YYYY-MM-DD
  title: string;
  time: string | null;
  completed: boolean;
  importance: Importance;
  updatedAt: number;
  synced: boolean; // flips true once pushed
  isDeleted: boolean; // Soft delete flag for offline destruction
}

export interface Doodle {
  id?: number;
  uid: string;
  date: string; // YYYY-MM-DD
  iconId: string;
  label: string;
  updatedAt: number;
  synced: boolean;
  isDeleted: boolean;
}

export interface DayMeta {
  date: string; // Primary Key: YYYY-MM-DD
  shadeId: string;
  mood: number;
  updatedAt: number;
  synced: boolean;
}

export class AppDB extends Dexie {
  tasks!: Table<Task, number>;
  doodles!: Table<Doodle, number>;
  days!: Table<DayMeta, string>;

  constructor() {
    super("dome-db");
    // Version 2 upgrade: adds 'days' table and 'isDeleted' indices
    this.version(2).stores({
      tasks: "++id, uid, date, completed, synced, isDeleted",
      doodles: "++id, uid, date, synced, isDeleted",
      days: "date, synced", // Primary key is the date string
    });
  }
}

export const db = new AppDB();
"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Task, Importance } from "./db";
import { makeUid } from "./id";

const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const offsetDate = (days: number, base = new Date()) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return fmtDate(d);
};


export function useTasks() {
  // Live query automatically handles reactivity when IndexedDB updates
  const tasks = useLiveQuery(
    () => db.tasks.orderBy("date").filter(t => t.deleted_at == null).toArray(),
    [],
    []
  ) ?? [];

  const addTask = async (input: { date: string; title: string; time: string | null; importance: Importance }) => {
    await db.tasks.add({
      local_id: makeUid(),
      date: input.date,
      title: input.title,
      time: input.time,
      completed: false,
      importance: input.importance,
      updated_at: Date.now(),
      deleted_at: null,
    });
  };

  const toggleTask = async (id: number) => {
    const t = await db.tasks.get(id);
    if (!t) return;
    await db.tasks.update(id, { completed: !t.completed, updated_at: Date.now() });
  };

  const removeTask = async (id: number) => {
    const t = await db.tasks.get(id);
    if (!t) return;
    await db.tasks.update(id, { deleted_at: Date.now(), updated_at: Date.now() });
  };

  return { tasks, addTask, toggleTask, removeTask };
}
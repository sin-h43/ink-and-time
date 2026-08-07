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

async function seedIfEmpty() {
  const count = await db.tasks.count();
  if (count > 0) return;

  const titles = ["Morning walk", "Read chapter", "Journal", "Gym session", "Water plants", "Reply to emails"];
  const importances: Importance[] = ["low", "medium", "high"];
  const rows: (Omit<Task, "id"> & { local_id: string })[] = [];

  [-6, -5, -4, -3, -2, -1].forEach((off, idx) => {
    const date = offsetDate(off);
    const count = idx === 2 ? 0 : 2 + (idx % 3);
    for (let i = 0; i < count; i++) {
      rows.push({
        local_id: makeUid(),
        uid: "",
        isSynced: false,
        isDeleted: false,
        date,
        title: titles[(idx + i) % titles.length],
        time: i === 0 ? "08:00" : null,
        completed: Math.random() > (idx % 2 === 0 ? 0.25 : 0.55),
        importance: importances[(idx + i) % 3],
        updatedAt: Date.now(),
        deleted_at: null,
      });
    }
  });

  const today = fmtDate(new Date());
  rows.push(
    { local_id: makeUid(), uid: "", isSynced: false, isDeleted: false, date: today, title: "Morning walk", time: "07:00", completed: true, importance: "low", updatedAt: Date.now(), deleted_at: null },
    { local_id: makeUid(), uid: "", isSynced: false, isDeleted: false, date: today, title: "Deep work block", time: "09:30", completed: false, importance: "high", updatedAt: Date.now(), deleted_at: null },
    { local_id: makeUid(), uid: "", isSynced: false, isDeleted: false, date: today, title: "Lunch with Dana", time: "12:30", completed: false, importance: "medium", updatedAt: Date.now(), deleted_at: null },
    { local_id: makeUid(), uid: "", isSynced: false, isDeleted: false, date: today, title: "Read 20 pages", time: null, completed: false, importance: "low", updatedAt: Date.now(), deleted_at: null },
    { local_id: makeUid(), uid: "", isSynced: false, isDeleted: false, date: today, title: "Water the plants", time: null, completed: true, importance: "low", updatedAt: Date.now(), deleted_at: null },
    { local_id: makeUid(), uid: "", isSynced: false, isDeleted: false, date: today, title: "Evening journal", time: "21:00", completed: false, importance: "medium", updatedAt: Date.now(), deleted_at: null }
  );

  await db.tasks.bulkAdd(rows as Task[]);
}

export function useTasks() {
  useEffect(() => {
    seedIfEmpty();
  }, []);

  const tasks = useLiveQuery(
    () => db.tasks.orderBy("date").filter(t => t.deleted_at == null).toArray(),
    [],
    []
  ) ?? [];

  const addTask = async (input: { date: string; title: string; time: string | null; importance: Importance }) => {
    await db.tasks.add({
      uid: makeUid(),
      date: input.date,
      title: input.title,
      time: input.time,
      completed: false,
      importance: input.importance,
      updatedAt: Date.now(),
      isSynced: false,
      isDeleted: false,
      deleted_at: null,
    });
  };

  const toggleTask = async (id: number) => {
    const t = await db.tasks.get(id);
    if (!t) return;
    await db.tasks.update(id, { completed: !t.completed, updatedAt: Date.now() });
  };

  const removeTask = async (id: number) => {
    const t = await db.tasks.get(id);
    if (!t) return;
    await db.tasks.update(id, { deleted_at: Date.now(), updatedAt: Date.now() });
  };

  return { tasks, addTask, toggleTask, removeTask };
}
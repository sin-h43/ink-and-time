"use client";

import { useEffect, useState } from "react";
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

// First-run demo data so the app isn't an empty shell on a fresh install.
// Runs once — if the tasks table already has rows, this is a no-op.
async function seedIfEmpty() {
  const count = await db.tasks.count();
  if (count > 0) return;

  const titles = ["Morning walk", "Read chapter", "Journal", "Gym session", "Water plants", "Reply to emails"];
  const importances: Importance[] = ["low", "medium", "high"];
  const rows: Omit<Task, "id">[] = [];

  [-6, -5, -4, -3, -2, -1].forEach((off, idx) => {
    const date = offsetDate(off);
    const count = idx === 2 ? 0 : 2 + (idx % 3); // one rest day, on purpose
    for (let i = 0; i < count; i++) {
      rows.push({
        uid: makeUid(),
        date,
        title: titles[(idx + i) % titles.length],
        time: i === 0 ? "08:00" : null,
        completed: Math.random() > (idx % 2 === 0 ? 0.25 : 0.55),
        importance: importances[(idx + i) % 3],
        updatedAt: Date.now(),
        synced: false,
      });
    }
  });

  const today = fmtDate(new Date());
  rows.push(
    { uid: makeUid(), date: today, title: "Morning walk", time: "07:00", completed: true, importance: "low", updatedAt: Date.now(), synced: false },
    { uid: makeUid(), date: today, title: "Deep work block", time: "09:30", completed: false, importance: "high", updatedAt: Date.now(), synced: false },
    { uid: makeUid(), date: today, title: "Lunch with Dana", time: "12:30", completed: false, importance: "medium", updatedAt: Date.now(), synced: false },
    { uid: makeUid(), date: today, title: "Read 20 pages", time: null, completed: false, importance: "low", updatedAt: Date.now(), synced: false },
    { uid: makeUid(), date: today, title: "Water the plants", time: null, completed: true, importance: "low", updatedAt: Date.now(), synced: false },
    { uid: makeUid(), date: today, title: "Evening journal", time: "21:00", completed: false, importance: "medium", updatedAt: Date.now(), synced: false }
  );

  await db.tasks.bulkAdd(rows as Task[]);
}

export function useTasks() {
  useEffect(() => {
    seedIfEmpty();
  }, []);

  // Live-reactive: any write below re-renders every component using this hook, instantly.
  const tasks = useLiveQuery(() => db.tasks.orderBy("date").toArray(), [], []) ?? [];

  const addTask = async (input: { date: string; title: string; time: string | null; importance: Importance }) => {
    // Optimistic, zero-latency write — this resolves against IndexedDB directly,
    // no network round trip. Background sync (lib/supabaseSync.ts) picks it up later.
    await db.tasks.add({
      uid: makeUid(),
      date: input.date,
      title: input.title,
      time: input.time,
      completed: false,
      importance: input.importance,
      updatedAt: Date.now(),
      synced: false,
    });
  };

  const toggleTask = async (id: number) => {
    const t = await db.tasks.get(id);
    if (!t) return;
    await db.tasks.update(id, { completed: !t.completed, updatedAt: Date.now(), synced: false });
  };

  return { tasks, addTask, toggleTask };
}

"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, Doodle } from "./db";
import { makeUid } from "./id";

export function useDoodles() {
  const doodles = useLiveQuery(
    () => db.doodles.filter(d => d.deleted_at == null).toArray(),
    [],
    []
  ) ?? [];

  const addDoodle = async (date: string, iconId: string, label: string) => {
    await db.doodles.add({
      local_id: makeUid(),
      date,
      iconId,
      label,
      updated_at: Date.now(),
      deleted_at: null,
    });
  };

  const removeDoodle = async (id: number) => {
    const d = await db.doodles.get(id);
    if (!d) return;
    await db.doodles.update(id, { deleted_at: Date.now(), updated_at: Date.now() });
  };

  const doodleMap = doodles.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, Doodle[]>);

  return { doodleMap, addDoodle, removeDoodle };
}
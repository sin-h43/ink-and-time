"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { makeUid } from "./id";

export function useDoodles() {
  const doodles = useLiveQuery(() => db.doodles.toArray(), [], []) ?? [];

  const doodleMap: Record<string, { id: number; iconId: string; label: string }[]> = {};
  for (const d of doodles) {
    if (d.id === undefined) continue;
    (doodleMap[d.date] ||= []).push({ id: d.id, iconId: d.iconId, label: d.label });
  }

  const addDoodle = async (date: string, iconId: string, label: string) => {
    await db.doodles.add({ uid: makeUid(), date, iconId, label });
  };

  const removeDoodle = async (id: number) => {
    await db.doodles.delete(id);
  };

  return { doodleMap, addDoodle, removeDoodle };
}

"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, Doodle } from "./db";
import { makeUid } from "./id";

export function useDoodles() {
  // Live-reactive: filters out soft-deleted doodles instantly
  const doodles = useLiveQuery(
    () => db.doodles.filter(d => !d.isDeleted).toArray(),
    [],
    []
  ) ?? [];

  const addDoodle = async (date: string, iconId: string, label: string) => {
    await db.doodles.add({
      uid: makeUid(),
      date,
      iconId,
      label,
      updatedAt: Date.now(),
      synced: false,
      isDeleted: false, // Required for v2 schema
    });
  };

  const removeDoodle = async (id: number) => {
    const d = await db.doodles.get(id);
    if (!d) return;
    // Soft delete mutation for Supabase sync compatibility
    await db.doodles.update(id, { isDeleted: true, updatedAt: Date.now(), synced: false });
  };

  // Transformation layer: Groups doodles by date for O(1) Calendar UI lookups
  const doodleMap = doodles.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, Doodle[]>);

  return { doodleMap, addDoodle, removeDoodle };
}
"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, DayMeta } from "./db";

export function useDays() {
  const rawDays = useLiveQuery(() => db.days.toArray(), [], []) ?? [];

  const dayMap = rawDays.reduce((acc, curr) => {
    acc[curr.date] = curr;
    return acc;
  }, {} as Record<string, DayMeta>);

  const updateShade = async (date: string, shadeId: string) => {
    const existing = await db.days.where("date").equals(date).first();
    if (existing) {
      await db.days.update(existing.id!, { shadeId, updated_at: Date.now() });
    } else {
      await db.days.add({ date, shadeId, mood: 0, updated_at: Date.now() });
    }
  };

  const updateMood = async (date: string, mood: number) => {
    const existing = await db.days.where("date").equals(date).first();
    if (existing) {
      await db.days.update(existing.id!, { mood, updated_at: Date.now() });
    } else {
      await db.days.add({ date, shadeId: "paper", mood, updated_at: Date.now() });
    }
  };

  return { dayMap, updateShade, updateMood };
}
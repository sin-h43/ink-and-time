"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, DayMeta } from "./db";

export function useDays() {
  // Fetch all day metadata (shades and moods)
  const rawDays = useLiveQuery(() => db.days.toArray(), [], []) ?? [];

  // Transformation layer: Maps by date for O(1) lookups in TodayView and CalendarView
  const dayMap = rawDays.reduce((acc, curr) => {
    acc[curr.date] = curr;
    return acc;
  }, {} as Record<string, DayMeta>);

  // Upsert pattern: Updates existing record or creates a new one if it doesn't exist
  const updateShade = async (date: string, shadeId: string) => {
    const existing = await db.days.get(date);
    if (existing) {
      await db.days.update(date, { shadeId, updatedAt: Date.now(), synced: false });
    } else {
      await db.days.add({ date, shadeId, mood: 0, updatedAt: Date.now(), synced: false });
    }
  };

  const updateMood = async (date: string, mood: number) => {
    const existing = await db.days.get(date);
    if (existing) {
      await db.days.update(date, { mood, updatedAt: Date.now(), synced: false });
    } else {
      // Default to "paper" if a mood is logged before a custom shade is set
      await db.days.add({ date, shadeId: "paper", mood, updatedAt: Date.now(), synced: false });
    }
  };

  return { dayMap, updateShade, updateMood };
}
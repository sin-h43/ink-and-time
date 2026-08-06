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
    const existing = await db.days.get({ date });
    if (existing) {
      await db.days.where("date").equals(date).modify({ shadeId, updated_at: Date.now() });
    } else {
      await db.days.add({ date, shadeId, mood: 0, updated_at: Date.now() });
    }
  };

  const updateMood = async (date: string, mood: number) => {
    const existing = await db.days.get({ date });
    if (existing) {
      await db.days.where("date").equals(date).modify({ mood, updated_at: Date.now() });
    } else {
      // Default to "paper" if a mood is logged before a custom shade is set
      await db.days.add({ date, shadeId: "paper", mood, updated_at: Date.now() });
    }
  };

  return { dayMap, updateShade, updateMood };
}
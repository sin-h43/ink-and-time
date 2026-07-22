"use client";

import { useState, useEffect, useRef, useMemo, useCallback, type ComponentType, type ReactNode } from "react";
import {
  Plus, Star, Play, Pause, RotateCcw, CloudRain, Waves, Music2, X, Clock,
  ChevronLeft, ChevronRight, Sparkles, AlarmClock, Coffee, BookOpen,
  Dumbbell, Milk, Laptop, UtensilsCrossed, Film, Camera, Cat, Apple,
  ShoppingBag, Moon, Mail, Phone, Users, Droplet, Footprints,
  NotebookPen, Music, Gift, Heart, Bike, ShowerHead, LucideIcon,GripHorizontal
} from "lucide-react";
import { Task, Importance,Doodle, DayMeta } from "@/lib/db";
import { useTasks } from "@/lib/useTasks";
import { useDoodles } from "@/lib/useDoodles";
import { useDays } from "@/lib/useDays";
import ReactPlayer from "react-player";
import Draggable, { type DraggableProps } from "react-draggable";


/* ---------------------------------- Tokens --------------------------------- */
const C = {
  paper: "#FFFDF8",
  page: "#FEFCF6",
  ink: "#2E2B24",
  inkSoft: "#6B6558",
  navy: "#2B3A5C",
  navySoft: "#54628A",
  line: "#DDD5C2",
  lineSoft: "#EBE4D4",
  gridLine: "rgba(190, 175, 140, 0.16)",
  pink0: "#F3D9DD",
  pink1: "#E8AEBB",
  pink2: "#D97690",
  pink3: "#B54F70",
  pink4: "#b53a62",
  gold: "#C69A55",
};

const YOUTUBE_STREAMS = [
  {id: "lofi", label: "Lo-fi ", url: "https://youtu.be/l-2hOKIrIyI?si=YbT_AmuEbjS2capt" },
{ id: "synth", label: "Synthwave", url: "https://www.youtube.com/watch?v=4xDzrUhVKVA" },
  { id: "coffee", label: "Jazz Cafe", url: "https://www.youtube.com/watch?v=c0_ejQQcrwI" },
  { id: "ghibli", label: "Studio Ghibli", url: "https://www.youtube.com/watch?v=WJ3-F02-F_Y" },
  { id: "rain", label: "City Rain", url: "https://www.youtube.com/watch?v=mPZkdNFkNps" },
  { id: "fireplace", label: "Fireplace", url: "https://www.youtube.com/watch?v=L_LUpnjgPso" },
  { id: "brown", label: "Brown Noise", url: "https://www.youtube.com/watch?v=RqzGzwTY-6w" },
  { id: "space", label: "Deep Space", url: "https://www.youtube.com/watch?v=1s98E01T8kY" },]

type StreamId = (typeof YOUTUBE_STREAMS)[number]["id"];

const HAND = "'Patrick Hand', cursive";
const DISPLAY = "'Caveat', cursive";
// react-draggable 4.7's declaration exposes its optional runtime props as required
// in JSX. This preserves the library's actual optional-prop behavior.
const DraggableContainer = Draggable as ComponentType<Partial<DraggableProps> & { children?: ReactNode }>;

/* -------------------------------- Importance -------------------------------- */
const IMPORTANCE: { id: Importance; label: string; color: string }[] = [
  { id: "low", label: "Low", color: C.pink2 },
  { id: "medium", label: "Medium", color: C.pink2 },
  { id: "high", label: "High", color: C.pink4 },
];
const importanceColor = (id: Importance) => (IMPORTANCE.find((i) => i.id === id) || IMPORTANCE[1]).color;

const BOX_SHADES = [
  { id: "paper", label: "Paper", color: C.page },
  { id: "blush", label: "Blush", color: C.pink0 },
  { id: "rose", label: "Rose", color: C.pink1 },
  { id: "deep", label: "Deep", color: C.pink2 },
];

/* --------------------------------- Helpers --------------------------------- */
const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function offsetDate(days: number, base: Date = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return fmtDate(d);
}
function to12h(hhmm: string | null) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? ":" + pad(m) : ""}${ap}`;
}

function parseQuickAdd(raw: string): { title: string; time: string | null } {
  let text = raw.trim();
  let time: string | null = null;
  const timeRegex = /\b(?:at\s+)?(\d{1,2})(:\d{2})?\s*(am|pm)\b/i;
  const m = text.match(timeRegex);
  if (m) {
    let hour = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2].slice(1), 10) : 0;
    const ap = m[3].toLowerCase();
    if (ap === "pm" && hour < 12) hour += 12;
    if (ap === "am" && hour === 12) hour = 0;
    time = `${pad(hour)}:${pad(min)}`;
    text = (text.slice(0, m.index) + text.slice(m.index! + m[0].length)).trim();
  }
  text = text.replace(/\btomorrow\b/i, "").replace(/\s+/g, " ").trim();
  return { title: text || raw.trim(), time };
}

/* --------------------------- Smart icon recognition -------------------------- */
const ICON_RULES: { test: RegExp; Icon: LucideIcon }[] = [
  { test: /gym|workout|exercise|dumbbell/i, Icon: Dumbbell },
  { test: /walk|run|jog|hike/i, Icon: Footprints },
  { test: /bike|cycle/i, Icon: Bike },
  { test: /coffee|espresso|latte/i, Icon: Coffee },
  { test: /milk|dairy/i, Icon: Milk },
  { test: /read|book|chapter|novel/i, Icon: BookOpen },
  { test: /journal|diary|write|writing/i, Icon: NotebookPen },
  { test: /water|hydrate|drink/i, Icon: Droplet },
  { test: /sleep|rest|nap|bed/i, Icon: Moon },
  { test: /work|project|deep work|deadline/i, Icon: Laptop },
  { test: /email|mail|reply/i, Icon: Mail },
  { test: /call|phone/i, Icon: Phone },
  { test: /lunch|dinner|breakfast|food|eat|cook/i, Icon: UtensilsCrossed },
  { test: /shower|bath/i, Icon: ShowerHead },
  { test: /shop|groceries|buy|market/i, Icon: ShoppingBag },
  { test: /movie|film|watch/i, Icon: Film },
  { test: /photo|camera|shoot/i, Icon: Camera },
  { test: /cat|dog|pet/i, Icon: Cat },
  { test: /fruit|apple|snack/i, Icon: Apple },
  { test: /music|song|playlist/i, Icon: Music },
  { test: /family|friend|meet up|meeting|team/i, Icon: Users },
  { test: /gift|birthday|present/i, Icon: Gift },
  { test: /love|date night|heart/i, Icon: Heart },
  { test: /alarm|wake/i, Icon: AlarmClock },
];
function getSmartIcon(title: string): LucideIcon | null {
  for (const rule of ICON_RULES) if (rule.test.test(title)) return rule.Icon;
  return null;
}

/* --------------------------------- Doodle set -------------------------------- */
const DOODLES: { id: string; Icon: LucideIcon; label: string }[] = [
  { id: "alarm", Icon: AlarmClock, label: "wake" },
  { id: "coffee", Icon: Coffee, label: "coffee" },
  { id: "book", Icon: BookOpen, label: "read" },
  { id: "gym", Icon: Dumbbell, label: "gym" },
  { id: "milk", Icon: Milk, label: "milk" },
  { id: "work", Icon: Laptop, label: "work" },
  { id: "food", Icon: UtensilsCrossed, label: "food" },
  { id: "movie", Icon: Film, label: "movie" },
  { id: "photo", Icon: Camera, label: "photo" },
  { id: "pet", Icon: Cat, label: "pet" },
  { id: "fruit", Icon: Apple, label: "fruit" },
  { id: "shop", Icon: ShoppingBag, label: "shop" },
  { id: "sleep", Icon: Moon, label: "sleep" },
  { id: "mail", Icon: Mail, label: "mail" },
  { id: "call", Icon: Phone, label: "call" },
  { id: "people", Icon: Users, label: "people" },
  { id: "water", Icon: Droplet, label: "water" },
  { id: "walk", Icon: Footprints, label: "walk" },
  { id: "journal", Icon: NotebookPen, label: "journal" },
  { id: "music", Icon: Music, label: "music" },
  { id: "gift", Icon: Gift, label: "gift" },
  { id: "heart", Icon: Heart, label: "love" },
  { id: "bike", Icon: Bike, label: "bike" },
  { id: "shower", Icon: ShowerHead, label: "shower" },
];

function tierFromCount(totalTasks: number, doneTasks: number) {
  if (totalTasks === 0) return -1;
  if (doneTasks === 0) return 0;   // Tasks exist, but 0 completed
  if (doneTasks === 1) return 1;   // 1 task done
  if (doneTasks === 2) return 2;   // 2 tasks done
  if (doneTasks === 3) return 3;   // 3 tasks done
  return 4;
}
const TIER_COLOR = [C.pink0, C.pink1, C.pink2, C.pink2, C.pink4];

/* ----------------------------- Ink-fill checkbox ---------------------------- */
function InkCheckbox({ checked, onToggle, size = 22 }: { checked: boolean; onToggle: () => void; size?: number }) {
  return (
    <button onClick={onToggle} aria-label={checked ? "Mark incomplete" : "Mark complete"} style={{
      width: size, height: size, borderRadius: 6, border: `2px solid ${C.ink}`,
      background: checked ? C.pink2 : "transparent", display: "flex",
      alignItems: "center", justifyContent: "center", cursor: "pointer",
      flexShrink: 0, transition: "background 0.25s ease, transform 0.15s ease",
      transform: checked ? "scale(1.04)" : "scale(1)", padding: 0,
    }}>
      {checked && (
        <svg width={size * 0.6} height={size * 0.5} viewBox="0 0 16 14" fill="none">
          <path d="M1 7L6 12L15 1" stroke={C.paper} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 22, animation: "inkfill 0.35s ease forwards" }} />
        </svg>
      )}
    </button>
  );
}

function ImportanceDot({ id, size = 8 }: { id: Importance; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", background: importanceColor(id), flexShrink: 0, display: "inline-block" }} />;
}

function ImportancePicker({ value, onChange }: { value: Importance; onChange: (v: Importance) => void }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {IMPORTANCE.map((lvl) => (
        <button key={lvl.id} onClick={() => onChange(lvl.id)} type="button" style={{
          display: "flex", alignItems: "center", gap: 5, padding: "5px 9px", borderRadius: 999,
          border: `1.5px solid ${value === lvl.id ? lvl.color : C.lineSoft}`,
          background: value === lvl.id ? lvl.color + "22" : C.paper, cursor: "pointer",
          fontFamily: HAND, fontSize: 13, color: C.ink,
        }}>
          <ImportanceDot id={lvl.id} /> {lvl.label}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- Nav tabs --------------------------------- */
function TabBar({ active, setActive }: { active: string; setActive: (id: string) => void }) {
  const tabs = [ { id: "today", label: "Today" }, { id: "calendar", label: "Calendar" }, { id: "focus", label: "Focus" } ];
  return (
    <div style={{ display: "flex", gap: 4, padding: "4px", background: C.pink0, borderRadius: 12, marginBottom: 20 }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => setActive(t.id)} style={{
          flex: 1, padding: "10px 12px", borderRadius: 9, border: "none", cursor: "pointer",
          background: active === t.id ? C.paper : "transparent", color: active === t.id ? C.ink : C.inkSoft,
          fontFamily: HAND, fontSize: 16, boxShadow: active === t.id ? `0 1px 3px rgba(46,43,36,0.15)` : "none",
          transition: "all 0.2s ease",
        }}>{t.label}</button>
      ))}
    </div>
  );
}
function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 21, color: C.navy, marginBottom: 8, borderBottom: `2px solid ${C.ink}`, display: "inline-block", paddingBottom: 2 }}>
      {text}
    </div>
  );
}
function EmptyNote({ text }: { text: string }) {
  return <div style={{ fontFamily: HAND, fontSize: 14, color: C.inkSoft, padding: "6px 0" }}>{text}</div>;
}

/* ------------------------------- Yearly heatmap ------------------------------ */
// Reads the tasks table directly and aggregates client-side. If your task volume grows
// large enough for this to matter, swap this for a dedicated `daily_activity` Dexie table
// that's incremented on every write (see PRD §2B) instead of scanning here — this version
// trades a bit of scale headroom for not needing a second write path right now.
function YearHeatmap({ tasks }: { tasks: Task[] }) {
  const activity = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    for (const t of tasks) {
      if (!map[t.date]) map[t.date] = { total: 0, done: 0 };
      map[t.date].total += 1;
      if (t.completed) map[t.date].done += 1;
    }
    return map;
  }, [tasks]);

  const today = new Date();
  const cols = 27;
  const startSunday = new Date(today);
  startSunday.setDate(startSunday.getDate() - startSunday.getDay() - (cols - 1) * 7);

  const weeks: Date[][] = [];
  for (let w = 0; w < cols; w++) {
    const col: Date[] = [];
    for (let d = 0; d < 7; d++) { const day = new Date(startSunday); day.setDate(day.getDate() + w * 7 + d); col.push(day); }
    weeks.push(col);
  }
  const monthLabels: Record<string, number> = {};
  weeks.forEach((col, wi) => {
    const first = col[0];
    const key = `${first.getFullYear()}-${first.getMonth()}`;
    if (monthLabels[key] === undefined && first.getDate() <= 7) monthLabels[key] = wi;
  });

  let streak = 0;
  for (let off = 0; off < 365; off++) {
    const date = offsetDate(-off);
    if (date > fmtDate(today)) continue;
    const info = activity[date];
    const total = info ? info.total : 0;
    const tier = tierFromCount(total, info? info.done : 0);
    if (tier === -1) continue;
    if (tier === 0) break;
    streak++;
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <SectionLabel text="Streak" />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.pink1, color: C.pink4, padding: "3px 10px", borderRadius: 999, fontFamily: HAND, fontSize: 14 }}>
          <Sparkles size={13} /> {streak} day streak
        </div>
      </div>
      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ display: "inline-flex", gap: 3 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, marginRight: 2, paddingTop: 16 }}>
            {DAY_LETTERS.map((l, i) => <div key={i} style={{ width: 10, height: 10, fontFamily: HAND, fontSize: 9, color: i % 2 ? C.inkSoft : "transparent", lineHeight: "10px" }}>{l}</div>)}
          </div>
          <div>
            <div style={{ display: "flex", gap: 3, marginBottom: 2, height: 14 }}>
              {weeks.map((col, wi) => (
                <div key={wi} style={{ width: 10, fontFamily: HAND, fontSize: 10, color: C.inkSoft, whiteSpace: "nowrap" }}>
                  {Object.entries(monthLabels).find(([, v]) => v === wi) ? MONTH_NAMES[col[0].getMonth()].slice(0, 3) : ""}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              {weeks.map((col, wi) => (
                <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {col.map((day, di) => {
                    const dateStr = fmtDate(day);
                    const isFuture = dateStr > fmtDate(today);
                    const info = activity[dateStr];
                    const total = info ? info.total : 0;
                    const tier = tierFromCount(total, info? info.done : 0);
                    return (
                      <div key={di} title={isFuture ? "" : total === 0 ? `${dateStr}: rest day` : `${dateStr}: ${info.done}/${info.total} done`}
                        style={{ width: 10, height: 10, borderRadius: 2.5, background: isFuture ? "transparent" : tier === -1 ? C.lineSoft : TIER_COLOR[tier], border: isFuture ? `1px dashed ${C.lineSoft}` : "none" }} />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 8, fontFamily: HAND, fontSize: 13, color: C.inkSoft }}>
        <span>Less</span>
        {TIER_COLOR.map((c, i) => <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: c }} />)}
        <span>More</span>
      </div>
    </div>
  );
}

/* --------------------------------- Today view -------------------------------- */
function TodayView({
  tasks, addTask, toggleTask, dayMap, updateMood, removeTask
}: {
  tasks: Task[];
  addTask: (t: { date: string; title: string; time: string | null; importance: Importance }) => void;
  toggleTask: (id: number) => void;
  dayMap : Record<string, DayMeta>;
  removeTask: (id: number) =>void;
  updateMood: (date:string, mood: number)=>void;
}) {
  const [input, setInput] = useState("");
  const [scheduleOn, setScheduleOn] = useState(false);
  const [manualTime, setManualTime] = useState("");
  const [importance, setImportance] = useState<Importance>("medium");
  const today = fmtDate(new Date());
  const todays = tasks.filter((t) => t.date === today);
  const scheduled = todays.filter((t) => t.time).sort((a, b) => (a.time as string).localeCompare(b.time as string));
  const unscheduled = todays.filter((t) => !t.time);
  const dateObj = new Date();

  const currentMood = dayMap[today]?.mood || 0;

  const handleAdd = () => {
    if (!input.trim()) return;
    const parsed = parseQuickAdd(input);
    const time = scheduleOn ? (manualTime || parsed.time) : parsed.time;
    addTask({ date: today, title: parsed.title, time, importance });
    setInput(""); setManualTime("");
  };

  const TaskRow = ({ t, showTime }: { t: Task; showTime?: boolean }) => {
    const Icon = getSmartIcon(t.title);
    return (
<div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
        {showTime
          ? <span style={{ fontFamily: HAND, fontSize: 13, color: C.navySoft, width: 50, flexShrink: 0 }}>{to12h(t.time)}</span>
          : <InkCheckbox checked={t.completed} onToggle={() => toggleTask(t.id!)} />}
        <ImportanceDot id={t.importance} />
        {Icon && <Icon size={16} color={t.completed ? C.inkSoft : C.navySoft} style={{ flexShrink: 0 }} />}
        
        <span style={{ flex: 1, fontFamily: HAND, fontSize: 16, color: t.completed ? C.inkSoft : C.ink, textDecoration: t.completed ? "line-through" : "none" }}>
          {t.title}
        </span>
        
        {/* ADD THIS DELETE BUTTON */}
        <button 
          onClick={() => removeTask(t.id!)} 
          aria-label="Delete task" 
          style={{ background: "none", border: "none", cursor: "pointer", color: C.pink3, opacity: 0.6, padding: 4 }}
        >
          <X size={16} />
        </button>

        {showTime && <InkCheckbox checked={t.completed} onToggle={() => toggleTask(t.id!)} />}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <div style={{ width: 52, height: 52, background: C.pink2, color: C.paper, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: 30 }}>
          {dateObj.getDate()}
        </div>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 30, color: C.navy, fontWeight: 700, lineHeight: 1 }}>{dateObj.toLocaleDateString("en-US", { weekday: "long" })}</div>
          <div style={{ fontFamily: HAND, fontSize: 14, color: C.inkSoft }}>{MONTH_NAMES[dateObj.getMonth()]} {dateObj.getFullYear()}</div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: scheduleOn ? 8 : 0 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder='Try "Read chapter 3 at 5pm"'
            style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.paper, fontFamily: HAND, fontSize: 16, color: C.ink, outline: "none" }} />
          <button onClick={() => setScheduleOn((s) => !s)} aria-label="Toggle schedule time" title="Schedule this task" style={{
            width: 42, height: 42, borderRadius: 10, border: `1.5px solid ${scheduleOn ? C.navy : C.line}`,
            background: scheduleOn ? C.navy : C.paper, color: scheduleOn ? C.paper : C.inkSoft,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
          }}>
            <Clock size={18} />
          </button>
          <button onClick={handleAdd} aria-label="Add task" style={{ width: 42, height: 42, borderRadius: 10, border: "none", background: C.pink2, color: C.paper, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <Plus size={20} />
          </button>
        </div>
        {scheduleOn && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontFamily: HAND, fontSize: 14, color: C.inkSoft }}>
            <span>at</span>
            <input type="time" value={manualTime} onChange={(e) => setManualTime(e.target.value)}
              style={{ padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontFamily: HAND, fontSize: 14, background: C.paper, color: C.ink }} />
            <span style={{ color: C.inkSoft }}>this goes into your Schedule instead of the to-do list</span>
          </div>
        )}
        <div style={{paddingTop: 4}}>
        <ImportancePicker value={importance} onChange={setImportance} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 26, marginTop: 20 }}>
        <div>
          <SectionLabel text="Schedule" />
          {scheduled.length === 0 && <EmptyNote text="Nothing on the clock yet — tap the clock icon above to add a time." />}
          {scheduled.map((t) => <TaskRow key={t.id} t={t} showTime />)}
        </div>
        <div>
          <SectionLabel text="To-do list" />
          {unscheduled.length === 0 && <EmptyNote text="All clear here." />}
          {unscheduled.map((t) => <TaskRow key={t.id} t={t} />)}
        </div>
      </div>

      <div style={{ paddingTop: 4, paddingBottom: 8, borderTop: `1px dashed ${C.line}`, display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
        <span style={{ fontFamily: HAND, fontSize: 16, color: C.inkSoft }}>Today's mood</span>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => updateMood(today, n)} aria-label={`${n} star`} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
              <Star size={20} fill={n <= currentMood ? C.gold : "none"} color={n <= currentMood ? C.gold : C.line} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>

      <div style={{ paddingTop: 12, borderTop: `1px dashed ${C.line}` }}>
        <YearHeatmap tasks={tasks} />
      </div>
    </div>
  );
}

/* ------------------------------ Day dialog (event + doodle) ------------------ */
function DayDialog({
  date, dayTasks, onToggleTask,onRemoveTask, onAddEvent, doodles, onAddDoodle, onRemoveDoodle, onClose, currentShade, onUpdateShade,
}: {
  date: string;
  dayTasks: Task[];
  onToggleTask: (id: number) => void;
  onRemoveTask: (id:number) => void;
  onAddEvent: (evt: { title: string; time: string | null; importance: Importance }) => void;
  doodles: Doodle[];
  onAddDoodle: (iconId: string, label: string) => void;
  onRemoveDoodle: (id: number) => void;
  onClose: () => void;
  currentShade: string;
  onUpdateShade: (shadeId:string)=>void;

}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [importance, setImportance] = useState<Importance>("medium");

  const submitEvent = () => {
    if (!title.trim()) return;
    onAddEvent({ title: title.trim(), time: time || null, importance });
    setTitle(""); setTime("");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(46,43,36,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20, borderRadius: 16 }}>
      <div style={{ background: C.paper, borderRadius: 14, padding: 20, width: 360, maxHeight: 500, overflowY: "auto", border: `1.5px solid ${C.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 24, color: C.navy, fontWeight: 700 }}>{date}</div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft }}><X size={20} /></button>
        </div>

        {dayTasks.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: HAND, fontSize: 14, color: C.inkSoft, marginBottom: 6 }}>Events this day</div>
            {dayTasks.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                <InkCheckbox checked={t.completed} onToggle={() => onToggleTask(t.id!)} size={18} />
                <ImportanceDot id={t.importance} />
                {t.time && <span style={{ fontFamily: HAND, fontSize: 12, color: C.navySoft, width: 44 }}>{to12h(t.time)}</span>}
                <span style={{ flex: 1, fontFamily: HAND, fontSize: 14, color: t.completed ? C.inkSoft : C.ink, textDecoration: t.completed ? "line-through" : "none" }}>{t.title}</span>
                <button 
                  onClick={() => onRemoveTask(t.id!)} 
                  aria-label="Delete" 
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.pink3, opacity: 0.6 }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: HAND, fontSize: 14, color: C.inkSoft, marginBottom: 6 }}>Add or import an event</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitEvent()}
            placeholder="Event title"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${C.line}`, background: C.page, fontFamily: HAND, fontSize: 15, color: C.ink, outline: "none", marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              style={{ padding: "7px 9px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontFamily: HAND, fontSize: 14, background: C.page, color: C.ink }} />
            <ImportancePicker value={importance} onChange={setImportance} />
          </div>
          <button onClick={submitEvent} style={{ width: "100%", padding: "9px 0", borderRadius: 9, border: "none", background: C.pink2, color: C.paper, fontFamily: HAND, fontSize: 15, cursor: "pointer" }}>
            Add event
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: HAND, fontSize: 14, color: C.inkSoft, marginBottom: 8 }}>Day Color</div>
          <div style={{ display: "flex", gap: 10 }}>
            {BOX_SHADES.map((s) => (
              <button 
                key={s.id} 
                onClick={() => onUpdateShade(s.id)} 
                title={s.label}
                style={{
                  width: 24, height: 24, borderRadius: "50%", background: s.color, cursor: "pointer",
                  border: currentShade === s.id ? `2.5px solid ${C.navy}` : `1.5px solid ${C.lineSoft}`, padding: 0,
              }} />
            ))}
          </div>
        </div>

        {doodles.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {doodles.map((d) => {
              const meta = DOODLES.find((x) => x.id === d.iconId);
              const Icon = meta?.Icon;
              return (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 5, background: C.pink1, color: C.pink4, borderRadius: 999, padding: "4px 8px 4px 10px", fontFamily: HAND, fontSize: 13 }}>
                  {Icon && <Icon size={14} />} {d.label}
                  <button onClick={() => onRemoveDoodle(d.id!)} aria-label="Remove" style={{ background: "none", border: "none", cursor: "pointer", color: C.pink4, display: "flex" }}><X size={12} /></button>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ fontFamily: HAND, fontSize: 14, color: C.inkSoft, marginBottom: 8 }}>Drop a doodle</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {DOODLES.map((d) => {
            const Icon = d.Icon;
            return (
              <button key={d.id} onClick={() => onAddDoodle(d.id, d.label)} title={d.label} style={{
                display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "1", borderRadius: 8,
                border: `1.5px solid ${C.lineSoft}`, background: C.page, cursor: "pointer", color: C.ink,
              }}><Icon size={17} /></button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Calendar view ------------------------------ */
function CalendarView({
  tasks, addTask, toggleTask, doodleMap, addDoodle, removeDoodle, dayMap, updateShade, removeTask
}: {
  tasks: Task[];
  addTask: (t: { date: string; title: string; time: string | null; importance: Importance }) => void;
  toggleTask: (id: number) => void;
  doodleMap: Record<string, Doodle[]>;
  dayMap: Record<string, DayMeta>;
  updateShade: (date: string, shade:string)=> void;
  addDoodle: (date: string, iconId: string, label: string) => void;
  removeDoodle: (id: number) => void;
  removeTask: (id: number)=>void;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [shadeMap, setShadeMap] = useState<Record<string, string>>({});
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear(), month = base.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => { (map[t.date] ||= []).push(t); });
    return map;
  }, [tasks]);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => setMonthOffset((m) => m - 1)} aria-label="Previous month" style={{ background: "none", border: "none", cursor: "pointer", color: C.ink }}><ChevronLeft size={20} /></button>
        <div style={{ fontFamily: DISPLAY, fontSize: 27, fontWeight: 700, color: C.navy }}>{MONTH_NAMES[month]} {year}</div>
        <button onClick={() => setMonthOffset((m) => m + 1)} aria-label="Next month" style={{ background: "none", border: "none", cursor: "pointer", color: C.ink }}><ChevronRight size={20} /></button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={() => setOpenDate(fmtDate(new Date()))} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "none",
          background: C.pink2, color: C.paper, fontFamily: HAND, fontSize: 14, cursor: "pointer",
        }}>
          <Plus size={15} /> Add / import event
        </button>
      </div>
      <div style={{overflowX: "auto", paddingBottom:8}}>
        <div style={{minWidth: 400}}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(90px, 1fr))", gap: 4, marginBottom: 4 }}>
        {DAY_NAMES.map((d) => <div key={d} style={{ textAlign: "center", fontFamily: HAND, fontSize: 12, color: C.inkSoft }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(90px, 1fr))", gap: 4 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} style={{minHeight:78, minWidth:48}} />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
          const dayShadeId = shadeMap[dateStr] || 'paper';
          const boxColor = BOX_SHADES.find((s)=>s.id=== dayShadeId)!.color;
          const isToday = dateStr === fmtDate(new Date());
          const dayTasks = (byDate[dateStr] || []).slice(0, 3);
          const doodles = (doodleMap[dateStr] || []).slice(0, 4);
          return (
            <button key={i} onClick={() => setOpenDate(dateStr)} style={{
              minHeight: 78, border: `1.5px solid ${isToday ? C.navy : C.lineSoft}`, borderRadius: 9,
              background: boxColor, padding: 6, display: "flex", flexDirection: "column", alignItems: "flex-start",
              gap: 3, cursor: "pointer", textAlign: "left", width: "100%", minWidth: 0,
            }}>
              <span style={{ fontFamily: HAND, fontSize: 14, color: isToday ? C.navy : C.ink }}>{d}</span>
              {dayTasks.map((t) => {
                const Icon = getSmartIcon(t.title);
                return (
                  <span key={t.id} style={{ display: "flex", alignItems: "center", gap: 3, fontFamily: HAND, fontSize: 10.5, color: C.inkSoft, maxWidth: "100%", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    <ImportanceDot id={t.importance} size={6} />
                    {Icon && <Icon size={10} style={{ flexShrink: 0 }} />} {t.title}
                  </span>
                );
              })}
              {doodles.length > 0 && (
                <div style={{ display: "flex", gap: 3, marginTop: "auto" }}>
                  {doodles.map((dd) => { const meta = DOODLES.find((x) => x.id === dd.iconId); const Icon = meta?.Icon; return Icon ? <Icon key={dd.id} size={11} color={C.pink4} /> : null; })}
                </div>
              )}
            </button>
          );
        })}
      </div>
        </div>
      </div>

      {openDate && (
        <DayDialog
          date={openDate}
          dayTasks={byDate[openDate] || []}
          onToggleTask={toggleTask}
          onRemoveTask= {removeTask}
          onAddEvent={(evt) => addTask({ date: openDate, ...evt })}
          doodles={doodleMap[openDate] || []}
          onAddDoodle={(iconId, label) => addDoodle(openDate, iconId, label)}
          onRemoveDoodle={removeDoodle}
          onClose={() => setOpenDate(null)}
          currentShade = {shadeMap[openDate]|| "paper"}
          onUpdateShade = {(shadeId)=> setShadeMap(prev => ({...prev, [openDate]:shadeId}))}
        />
      )}
    </div>
  );
}

/* --------------------------------- Focus view -------------------------------- */
function useNoise() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ src: AudioBufferSourceNode; gain: GainNode } | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (nodesRef.current) { try { nodesRef.current.src.stop(); } catch (e) {} nodesRef.current = null; }
    setPlayingId(null);
  }, []);

  const play = useCallback((ambient: { id: string; kind: "filtered" | "brown" | null }) => {
    if (!ambient.kind) return;
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new AC();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    if (nodesRef.current) { try { nodesRef.current.src.stop(); } catch (e) {} nodesRef.current = null; }
    if (playingId === ambient.id) { setPlayingId(null); return; }

    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    if (ambient.kind === "brown") {
      let last = 0;
      for (let i = 0; i < bufferSize; i++) { const white = Math.random() * 2 - 1; last = (last + 0.02 * white) / 1.02; data[i] = last * 3.2; }
    } else {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource(); src.buffer = buffer; src.loop = true;
    const gain = ctx.createGain(); gain.gain.value = 0.06;
    if (ambient.kind === "filtered") {
      const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 1200;
      src.connect(filter); filter.connect(gain);
    } else src.connect(gain);
    gain.connect(ctx.destination); src.start();
    nodesRef.current = { src, gain };
    setPlayingId(ambient.id);
  }, [playingId]);

  useEffect(() => stop, [stop]);
  return { playingId, play, stop };
}

function FocusView({
  tasks,
  toggleTask,
  activeStream,
  onStreamSelect,
}: {
  tasks: Task[];
  toggleTask: (id: number) => void;
  activeStream: StreamId | null;
  onStreamSelect: (streamId: StreamId) => void;
}) {
  const today = fmtDate(new Date());
  // Everything open today — scheduled AND to-do — so nothing gets left out of Focus mode.
  const openToday = tasks.filter((t) => t.date === today && !t.completed);
  const openScheduled = openToday.filter((t) => t.time).sort((a, b) => (a.time as string).localeCompare(b.time as string));
  const openTodo = openToday.filter((t) => !t.time);

  const [focusTaskId, setFocusTaskId] = useState<number | null>(openToday[0]?.id ?? null);
  useEffect(() => {
    // If the currently focused task got completed or removed, fall back to the next open one.
    if (focusTaskId !== null && !openToday.some((t) => t.id === focusTaskId)) {
      setFocusTaskId(openToday[0]?.id ?? null);
    }
  }, [openToday, focusTaskId]);

  const [mode, setMode] = useState<"work" | "break">("work");
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const durationSec = (mode === "work" ? workMin : breakMin) * 60;
  const [remaining, setRemaining] = useState(durationSec);
  const [running, setRunning] = useState(false);
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => { if (!running) setRemaining(durationSec); }, [durationSec, running]);
  useEffect(() => {
    if (!running) return;
    endTimeRef.current = Date.now() + remaining * 1000;
    const tick = () => {
      const left = Math.max(0, Math.round((endTimeRef.current! - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) { setRunning(false); setMode((m) => (m === "work" ? "break" : "work")); }
    };
    const interval = setInterval(tick, 250);
    const onVis = () => tick();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("focus", onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const toggleRun = () => setRunning((r) => !r);
  const reset = () => { setRunning(false); setRemaining(durationSec); };
  const pct = 1 - remaining / durationSec;
  const mm = pad(Math.floor(remaining / 60)), ss = pad(remaining % 60);
  const { playingId, play } = useNoise();
  const radius = 90, circumference = 2 * Math.PI * radius;

  const FocusTaskButton = ({ t }: { t: Task }) => {
    const Icon = getSmartIcon(t.title);
    return (
      <div
        role="button"
        tabIndex={0}
        aria-pressed={focusTaskId === t.id}
        onClick={() => setFocusTaskId(t.id!)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setFocusTaskId(t.id!);
          }
        }}
        style={{
        textAlign: "left", padding: "9px 12px", borderRadius: 8, cursor: "pointer",
        border: `1.5px solid ${focusTaskId === t.id ? C.pink2 : C.lineSoft}`,
        background: focusTaskId === t.id ? C.pink1 : C.paper, fontFamily: HAND, fontSize: 15, color: C.ink,
        display: "flex", alignItems: "center", gap: 8, width: "100%",
      }}>
        <InkCheckbox checked={t.completed} onToggle={(e?: any) => { e?.stopPropagation?.(); toggleTask(t.id!); }} size={18} />
        <ImportanceDot id={t.importance} />
        {t.time && <span style={{ fontSize: 12, color: C.navySoft, flexShrink: 0 }}>{to12h(t.time)}</span>}
        {Icon && <Icon size={15} color={C.navySoft} style={{ flexShrink: 0 }} />}
        <span style={{ flex: 1 }}>{t.title}</span>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
        {(["work", "break"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setRunning(false); }} style={{
            padding: "6px 16px", borderRadius: 999, border: `1.5px solid ${C.ink}`, cursor: "pointer",
            background: mode === m ? C.ink : "transparent", color: mode === m ? C.paper : C.ink, fontFamily: HAND, fontSize: 15,
          }}>{m === "work" ? "Focus" : "Break"}</button>
        ))}
      </div>
      <svg width="220" height="220" viewBox="0 0 220 220" style={{ marginBottom: 18 }}>
        <circle cx="110" cy="110" r={radius} fill="none" stroke={C.pink0} strokeWidth="14" />
        <circle cx="110" cy="110" r={radius} fill="none" stroke={mode === "work" ? C.pink2 : C.navy} strokeWidth="14"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct)}
          transform="rotate(-90 110 110)" style={{ transition: "stroke-dashoffset 0.3s linear" }} />
        <text x="110" y="104" textAnchor="middle" fontFamily={DISPLAY} fontSize="42" fontWeight="700" fill={C.ink}>{mm}:{ss}</text>
        <text x="110" y="130" textAnchor="middle" fontFamily={HAND} fontSize="13" fill={C.inkSoft}>{mode === "work" ? "focusing" : "on a break"}</text>
      </svg>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={toggleRun} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, border: "none", background: C.pink2, color: C.paper, fontFamily: HAND, fontSize: 15, cursor: "pointer" }}>
          {running ? <Pause size={16} /> : <Play size={16} />} {running ? "Pause" : "Start"}
        </button>
        <button onClick={reset} aria-label="Reset timer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.paper, color: C.ink, cursor: "pointer" }}>
          <RotateCcw size={16} />
        </button>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 22, fontFamily: HAND, fontSize: 14, color: C.inkSoft }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>Focus
          <input type="number" min={1} max={90} value={workMin} disabled={running} onChange={(e) => setWorkMin(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 44, padding: "4px 6px", borderRadius: 6, border: `1px solid ${C.line}`, fontFamily: HAND }} /> min
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>Break
          <input type="number" min={1} max={30} value={breakMin} disabled={running} onChange={(e) => setBreakMin(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: 44, padding: "4px 6px", borderRadius: 6, border: `1px solid ${C.line}`, fontFamily: HAND }} /> min
        </label>
      </div>

      {/* Focusing on — now pulls from BOTH the schedule and the to-do list */}
      <div style={{ width: "100%", maxWidth: 360, marginBottom: 22 }}>
        <SectionLabel text="Focusing on" />
        {openToday.length === 0 && <EmptyNote text="No open tasks — enjoy the quiet." />}
        {openScheduled.length > 0 && (
          <div style={{ marginBottom: openTodo.length > 0 ? 12 : 0 }}>
            <div style={{ fontFamily: HAND, fontSize: 13, color: C.inkSoft, marginBottom: 6 }}>Scheduled</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {openScheduled.map((t) => <FocusTaskButton key={t.id} t={t} />)}
            </div>
          </div>
        )}
        {openTodo.length > 0 && (
          <div>
            <div style={{ fontFamily: HAND, fontSize: 13, color: C.inkSoft, marginBottom: 6 }}>To-do</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {openTodo.map((t) => <FocusTaskButton key={t.id} t={t} />)}
            </div>
          </div>
        )}
      </div>

<div style={{ width: "100%", maxWidth: 360 }}>
  <SectionLabel text="Ambient Streams" />
  <div style={{ 
    display: "flex", 
    gap: 8, 
    overflowX: "auto", 
    paddingBottom: 8, // Adds breathing room for the scrollbar
    scrollbarWidth: "none" // Hides scrollbar on Firefox for a cleaner UX
  }}>
    {/* Hides scrollbar on WebKit (Chrome/Safari) while keeping it scrollable */}
    <style>{`
      div::-webkit-scrollbar { display: none; }
    `}</style>
    
    {YOUTUBE_STREAMS.map((stream) => {
      const active = activeStream === stream.id;
      return (
        <button 
          key={stream.id} 
          onClick={() => onStreamSelect(stream.id)} 
          style={{
            flexShrink: 0, // Forces the container to scroll instead of squashing the buttons
            whiteSpace: "nowrap", // Prevents the text from stacking
            padding: "10px 14px", 
            borderRadius: 10, 
            cursor: "pointer",
            border: `1.5px solid ${active ? C.navy : C.lineSoft}`, 
            background: active ? C.pink1 : C.paper, 
            fontFamily: HAND, 
            fontSize: 13,
            color: active ? C.navy : C.ink
        }}>
          {stream.label}
        </button>
      );
    })}
  </div>
</div>
    </div>
  );
}

function AmbientStreamPlayer({
  activeStream,
  isPlaying,
  onPlayingChange,
  onClose,
}: {
  activeStream: StreamId | null;
  isPlaying: boolean;
  onPlayingChange: (isPlaying: boolean) => void;
  onClose: () => void;
}) {
  const stream = YOUTUBE_STREAMS.find((item) => item.id === activeStream);
  if (!stream) return null;

  return (
    <DraggableContainer handle=".drag-handle" bounds="parent" defaultPosition={{ x: 0, y: 0 }}>
      <div style={{
        position: "absolute", bottom: 20, right: 20, width: 280,
        background: C.paper, borderRadius: 12, border: `2px solid ${C.line}`,
        boxShadow: "0 8px 24px rgba(46,43,36,0.12)", zIndex: 50, overflow: "hidden"
      }}>
        <div className="drag-handle" style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 12px", background: C.pink1, cursor: "grab", borderBottom: `1.5px solid ${C.line}`
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <GripHorizontal size={14} color={C.inkSoft} />
            <span style={{ fontFamily: HAND, fontSize: 14, color: C.ink }}>{stream.label}</span>
          </div>
          <button onClick={onClose} aria-label="Close video" style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
            <X size={16} color={C.ink} />
          </button>
        </div>
        <div style={{ background: C.ink, height: 157 }}>
          <ReactPlayer
            src={stream.url}
            playing={isPlaying}
            width="100%"
            height="100%"
            controls
            onPlay={() => onPlayingChange(true)}
            onPause={() => onPlayingChange(false)}
          />
        </div>
      </div>
    </DraggableContainer>
  );
}

/* ---------------------------------- App root --------------------------------- */
export default function DoMEApp() {
  const { tasks, addTask, toggleTask, removeTask } = useTasks();
  const { doodleMap, addDoodle, removeDoodle } = useDoodles();
  const [active, setActive] = useState("today");
  const [activeStream, setActiveStream] = useState<StreamId | null>(null);
  const [isStreamPlaying, setIsStreamPlaying] = useState(false);
  const {dayMap, updateShade, updateMood} = useDays();

  const selectStream = (streamId: StreamId) => {
    if (activeStream === streamId) {
      setIsStreamPlaying((playing) => !playing);
      return;
    }
    setActiveStream(streamId);
    setIsStreamPlaying(true);
  };

  const closeStream = () => {
    setIsStreamPlaying(false);
    setActiveStream(null);
  };

  return (
    <div style={{
      background: C.page, minHeight: 480, padding: "28px 24px", borderRadius: 16,
      backgroundImage: `linear-gradient(${C.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${C.gridLine} 1px, transparent 1px)`,
      backgroundSize: "22px 22px", position: "relative",
    }}>
      <style>{`
        @keyframes inkfill { from { stroke-dashoffset: 22; } to { stroke-dashoffset: 0; } }
        input:focus, textarea:focus { border-color: ${C.pink2} !important; }
      `}</style>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <TabBar active={active} setActive={setActive} />
        {active === "today" && 
        <TodayView 
          tasks={tasks} 
          addTask={addTask} 
          toggleTask={toggleTask} 
          dayMap={dayMap} 
          updateMood = {updateMood}
          removeTask = {removeTask}
        />}
        {active === "calendar" && (
          <CalendarView
            tasks={tasks} addTask={addTask} toggleTask={toggleTask} removeTask = {removeTask}
            doodleMap={doodleMap} addDoodle={addDoodle} removeDoodle={removeDoodle}
            dayMap={dayMap} updateShade={updateShade}
          />
        )}
        {active === "focus" && (
          <FocusView
            tasks={tasks}
            toggleTask={toggleTask}
            activeStream={activeStream}
            onStreamSelect={selectStream}
          />
        )}
      </div>
      <AmbientStreamPlayer
        activeStream={activeStream}
        isPlaying={isStreamPlaying}
        onPlayingChange={setIsStreamPlaying}
        onClose={closeStream}
      />
    </div>
  );
}

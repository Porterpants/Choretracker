"use client";

import { useMemo, useState } from "react";
import { CleanlinessMeter } from "@/components/CleanlinessMeter";
import { ChoreCard } from "@/components/ChoreCard";
import { ChoreSheet } from "@/components/ChoreSheet";
import type { Frequency } from "@/lib/choreMath";
import { dueStatus, freshness } from "@/lib/choreMath";

type Person = { name: string; initials: string; color: string };

const people: Record<string, Person> = {
  Porter: { name: "Porter", initials: "P", color: "#4A80FF" },
  Brickley: { name: "Brickley", initials: "B", color: "#8B5CF6" },
};

type Chore = {
  id: string;
  title: string;
  frequency: Frequency;
  lastDoneAt: Date | null;
  assignees: Person[];
  subtasks: { id: string; text: string }[];
};

const initialChores: Chore[] = [
  {
    id: "bathroom",
    title: "Clean Bathroom",
    frequency: "WEEKLY",
    lastDoneAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    assignees: [people.Porter, people.Brickley],
    subtasks: [
      { id: "t1", text: "Scrub tiles" },
      { id: "t2", text: "Clean mirror" },
      { id: "t3", text: "Empty trash" },
      { id: "t4", text: "Bleach toilet" },
    ],
  },
  {
    id: "laundry",
    title: "Laundry",
    frequency: "WEEKLY",
    lastDoneAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    assignees: [people.Brickley],
    subtasks: [
      { id: "l1", text: "Gather clothes" },
      { id: "l2", text: "Run washer" },
      { id: "l3", text: "Run dryer" },
      { id: "l4", text: "Fold + put away" },
    ],
  },
  {
    id: "mop",
    title: "Mop Floors",
    frequency: "WEEKLY",
    lastDoneAt: null,
    assignees: [people.Porter],
    subtasks: [
      { id: "m1", text: "Pick up clutter" },
      { id: "m2", text: "Sweep" },
      { id: "m3", text: "Mop" },
      { id: "m4", text: "Let dry" },
    ],
  },
];

export default function Home() {
  const [chores, setChores] = useState<Chore[]>(initialChores);
  const [openId, setOpenId] = useState<string | null>(null);
  const [checkedByChore, setCheckedByChore] = useState<Record<string, Set<string>>>({});

  const now = new Date();

  const meter = useMemo(() => {
    const values = chores.map((c) => freshness(now, c.lastDoneAt, c.frequency));
    const avg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
    return Math.round(avg * 100);
  }, [chores, now]);

  const sorted = useMemo(() => {
    const rank = (s: ReturnType<typeof dueStatus>) => {
      if (s === "OVERDUE") return 0;
      if (s === "DUE") return 1;
      return 2;
    };

    return [...chores].sort((a, b) => {
      const sa = dueStatus(now, a.lastDoneAt, a.frequency);
      const sb = dueStatus(now, b.lastDoneAt, b.frequency);
      const ra = rank(sa);
      const rb = rank(sb);
      if (ra !== rb) return ra - rb;
      return a.title.localeCompare(b.title);
    });
  }, [chores, now]);

  const active = openId ? chores.find((c) => c.id === openId) ?? null : null;
  const checked = active ? checkedByChore[active.id] ?? new Set<string>() : new Set<string>();

  const toggle = (subtaskId: string) => {
    if (!active) return;
    setCheckedByChore((prev) => {
      const next = { ...prev };
      const set = new Set(next[active.id] ?? []);
      if (set.has(subtaskId)) set.delete(subtaskId);
      else set.add(subtaskId);
      next[active.id] = set;
      return next;
    });
  };

  const finish = () => {
    if (!active) return;
    const total = active.subtasks.length;
    const done = (checkedByChore[active.id]?.size ?? 0);
    if (done !== total) return;

    setChores((prev) => prev.map((c) => (c.id === active.id ? { ...c, lastDoneAt: new Date() } : c)));
    setCheckedByChore((prev) => ({ ...prev, [active.id]: new Set<string>() }));
    setOpenId(null);
  };

  return (
    <div className="min-h-screen bg-[color:var(--sand)] px-4 pb-24 pt-6">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold tracking-tight">Chore Board</div>
            <div className="text-xs text-[rgba(45,41,38,0.6)]">Overdue → Due → Fresh</div>
          </div>
          <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow)]">
            P + B
          </div>
        </div>

        <CleanlinessMeter score={meter} />

        <div className="mt-5 grid grid-cols-1 gap-3">
          {sorted.map((c) => {
            const st = dueStatus(now, c.lastDoneAt, c.frequency);
            const set = checkedByChore[c.id] ?? new Set<string>();
            return (
              <ChoreCard
                key={c.id}
                title={c.title}
                status={st}
                assignees={c.assignees.map((a) => ({ initials: a.initials, color: a.color }))}
                subtasksDone={set.size}
                subtasksTotal={c.subtasks.length}
                onClick={() => setOpenId(c.id)}
              />
            );
          })}
        </div>

        <div className="mt-6 rounded-[24px] bg-white p-4 text-xs text-[rgba(45,41,38,0.65)] shadow-[var(--shadow)]">
          MVP mode: this screen is using mock data. Next step is wiring Postgres + Prisma and persisting chores.
        </div>
      </div>

      {active ? (
        <ChoreSheet
          open={true}
          onClose={() => setOpenId(null)}
          title={active.title}
          frequency={active.frequency}
          lastDoneAt={active.lastDoneAt}
          subtasks={active.subtasks}
          checkedIds={checked}
          toggle={toggle}
          onFinish={finish}
        />
      ) : null}
    </div>
  );
}

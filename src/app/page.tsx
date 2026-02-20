"use client";

import { useMemo, useState } from "react";
import { CleanlinessMeter } from "@/components/CleanlinessMeter";
import { ChoreCard } from "@/components/ChoreCard";
import { ChoreSheet } from "@/components/ChoreSheet";
import { ChoreEditorSheet, splitSubtasks } from "@/components/ChoreEditorSheet";
import { FabButton } from "@/components/FabButton";
import { Segmented } from "@/components/Segmented";
import type { Frequency } from "@/lib/choreMath";
import { dueStatus, freshness } from "@/lib/choreMath";
import { uid } from "@/lib/id";
import { parseAssigned } from "@/lib/parseAssigned";
import type { Chore, Person, PersonKey } from "@/lib/types";

const PEOPLE: Record<PersonKey, Person> = {
  Porter: { key: "Porter", name: "Porter", initials: "P", color: "#4A80FF" },
  Brickley: { key: "Brickley", name: "Brickley", initials: "B", color: "#8B5CF6" },
};

const initialChores: Chore[] = [
  {
    id: "bathroom",
    title: "Clean Bathroom",
    frequency: "WEEKLY",
    lastDoneAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    assignees: ["Porter", "Brickley"],
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
    assignees: ["Brickley"],
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
    assignees: ["Porter"],
    subtasks: [
      { id: "m1", text: "Pick up clutter" },
      { id: "m2", text: "Sweep" },
      { id: "m3", text: "Mop" },
      { id: "m4", text: "Let dry" },
    ],
  },
];

type Filter = "DUE" | "ALL" | "FRESH";

type EditorState =
  | { open: false }
  | { open: true; mode: "create"; editId: null }
  | { open: true; mode: "edit"; editId: string };

export default function Home() {
  const [chores, setChores] = useState<Chore[]>(initialChores);
  const [openId, setOpenId] = useState<string | null>(null);
  const [checkedByChore, setCheckedByChore] = useState<Record<string, Set<string>>>({});

  const [filter, setFilter] = useState<Filter>("DUE");
  const [editor, setEditor] = useState<EditorState>({ open: false });
  const [draft, setDraft] = useState({
    title: "",
    frequency: "WEEKLY" as Frequency,
    assignees: { porter: true, brickley: false },
    subtasksText: "",
  });

  const now = useMemo(() => new Date(), []);

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

  const visible = useMemo(() => {
    if (filter === "ALL") return sorted;

    const isDueLike = (c: Chore) => {
      const st = dueStatus(now, c.lastDoneAt, c.frequency);
      return st === "OVERDUE" || st === "DUE";
    };

    if (filter === "DUE") return sorted.filter(isDueLike);
    return sorted.filter((c) => !isDueLike(c));
  }, [sorted, filter, now]);

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
    const done = checkedByChore[active.id]?.size ?? 0;
    if (done !== total) return;

    setChores((prev) => prev.map((c) => (c.id === active.id ? { ...c, lastDoneAt: new Date() } : c)));
    setCheckedByChore((prev) => ({ ...prev, [active.id]: new Set<string>() }));
    setOpenId(null);
  };

  const openCreate = () => {
    setDraft({
      title: "",
      frequency: "WEEKLY",
      assignees: { porter: true, brickley: false },
      subtasksText: "",
    });
    setEditor({ open: true, mode: "create", editId: null });
  };

  const openEdit = (c: Chore) => {
    setDraft({
      title: c.title,
      frequency: c.frequency,
      assignees: { porter: c.assignees.includes("Porter"), brickley: c.assignees.includes("Brickley") },
      subtasksText: c.subtasks.map((s) => s.text).join("\n"),
    });
    setEditor({ open: true, mode: "edit", editId: c.id });
  };

  const saveDraft = () => {
    const parsed = parseAssigned(draft.title);
    const title = parsed.title;

    const porter = draft.assignees.porter || parsed.porter;
    const brickley = draft.assignees.brickley || parsed.brickley;

    const assignees: PersonKey[] = [
      ...(porter ? (["Porter"] as const) : []),
      ...(brickley ? (["Brickley"] as const) : []),
    ];

    const subtasks = splitSubtasks(draft.subtasksText).map((t, i) => ({ id: `s-${uid()}-${i}`, text: t }));

    if (title.trim().length === 0) return;
    if (assignees.length === 0) return;
    if (subtasks.length === 0) return;

    if (editor.open && editor.mode === "create") {
      const id = `c-${uid()}`;
      const next: Chore = {
        id,
        title,
        frequency: draft.frequency,
        lastDoneAt: null,
        assignees,
        subtasks,
      };
      setChores((prev) => [next, ...prev]);
      setCheckedByChore((prev) => ({ ...prev, [id]: new Set<string>() }));
      setEditor({ open: false });
      return;
    }

    if (editor.open && editor.mode === "edit" && editor.editId) {
      const id = editor.editId;
      setChores((prev) => prev.map((c) => (c.id === id ? { ...c, title, frequency: draft.frequency, assignees, subtasks } : c)));
      setCheckedByChore((prev) => ({ ...prev, [id]: new Set<string>() }));
      setEditor({ open: false });
    }
  };

  const deleteActive = () => {
    if (!(editor.open && editor.mode === "edit" && editor.editId)) return;
    const id = editor.editId;
    setChores((prev) => prev.filter((c) => c.id !== id));
    setCheckedByChore((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setEditor({ open: false });
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

        <div className="mt-4 flex items-center justify-between">
          <Segmented
            items={[
              { value: "DUE", label: "Due" },
              { value: "ALL", label: "All" },
              { value: "FRESH", label: "Fresh" },
            ]}
            value={filter}
            onChange={setFilter}
          />
          <div className="text-xs text-[rgba(45,41,38,0.55)]">{visible.length} chores</div>
        </div>

        <div className="mt-4">
          <CleanlinessMeter score={meter} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          {visible.map((c) => {
            const st = dueStatus(now, c.lastDoneAt, c.frequency);
            const set = checkedByChore[c.id] ?? new Set<string>();
            return (
              <ChoreCard
                key={c.id}
                title={c.title}
                status={st}
                assignees={c.assignees.map((k) => ({ initials: PEOPLE[k].initials, color: PEOPLE[k].color }))}
                subtasksDone={set.size}
                subtasksTotal={c.subtasks.length}
                onClick={() => setOpenId(c.id)}
                onEdit={() => openEdit(c)}
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

      <ChoreEditorSheet
        open={editor.open}
        mode={editor.open ? editor.mode : "create"}
        draft={draft}
        setDraft={setDraft}
        onClose={() => setEditor({ open: false })}
        onSave={saveDraft}
        onDelete={editor.open && editor.mode === "edit" ? deleteActive : undefined}
      />

      <FabButton label="Add chore" onClick={openCreate} />
    </div>
  );
}

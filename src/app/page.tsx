"use client";

import { useEffect, useMemo, useState } from "react";
import { CleanlinessMeter } from "@/components/CleanlinessMeter";
import { ChoreCard } from "@/components/ChoreCard";
import { ChoreSheet } from "@/components/ChoreSheet";
import { ChoreEditorSheet, splitSubtasks } from "@/components/ChoreEditorSheet";
import { FabButton } from "@/components/FabButton";
import { Segmented } from "@/components/Segmented";
import type { Frequency } from "@/lib/choreMath";
import { dueStatus, freshness } from "@/lib/choreMath";
import { parseAssigned } from "@/lib/parseAssigned";
import { apiCompleteChore, apiCreateChore, apiDeleteChore, apiGetChores, apiGetPeople, apiUpdateChore } from "@/lib/api";
import type { ApiChore, ApiPerson } from "@/lib/apiTypes";

type Filter = "DUE" | "ALL" | "FRESH";

type EditorState =
  | { open: false }
  | { open: true; mode: "create"; editId: null }
  | { open: true; mode: "edit"; editId: string };

type UiChore = {
  id: string;
  title: string;
  frequency: Frequency;
  lastDoneAt: Date | null;
  assignees: ApiPerson[];
  subtasks: { id: string; text: string }[];
};

const asUiChore = (c: ApiChore): UiChore => ({
  id: c.id,
  title: c.title,
  frequency: c.frequency,
  lastDoneAt: c.lastDoneAt ? new Date(c.lastDoneAt) : null,
  assignees: c.assignees,
  subtasks: c.subtasks
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ id: s.id, text: s.text })),
});

export default function Home() {
  const [people, setPeople] = useState<ApiPerson[] | null>(null);
  const [chores, setChores] = useState<UiChore[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, c] = await Promise.all([apiGetPeople(), apiGetChores()]);
        if (!alive) return;
        setPeople(p);
        setChores(c.map(asUiChore));
        setError(null);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "failed to load");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const porter = people?.find((x) => x.name === "Porter") ?? null;
  const brickley = people?.find((x) => x.name === "Brickley") ?? null;

  const now = useMemo(() => new Date(), []);

  const meter = useMemo(() => {
    const list = chores ?? [];
    const values = list.map((c) => freshness(now, c.lastDoneAt, c.frequency));
    const avg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
    return Math.round(avg * 100);
  }, [chores, now]);

  const sorted = useMemo(() => {
    const list = chores ?? [];
    const rank = (s: ReturnType<typeof dueStatus>) => {
      if (s === "OVERDUE") return 0;
      if (s === "DUE") return 1;
      return 2;
    };

    return [...list].sort((a, b) => {
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

    const isDueLike = (c: UiChore) => {
      const st = dueStatus(now, c.lastDoneAt, c.frequency);
      return st === "OVERDUE" || st === "DUE";
    };

    if (filter === "DUE") return sorted.filter(isDueLike);
    return sorted.filter((c) => !isDueLike(c));
  }, [sorted, filter, now]);

  const active = openId ? (chores ?? []).find((c) => c.id === openId) ?? null : null;
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

  const finish = async () => {
    if (!active) return;
    const total = active.subtasks.length;
    const done = checkedByChore[active.id]?.size ?? 0;
    if (done !== total) return;

    const r = await apiCompleteChore(active.id);
    setChores((prev) => (prev ?? []).map((c) => (c.id === active.id ? { ...c, lastDoneAt: r.lastDoneAt ? new Date(r.lastDoneAt) : new Date() } : c)));
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

  const openEdit = (c: UiChore) => {
    setDraft({
      title: c.title,
      frequency: c.frequency,
      assignees: {
        porter: !!porter && c.assignees.some((a) => a.id === porter.id),
        brickley: !!brickley && c.assignees.some((a) => a.id === brickley.id),
      },
      subtasksText: c.subtasks.map((s) => s.text).join("\n"),
    });
    setEditor({ open: true, mode: "edit", editId: c.id });
  };

  const saveDraft = async () => {
    const parsed = parseAssigned(draft.title);
    const title = parsed.title;

    const porterOn = draft.assignees.porter || parsed.porter;
    const brickleyOn = draft.assignees.brickley || parsed.brickley;

    const assigneeIds = [
      ...(porterOn && porter ? [porter.id] : []),
      ...(brickleyOn && brickley ? [brickley.id] : []),
    ];

    const subtasks = splitSubtasks(draft.subtasksText).map((t) => ({ text: t }));

    if (title.trim().length === 0) return;
    if (assigneeIds.length === 0) return;
    if (subtasks.length === 0) return;

    if (editor.open && editor.mode === "create") {
      const created = await apiCreateChore({ title, frequency: draft.frequency, assigneeIds, subtasks });
      setChores((prev) => [asUiChore(created), ...(prev ?? [])]);
      setEditor({ open: false });
      return;
    }

    if (editor.open && editor.mode === "edit" && editor.editId) {
      const updated = await apiUpdateChore(editor.editId, { title, frequency: draft.frequency, assigneeIds, subtasks });
      setChores((prev) => (prev ?? []).map((c) => (c.id === editor.editId ? asUiChore(updated) : c)));
      setCheckedByChore((prev) => ({ ...prev, [editor.editId]: new Set<string>() }));
      setEditor({ open: false });
    }
  };

  const deleteActive = async () => {
    if (!(editor.open && editor.mode === "edit" && editor.editId)) return;
    const id = editor.editId;
    await apiDeleteChore(id);
    setChores((prev) => (prev ?? []).filter((c) => c.id !== id));
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
          <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow)]">P + B</div>
        </div>

        {error ? (
          <div className="rounded-[24px] bg-white p-4 text-xs text-[color:var(--terracotta)] shadow-[var(--shadow)]">
            {error}
            <div className="mt-2 text-[rgba(45,41,38,0.55)]">
              Postgres isn’t set up yet, or the API can’t connect.
            </div>
          </div>
        ) : null}

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
                assignees={c.assignees.map((a) => ({ initials: a.initials, color: a.color }))}
                subtasksDone={set.size}
                subtasksTotal={c.subtasks.length}
                onClick={() => setOpenId(c.id)}
                onEdit={() => openEdit(c)}
              />
            );
          })}
        </div>

        {people === null || chores === null ? (
          <div className="mt-6 rounded-[24px] bg-white p-4 text-xs text-[rgba(45,41,38,0.65)] shadow-[var(--shadow)]">
            Loading from database…
          </div>
        ) : null}
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
          completedBy={null}
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

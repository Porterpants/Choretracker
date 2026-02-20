"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Frequency } from "@/lib/choreMath";

export type EditorDraft = {
  title: string;
  frequency: Frequency;
  assignees: { porter: boolean; brickley: boolean };
  subtasksText: string;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  draft: EditorDraft;
  setDraft: (next: EditorDraft) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
};

const freqLabel: Record<Frequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

export function ChoreEditorSheet({
  open,
  mode,
  draft,
  setDraft,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const titleOk = draft.title.trim().length > 0;
  const subtasks = splitSubtasks(draft.subtasksText);
  const subtasksOk = subtasks.length > 0;
  const assigneeOk = draft.assignees.porter || draft.assignees.brickley;

  const canSave = titleOk && subtasksOk && assigneeOk;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Close"
            className="fixed inset-0 z-40 bg-[rgba(45,41,38,0.35)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-xl rounded-t-[28px] bg-white px-5 pb-5 pt-4 shadow-[0_-30px_80px_rgba(45,41,38,0.18)]"
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[rgba(45,41,38,0.12)]" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">{mode === "create" ? "Add chore" : "Edit chore"}</div>
                <div className="mt-1 text-xs text-[rgba(45,41,38,0.6)]">
                  Checklist is required to finish.
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-[rgba(45,41,38,0.06)] px-3 py-1.5 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1 text-xs font-semibold text-[rgba(45,41,38,0.7)]">Title</div>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="e.g., Clean Bathroom"
                  className="w-full rounded-[18px] border border-[rgba(45,41,38,0.12)] bg-white px-4 py-3 text-sm font-medium outline-none focus:shadow-[var(--ring)]"
                />
                {!assigneeOk ? (
                  <div className="mt-1 text-xs text-[color:var(--terracotta)]">Pick at least one assignee.</div>
                ) : null}
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-[rgba(45,41,38,0.7)]">Frequency</div>
                <div className="flex gap-2">
                  {(["DAILY", "WEEKLY", "MONTHLY"] as Frequency[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDraft({ ...draft, frequency: f })}
                      className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                        draft.frequency === f
                          ? "bg-[rgba(45,41,38,0.08)]"
                          : "bg-[rgba(45,41,38,0.04)] hover:bg-[rgba(45,41,38,0.06)]"
                      }`}
                    >
                      {freqLabel[f]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold text-[rgba(45,41,38,0.7)]">Assignees</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDraft({ ...draft, assignees: { ...draft.assignees, porter: !draft.assignees.porter } })}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                      draft.assignees.porter ? "bg-[rgba(74,128,255,0.18)]" : "bg-[rgba(45,41,38,0.04)] hover:bg-[rgba(45,41,38,0.06)]"
                    }`}
                  >
                    P (Porter)
                  </button>
                  <button
                    onClick={() => setDraft({ ...draft, assignees: { ...draft.assignees, brickley: !draft.assignees.brickley } })}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                      draft.assignees.brickley ? "bg-[rgba(139,92,246,0.18)]" : "bg-[rgba(45,41,38,0.04)] hover:bg-[rgba(45,41,38,0.06)]"
                    }`}
                  >
                    B (Brickley)
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-baseline justify-between">
                  <div className="text-xs font-semibold text-[rgba(45,41,38,0.7)]">Subtasks (required)</div>
                  <div className="text-xs text-[rgba(45,41,38,0.55)]">{subtasks.length} detected</div>
                </div>
                <textarea
                  value={draft.subtasksText}
                  onChange={(e) => setDraft({ ...draft, subtasksText: e.target.value })}
                  placeholder={"One per line, or paste with semicolons\n\nScrub tiles\nClean mirror\nEmpty trash\nBleach toilet"}
                  className="min-h-32 w-full resize-none rounded-[18px] border border-[rgba(45,41,38,0.12)] bg-white px-4 py-3 text-sm font-medium outline-none focus:shadow-[var(--ring)]"
                />
                {!subtasksOk ? (
                  <div className="mt-1 text-xs text-[color:var(--terracotta)]">Add at least 1 subtask.</div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              {mode === "edit" && onDelete ? (
                <button
                  onClick={onDelete}
                  className="w-28 rounded-[20px] bg-[rgba(226,114,91,0.14)] px-4 py-3 text-sm font-semibold text-[color:var(--terracotta)]"
                >
                  Delete
                </button>
              ) : null}

              <button
                disabled={!canSave}
                onClick={onSave}
                className="flex-1 rounded-[20px] bg-[color:var(--espresso)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mode === "create" ? "Add chore" : "Save"}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function splitSubtasks(text: string) {
  return text
    .split(/\n|;/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

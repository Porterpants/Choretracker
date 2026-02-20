"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatShortDateTime, nextDueAt } from "@/lib/choreMath";
import type { Frequency } from "@/lib/choreMath";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  frequency: Frequency;
  lastDoneAt: Date | null;
  subtasks: { id: string; text: string }[];
  checkedIds: Set<string>;
  toggle: (id: string) => void;
  onFinish: () => void;
};

export function ChoreSheet({
  open,
  onClose,
  title,
  frequency,
  lastDoneAt,
  subtasks,
  checkedIds,
  toggle,
  onFinish,
}: Props) {
  const doneCount = Array.from(checkedIds).length;
  const total = subtasks.length;
  const allDone = total > 0 && doneCount === total;
  const due = lastDoneAt ? nextDueAt(lastDoneAt, frequency) : null;

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
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold">{title}</div>
                <div className="mt-1 text-xs text-[rgba(45,41,38,0.6)]">
                  {lastDoneAt ? `Last done: ${formatShortDateTime(lastDoneAt)}` : "Never completed"}
                  {due ? ` · Next due: ${formatShortDateTime(due)}` : ""}
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-[rgba(45,41,38,0.06)] px-3 py-1.5 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {subtasks.map((s) => {
                const checked = checkedIds.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-left transition-colors active:scale-[0.995] ${
                      checked
                        ? "border-[rgba(141,163,153,0.55)] bg-[rgba(141,163,153,0.16)]"
                        : "border-[rgba(45,41,38,0.10)] bg-white hover:bg-[rgba(45,41,38,0.03)]"
                    }`}
                  >
                    <div className="text-sm font-medium">{s.text}</div>
                    <div
                      className={`grid size-6 place-items-center rounded-full border ${
                        checked
                          ? "border-[rgba(141,163,153,0.75)] bg-[color:var(--sage)] text-white"
                          : "border-[rgba(45,41,38,0.25)]"
                      }`}
                    >
                      {checked ? "✓" : ""}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <button
                disabled={!allDone}
                onClick={onFinish}
                className={`w-full rounded-[20px] px-4 py-3 text-sm font-semibold shadow-sm transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                  allDone
                    ? "bg-[color:var(--sage)] text-white"
                    : "bg-[rgba(45,41,38,0.10)] text-[color:var(--espresso)]"
                }`}
              >
                {allDone ? "Finish Chore" : `Complete all steps (${doneCount}/${total})`}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

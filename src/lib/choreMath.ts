export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY";

export type DueStatus = "OVERDUE" | "DUE" | "FRESH";

export const frequencyMs = (f: Frequency) => {
  if (f === "DAILY") return 24 * 60 * 60 * 1000;
  if (f === "WEEKLY") return 7 * 24 * 60 * 60 * 1000;
  return 30 * 24 * 60 * 60 * 1000;
};

export const nextDueAt = (lastDoneAt: Date | null, f: Frequency) => {
  if (!lastDoneAt) return null;
  return new Date(lastDoneAt.getTime() + frequencyMs(f));
};

export const dueStatus = (now: Date, lastDoneAt: Date | null, f: Frequency): DueStatus => {
  if (!lastDoneAt) return "OVERDUE";
  const due = nextDueAt(lastDoneAt, f);
  if (!due) return "OVERDUE";
  if (now.getTime() >= due.getTime()) return "DUE";
  return "FRESH";
};

export const freshness = (now: Date, lastDoneAt: Date | null, f: Frequency) => {
  if (!lastDoneAt) return 0;
  const period = frequencyMs(f);
  const elapsed = now.getTime() - lastDoneAt.getTime();
  const x = 1 - elapsed / period;
  return Math.max(0, Math.min(1, x));
};

export const formatShortDateTime = (d: Date) => {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
};

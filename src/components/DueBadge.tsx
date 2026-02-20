import type { DueStatus } from "@/lib/choreMath";

const label: Record<DueStatus, string> = {
  OVERDUE: "Overdue",
  DUE: "Due",
  FRESH: "Fresh",
};

export function DueBadge({ status }: { status: DueStatus }) {
  if (status === "FRESH") {
    return (
      <div className="rounded-full bg-[rgba(141,163,153,0.18)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--espresso)]">
        {label[status]}
      </div>
    );
  }

  if (status === "DUE") {
    return (
      <div className="rounded-full border border-[rgba(226,114,91,0.55)] bg-[rgba(255,255,255,0.65)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--espresso)] backdrop-blur">
        {label[status]}
      </div>
    );
  }

  return (
    <div className="rounded-full bg-[color:var(--terracotta)] px-2.5 py-1 text-[11px] font-semibold text-white">
      {label[status]}
    </div>
  );
}

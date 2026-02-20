import type { DueStatus } from "@/lib/choreMath";
import { DueBadge } from "@/components/DueBadge";
import { AvatarBubble } from "@/components/AvatarBubble";

type Assignee = { initials: string; color: string };

type Props = {
  title: string;
  status: DueStatus;
  subtasksDone: number;
  subtasksTotal: number;
  assignees: Assignee[];
  onClick: () => void;
};

export function ChoreCard({
  title,
  status,
  subtasksDone,
  subtasksTotal,
  assignees,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-[24px] bg-white p-4 text-left shadow-[var(--shadow)] transition-transform active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold">{title}</div>
          <div className="mt-1 text-xs text-[rgba(45,41,38,0.6)]">
            Checklist: <span className="font-semibold text-[color:var(--espresso)]">{subtasksDone}/{subtasksTotal}</span>
          </div>
        </div>
        <DueBadge status={status} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {assignees.map((a) => (
            <div key={a.initials} className="rounded-full ring-2 ring-white">
              <AvatarBubble initials={a.initials} color={a.color} />
            </div>
          ))}
        </div>

        <div className="h-2 w-24 overflow-hidden rounded-full bg-[rgba(45,41,38,0.08)]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.round((subtasksDone / Math.max(1, subtasksTotal)) * 100)}%`,
              backgroundColor: subtasksDone === subtasksTotal ? "var(--sage)" : "rgba(226,114,91,0.75)",
            }}
          />
        </div>
      </div>
    </button>
  );
}

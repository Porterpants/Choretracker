"use client";

import { motion } from "framer-motion";

export function CleanlinessMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div className="rounded-[24px] bg-white p-4 shadow-[var(--shadow)]">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-sm font-semibold">House Cleanliness</div>
          <div className="text-xs text-[rgba(45,41,38,0.6)]">Based on time since chores were last done</div>
        </div>
        <div className="text-2xl font-semibold tabular-nums">{pct}%</div>
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[rgba(45,41,38,0.08)]">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, var(--sage), var(--terracotta))" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>
    </div>
  );
}

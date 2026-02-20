"use client";

import { motion } from "framer-motion";

type Props = {
  label: string;
  onClick: () => void;
};

export function FabButton({ label, onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 grid size-14 place-items-center rounded-full bg-[color:var(--espresso)] text-white shadow-[0_18px_50px_rgba(45,41,38,0.25)]"
      whileTap={{ scale: 0.96 }}
      aria-label={label}
      title={label}
    >
      <span className="text-2xl leading-none">+</span>
    </motion.button>
  );
}

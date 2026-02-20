"use client";

type Item<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  items: Item<T>[];
  value: T;
  onChange: (v: T) => void;
};

export function Segmented<T extends string>({ items, value, onChange }: Props<T>) {
  return (
    <div className="inline-flex rounded-full bg-white p-1 shadow-[var(--shadow)]">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              active ? "bg-[rgba(45,41,38,0.08)] text-[color:var(--espresso)]" : "text-[rgba(45,41,38,0.65)] hover:bg-[rgba(45,41,38,0.05)]"
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

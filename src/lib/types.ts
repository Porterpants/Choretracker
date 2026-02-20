import type { Frequency } from "@/lib/choreMath";

export type PersonKey = "Porter" | "Brickley";

export type Person = {
  key: PersonKey;
  name: string;
  initials: string;
  color: string;
};

export type Subtask = { id: string; text: string };

export type Chore = {
  id: string;
  title: string;
  frequency: Frequency;
  lastDoneAt: Date | null;
  assignees: PersonKey[];
  subtasks: Subtask[];
};

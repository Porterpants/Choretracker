import type { Frequency } from "@/lib/choreMath";

export type ApiPerson = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

export type ApiSubtask = { id: string; choreId: string; text: string; order: number };

export type ApiChore = {
  id: string;
  title: string;
  frequency: Frequency;
  lastDoneAt: string | null;
  assignees: ApiPerson[];
  subtasks: ApiSubtask[];
};

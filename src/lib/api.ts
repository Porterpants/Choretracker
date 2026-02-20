import type { ApiChore, ApiPerson } from "@/lib/apiTypes";

export async function apiGetPeople(): Promise<ApiPerson[]> {
  const r = await fetch("/api/people", { cache: "no-store" });
  if (!r.ok) throw new Error("people fetch failed");
  return r.json();
}

export async function apiGetChores(): Promise<ApiChore[]> {
  const r = await fetch("/api/chores", { cache: "no-store" });
  if (!r.ok) throw new Error("chores fetch failed");
  return r.json();
}

export async function apiCreateChore(payload: {
  title: string;
  frequency: string;
  assigneeIds: string[];
  subtasks: { text: string }[];
}): Promise<ApiChore> {
  const r = await fetch("/api/chores", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function apiUpdateChore(
  id: string,
  payload: {
    title: string;
    frequency: string;
    assigneeIds: string[];
    subtasks: { text: string }[];
  }
): Promise<ApiChore> {
  const r = await fetch(`/api/chores/${id}` as string, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function apiDeleteChore(id: string) {
  const r = await fetch(`/api/chores/${id}` as string, { method: "DELETE" });
  if (!r.ok) throw new Error("delete failed");
}

export async function apiCompleteChore(id: string, completedByPersonId?: string) {
  const r = await fetch(`/api/chores/${id}/complete` as string, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ completedByPersonId: completedByPersonId ?? null }),
  });
  if (!r.ok) throw new Error("complete failed");
  return r.json() as Promise<{ id: string; lastDoneAt: string | null }>;
}

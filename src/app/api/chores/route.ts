import { prisma } from "@/lib/prisma";
import { Frequency } from "@prisma/client";

const asFrequency = (x: unknown) => {
  if (x === "DAILY") return Frequency.DAILY;
  if (x === "WEEKLY") return Frequency.WEEKLY;
  if (x === "MONTHLY") return Frequency.MONTHLY;
  return null;
};

export async function GET() {
  const chores = await prisma.chore.findMany({
    orderBy: { title: "asc" },
    include: {
      assignees: { include: { person: true } },
      subtasks: { orderBy: { order: "asc" } },
    },
  });

  return Response.json(
    chores.map((c) => ({
      id: c.id,
      title: c.title,
      frequency: c.frequency,
      lastDoneAt: c.lastDoneAt,
      assignees: c.assignees.map((a) => a.person),
      subtasks: c.subtasks,
    }))
  );
}

export async function POST(req: Request) {
  const body = await req.json();

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const frequency = asFrequency(body.frequency);
  const assigneeIds = Array.isArray(body.assigneeIds) ? body.assigneeIds.filter((x: unknown) => typeof x === "string") : [];
  const subtasks = Array.isArray(body.subtasks) ? body.subtasks : [];

  if (!title) return new Response("title required", { status: 400 });
  if (!frequency) return new Response("frequency invalid", { status: 400 });
  if (assigneeIds.length === 0) return new Response("assignees required", { status: 400 });
  if (subtasks.length === 0) return new Response("subtasks required", { status: 400 });

  const created = await prisma.chore.create({
    data: {
      title,
      frequency,
      assignees: {
        createMany: {
          data: assigneeIds.map((personId: string) => ({ personId })),
        },
      },
      subtasks: {
        createMany: {
          data: (subtasks as unknown[]).map((t: unknown, idx: number) => {
            const text = typeof (t as { text?: unknown })?.text === "string" ? (t as { text: string }).text : "";
            return { text: text.trim(), order: idx };
          }),
        },
      },
    },
    include: {
      assignees: { include: { person: true } },
      subtasks: { orderBy: { order: "asc" } },
    },
  });

  return Response.json({
    id: created.id,
    title: created.title,
    frequency: created.frequency,
    lastDoneAt: created.lastDoneAt,
    assignees: created.assignees.map((a) => a.person),
    subtasks: created.subtasks,
  });
}

import { prisma } from "@/lib/prisma";
import { Frequency } from "@prisma/client";

const asFrequency = (x: unknown) => {
  if (x === "DAILY") return Frequency.DAILY;
  if (x === "WEEKLY") return Frequency.WEEKLY;
  if (x === "MONTHLY") return Frequency.MONTHLY;
  return null;
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const frequency = asFrequency(body.frequency);
  const assigneeIds = Array.isArray(body.assigneeIds) ? body.assigneeIds.filter((x: unknown) => typeof x === "string") : [];
  const subtasks = Array.isArray(body.subtasks) ? body.subtasks : [];

  if (!title) return new Response("title required", { status: 400 });
  if (!frequency) return new Response("frequency invalid", { status: 400 });
  if (assigneeIds.length === 0) return new Response("assignees required", { status: 400 });
  if (subtasks.length === 0) return new Response("subtasks required", { status: 400 });

  const updated = await prisma.chore.update({
    where: { id },
    data: {
      title,
      frequency,
      assignees: {
        deleteMany: {},
        createMany: { data: assigneeIds.map((personId: string) => ({ personId })) },
      },
      subtasks: {
        deleteMany: {},
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
    id: updated.id,
    title: updated.title,
    frequency: updated.frequency,
    lastDoneAt: updated.lastDoneAt,
    assignees: updated.assignees.map((a) => a.person),
    subtasks: updated.subtasks,
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.chore.delete({ where: { id } });
  return new Response(null, { status: 204 });
}

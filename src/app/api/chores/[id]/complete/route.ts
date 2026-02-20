import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const completedByPersonId = typeof body.completedByPersonId === "string" ? body.completedByPersonId : null;

  const chore = await prisma.chore.update({
    where: { id },
    data: { lastDoneAt: new Date() },
  });

  await prisma.completion.create({
    data: {
      choreId: id,
      completedAt: chore.lastDoneAt ?? new Date(),
      completedByPersonId: completedByPersonId ?? undefined,
    },
  });

  return Response.json({ id: chore.id, lastDoneAt: chore.lastDoneAt });
}

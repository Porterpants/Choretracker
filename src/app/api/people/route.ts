import { prisma } from "@/lib/prisma";

export async function GET() {
  const people = await prisma.person.findMany({ orderBy: { name: "asc" } });
  return Response.json(people);
}

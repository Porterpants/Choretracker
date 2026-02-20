import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  await prisma.person.upsert({
    where: { name: "Porter" },
    update: { initials: "P", color: "#4A80FF" },
    create: { name: "Porter", initials: "P", color: "#4A80FF" },
  });

  await prisma.person.upsert({
    where: { name: "Brickley" },
    update: { initials: "B", color: "#8B5CF6" },
    create: { name: "Brickley", initials: "B", color: "#8B5CF6" },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

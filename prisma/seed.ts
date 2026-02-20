import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

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
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });

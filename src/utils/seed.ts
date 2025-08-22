import { prisma } from "./prisma.js";

async function main() {
  const exists = await prisma.globalTreeStats.findFirst();
  if (!exists) {
    await prisma.globalTreeStats.create({
      data: { id: 1, totalUses: 0, totalTrees: 0, totalPointsIssued: 0 },
    });
    console.log("Seeded GlobalTreeStats with id=1");
  } else {
    console.log("GlobalTreeStats already exists");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

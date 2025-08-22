import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function withTx<T>(fn: (tx: PrismaClient) => Promise<T>) {
  return prisma.$transaction(async (tx: PrismaClient) => fn(tx));
}

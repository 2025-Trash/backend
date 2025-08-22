// src/utils/prisma.ts

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// fn의 tx 매개변수와 txClient 매개변수 모두 any로 지정
export async function withTx<T>(fn: (tx: any) => Promise<T>) {
  return prisma.$transaction(async (txClient: any) => fn(txClient));
}
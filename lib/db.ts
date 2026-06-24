import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
    }),
  });
}

function hasLatestDelegates(client: PrismaClient | undefined): client is PrismaClient {
  if (!client) return false;
  const delegateProbe = client as unknown as Record<string, unknown>;
  return Boolean(delegateProbe.user && delegateProbe.product && delegateProbe.cartItem && delegateProbe.order);
}

const cachedClient = globalForPrisma.prisma;
const prismaClient = hasLatestDelegates(cachedClient) ? cachedClient : createPrismaClient();
export const prisma: PrismaClient = prismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

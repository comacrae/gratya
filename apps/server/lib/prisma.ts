import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL env var is undefined");

const globalForPrismaClient = globalThis as unknown as {
  client?: PrismaClient;
};

export const prisma =
  globalForPrismaClient.client ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: dbUrl,
      connectionTimeoutMillis: 5000,
    }),
  });

// for dev env we need to store the global client so we don't get clients recreated on module reloads
if (process.env.NODE_ENV !== "production")
  globalForPrismaClient.client = prisma;

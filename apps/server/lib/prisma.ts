import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ENV_VARS } from "@/util/env";

const dbUrl = ENV_VARS.DATABASE_URL;

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

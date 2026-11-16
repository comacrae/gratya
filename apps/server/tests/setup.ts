/*before every test file, swap in the fake supabase.
before every test, empty all public tables.
after the test file is finished, close prims'as connection*/

import { vi, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

//mock @/lib/supabse with a factory that returns the fake module
vi.mock("@/lib/prisma", () => import("./helpers/fake-supabase"));

// before each test, empty all public tables
beforeEach(async () => {
  const rows = await prisma.$queryRaw<
    { tablename: string }[]
  >`SELECT tablename from pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await prisma.$executeRawUnsafe(
    `TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(", ")} CASCADE`,
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});

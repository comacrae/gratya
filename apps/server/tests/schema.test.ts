/**
 * Guarantees that every table in migration has RLS (row level security) turned on.
 */
import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";

/**
 * pg_class catalog
 * relname: table name
 * relkind: 'r' = ordinary table (excluding views, indexes, sequences)
 * relrowsecurity: true if ENABLE ROW LEVEL SECURITY was run
 * relnamespace: the id of the schema
 *
 * pg_namespace catalog
 * nspname: schema name ('public')
 */

describe("schema", () => {
  it("every table in public schema has row level security enabled", async () => {
    const rows = await prisma.$queryRaw<
      { relanme: string; relrowsecurity: boolean }[]
    >`
        SELECT c.relname, c.relrowsecurity 
        FROM pg_class c JOIN pg_namespace n
        ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname <> '_prisma_migrations'
        `;

    expect(rows.length).toBeGreaterThan(0);
    expect(rows.filter((r) => r.relrowsecurity === false).length).toBe(0);
  });
});

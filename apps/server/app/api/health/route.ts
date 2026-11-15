import { prisma } from "@/lib/prisma";

export const GET = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: true }, { status: 200 });
  } catch (err) {
    console.error(err instanceof Error ? err : String(err));
    return Response.json({ ok: false, db: false }, { status: 503 });
  }
};

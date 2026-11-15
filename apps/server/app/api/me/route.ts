import { requireUser } from "@/lib/auth";
import { handler } from "@/lib/errors";
import { parseBody } from "@/lib/validate";
import { UpdateMeSchema } from "@gratya/shared";
import { prisma } from "@/lib/prisma";

export const GET = handler(async (req: Request): Promise<Response> => {
  const user = await requireUser(req);
  return Response.json(user);
});

export const PATCH = handler(async (req: Request): Promise<Response> => {
  const user = await requireUser(req);
  const { displayName } = await parseBody(req, UpdateMeSchema);
  return Response.json(
    await prisma.user.update({ where: { id: user.id }, data: { displayName } }),
  );
});

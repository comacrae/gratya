import { requireUser } from "@/lib/auth";
import { handler } from "@/lib/errors";

export const GET = handler(async (req: Request): Promise<Response> => {
  const user = await requireUser(req);
  return Response.json(user);
});

import { APP_NAME } from "@gratya/shared";

export const GET = () => {
  return Response.json({ ok: true, app: APP_NAME }, { status: 200 });
};

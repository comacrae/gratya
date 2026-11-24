import { ApiError } from "@gratya/shared";
import { z } from "zod";

type RouteFn<C> = (req: Request, ctx: C) => Promise<Response>;

export const handler =
  <C>(fn: RouteFn<C>) =>
  async (req: Request, ctx: C) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return Response.json(
          {
            error: {
              code: err.code,
              message: err.message,
              details: err.details,
            },
          },
          { status: err.status },
        );
      } else if (err instanceof z.ZodError) {
        return Response.json(
          {
            error: {
              code: "VALIDATION",
              message: "Invalid request",
              details: z.flattenError(err),
            },
          },
          { status: 422 },
        );
      } else {
        console.error("Unhandled", err);
        return Response.json(
          { error: { code: "INTERNAL", message: "Something went wrong" } },
          { status: 500 },
        );
      }
    }
  };

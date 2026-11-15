import { ErrorStatus, ErrorCode, ERROR_CODE_STATUS_MAP } from "@gratya/shared";
import { z } from "zod";

export class ApiError extends Error {
  readonly status: ErrorStatus;
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = ERROR_CODE_STATUS_MAP[code];
  }
}

type RouteFn = <C>(req: Request, ctx: C) => Promise<Response>;

export const handler =
  <C>(fn: RouteFn) =>
  async (req: Request, ctx: C) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return Response.json(
          { error: { code: err.code, message: err.message } },
          { status: err.status },
        );
      } else if (err instanceof z.ZodError) {
        return Response.json(
          {
            error: {
              code: "VALIDATION",
              message: err.message,
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

import { z } from "zod";

export const ERROR_CODE_STATUS_MAP = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION: 422,
  INTERNAL: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_CODE_STATUS_MAP;
export type ErrorStatus = (typeof ERROR_CODE_STATUS_MAP)[ErrorCode];

export class ApiError extends Error {
  readonly status: ErrorStatus;
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = ERROR_CODE_STATUS_MAP[code];
  }
}

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.enum(
      Object.keys(ERROR_CODE_STATUS_MAP) as [ErrorCode, ...ErrorCode[]],
    ),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

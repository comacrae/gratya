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

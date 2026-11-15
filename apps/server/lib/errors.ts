import { ErrorStatus, ErrorCode, ERROR_CODE_STATUS_MAP } from "@gratya/shared";

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

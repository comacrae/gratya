import { ErrorStatus, ErrorCode, CodeStatusMap } from "@gratya/shared";

export class ApiError extends Error {
  readonly status: ErrorStatus;
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = CodeStatusMap[code];
  }
}

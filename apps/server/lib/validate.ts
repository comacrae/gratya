import { z } from "zod";
import { ApiError } from "./errors";
export const parseBody = async <S extends z.ZodType>(
  req: Request,
  schema: S,
): Promise<z.infer<S>> => {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError("VALIDATION", "Body must be JSON");
  }
  return schema.parse(raw);
};

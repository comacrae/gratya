import { z } from "zod";

export const UpdateMeSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  email: z.email().trim().min(1),
});

import { z } from "zod";
export const MeSchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  email: z.string(),
  createdAt: z.string(),
});

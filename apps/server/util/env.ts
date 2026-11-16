import { z } from "zod";

export const ENV_VARS = z
  .object({
    DATABASE_URL: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_URL: z.string().min(1),
  })
  .parse(process.env);

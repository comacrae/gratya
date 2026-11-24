import { z } from "zod";

export const EmailPasswordSignInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

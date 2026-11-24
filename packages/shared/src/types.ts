import { z } from "zod";
import {
  HealthSchema,
  UpdateMeSchema,
  EmailPasswordSignInSchema,
} from "./schemas";
export type UpdateMe = z.infer<typeof UpdateMeSchema>;
export type Health = z.infer<typeof HealthSchema>;
export type EmailPasswordSignIn = z.infer<typeof EmailPasswordSignInSchema>;

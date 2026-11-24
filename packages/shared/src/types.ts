import { z } from "zod";
import {
  HealthSchema,
  UpdateMeSchema,
  EmailPasswordSignInSchema,
  EmailPasswordSignUpSchema,
  MeSchema,
} from "./schemas";
export type UpdateMe = z.infer<typeof UpdateMeSchema>;
export type Health = z.infer<typeof HealthSchema>;
export type EmailPasswordSignIn = z.infer<typeof EmailPasswordSignInSchema>;
export type EmailPasswordSignUp = z.infer<typeof EmailPasswordSignUpSchema>;
export type Me = z.infer<typeof MeSchema>;

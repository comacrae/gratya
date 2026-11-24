import { z } from "zod";

const displayName = z.string().trim().min(1).max(40);

export const UpdateMeSchema = z.object({
  displayName,
});

export const EmailPasswordSignInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const EmailPasswordSignUpSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "Use at least 6 characters"),
  displayName,
});

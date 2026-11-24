import { z } from "zod";
import { HealthSchema, UpdateMeSchema } from "./schemas";
export type UpdateMe = z.infer<typeof UpdateMeSchema>;
export type Health = z.infer<typeof HealthSchema>;
